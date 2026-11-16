import { Link } from 'react-router-dom';
import AccountBar from '../auth/AccountBar';
import { useAuth } from '../auth/AuthProvider';
import { supabaseConfigured } from '../lib/supabase';

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

export default function Home() {
  const { loading, session, player, error, signIn } = useAuth();

  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">The Game Awards 2026</p>
      <h1 className="text-4xl font-bold">Picks</h1>
      <p className="text-zinc-400">Pick the winners, then watch the leaderboard live on show night.</p>

      {!supabaseConfigured && (
        <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          Supabase isn't configured: set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.
        </p>
      )}

      <div className="mt-4 min-h-12">
        {loading ? (
          <p className="text-sm text-zinc-500">Loading…</p>
        ) : session && player ? (
          <AccountBar />
        ) : session && !error ? (
          <p className="text-sm text-zinc-500">Setting up your player…</p>
        ) : (
          <button
            type="button"
            onClick={() => void signIn()}
            className="flex items-center gap-2 rounded-md bg-white px-4 py-2 font-medium text-zinc-900 shadow hover:bg-zinc-100"
          >
            <GoogleLogo />
            Sign in with Google
          </button>
        )}
      </div>

      {error && (
        <p role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      <footer className="mt-8 flex gap-4 text-xs text-zinc-500">
        <Link to="/privacy" className="hover:text-zinc-300">
          Privacy
        </Link>
        <Link to="/terms" className="hover:text-zinc-300">
          Terms
        </Link>
      </footer>
    </main>
  );
}
