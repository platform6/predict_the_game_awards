import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import App from './App';

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('App', () => {
  it('renders the landing page with privacy and terms links', () => {
    renderAt('/');
    expect(screen.getByRole('heading', { name: 'Picks' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Privacy' }).getAttribute('href')).toBe('/privacy');
    expect(screen.getByRole('link', { name: 'Terms' }).getAttribute('href')).toBe('/terms');
  });

  it('serves the privacy policy and terms pages', () => {
    renderAt('/privacy');
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeTruthy();
  });

  it('serves the terms of service page', () => {
    renderAt('/terms');
    expect(screen.getByRole('heading', { name: 'Terms of Service' })).toBeTruthy();
  });
});
