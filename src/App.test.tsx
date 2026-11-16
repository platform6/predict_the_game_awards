import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { AuthProvider, defaultDisplayName, redirectError } from './auth/AuthProvider';

const mocks = vi.hoisted(() => ({
  session: null as unknown,
  player: null as unknown,
  signInWithOAuth: vi.fn(async () => ({ error: null })),
  signOut: vi.fn(async () => ({ error: null })),
}));

vi.mock('./lib/supabase', () => ({
  supabaseConfigured: true,
  supabase: {
    auth: {
      getSession: async () => ({ data: { session: mocks.session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOAuth: mocks.signInWithOAuth,
      signOut: mocks.signOut,
    },
    rpc: async () => ({ data: mocks.player, error: null }),
  },
}));

const session = {
  user: { email: 'pat@example.com', user_metadata: { full_name: 'Pat Example' } },
};

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  mocks.session = null;
  mocks.player = null;
  mocks.signInWithOAuth.mockClear();
});

afterEach(() => {
  cleanup();
  window.history.replaceState(null, '', '/');
});

describe('App', () => {
  it('shows Google sign-in and the privacy and terms links when signed out', async () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Picks' })).toBeTruthy();
    const button = await screen.findByRole('button', { name: /sign in with google/i });
    await userEvent.click(button);
    expect(mocks.signInWithOAuth).toHaveBeenCalledWith(expect.objectContaining({ provider: 'google' }));
    expect(screen.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/privacy');
    expect(screen.getByRole('link', { name: 'Terms' }).getAttribute('href')).toBe('/terms');
  });

  it('shows the player once signed in', async () => {
    mocks.session = session;
    mocks.player = { id: 'p1', user_id: 'u1', display_name: 'Pat', is_admin: true, created_at: '' };
    renderAt('/');
    expect(await screen.findByText('Pat')).toBeTruthy();
    expect(screen.getByText('admin')).toBeTruthy();
    expect(screen.queryByRole('button', { name: /sign in with google/i })).toBeNull();
  });

  it('shows a refused sign-up from the OAuth redirect', async () => {
    window.history.replaceState(null, '', '/#error=access_denied&error_description=New+accounts+can+only+be+created+with+Google+sign-in.');
    renderAt('/');
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'New accounts can only be created with Google sign-in.');
  });

  it('serves the privacy policy page', () => {
    renderAt('/privacy');
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeTruthy();
  });

  it('serves the terms of service page', () => {
    renderAt('/terms');
    expect(screen.getByRole('heading', { name: 'Terms of Service' })).toBeTruthy();
  });
});

describe('auth helpers', () => {
  it('defaultDisplayName prefers the Google name, then the email', () => {
    expect(defaultDisplayName(session as never)).toBe('Pat Example');
    expect(defaultDisplayName({ user: { email: 'sam@example.com', user_metadata: {} } } as never)).toBe('sam');
  });

  it('redirectError reads error_description from the hash or query', () => {
    expect(redirectError('#error_description=Nope', '')).toBe('Nope');
    expect(redirectError('', '?error_description=Also+nope')).toBe('Also nope');
    expect(redirectError('#access_token=x', '')).toBeNull();
  });
});
