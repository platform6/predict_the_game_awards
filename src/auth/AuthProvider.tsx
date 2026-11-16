import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Player } from '../lib/types';

interface AuthState {
  /** True until the stored session (and player) has been loaded. */
  loading: boolean;
  session: Session | null;
  player: Player | null;
  error: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  rename: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Name to use the first time a player joins: their Google name, else the email's local part. */
export function defaultDisplayName(session: Session): string {
  const meta = session.user.user_metadata as { full_name?: string; name?: string };
  const name = meta.full_name ?? meta.name ?? session.user.email?.split('@')[0] ?? 'Player';
  return name.trim().slice(0, 40) || 'Player';
}

/** Error passed back on the OAuth redirect (e.g. a refused sign-up), if any. */
export function redirectError(hash: string, search: string): string | null {
  for (const raw of [hash.replace(/^#/, ''), search.replace(/^\?/, '')]) {
    const description = new URLSearchParams(raw).get('error_description');
    if (description) return description;
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(() => redirectError(window.location.hash, window.location.search));

  // Creates the player on first sign-in, or links an imported past player by email.
  const join = useCallback(async (s: Session) => {
    const { data, error } = await supabase.rpc('tga_join', { p_display_name: defaultDisplayName(s) });
    if (error) {
      setError(error.message);
      setPlayer(null);
    } else {
      setError(null);
      setPlayer(data as Player);
    }
  }, []);

  useEffect(() => {
    if (redirectError(window.location.hash, window.location.search)) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await join(data.session);
      if (active) setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (!s) setPlayer(null);
      // Supabase runs this callback inside its auth lock, so call the API after it returns.
      else if (event === 'SIGNED_IN') setTimeout(() => void join(s), 0);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [join]);

  const signIn = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) setError(error.message);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setPlayer(null);
  }, []);

  const rename = useCallback(
    async (displayName: string) => {
      if (!player) return;
      const { data, error } = await supabase
        .from('tga_players')
        .update({ display_name: displayName.trim() })
        .eq('id', player.id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      setPlayer(data as Player);
    },
    [player],
  );

  return (
    <AuthContext.Provider value={{ loading, session, player, error, signIn, signOut, rename }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
