import { supabaseConfigured } from './lib/supabase';

export default function App() {
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
    </main>
  );
}
