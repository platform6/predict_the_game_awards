import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <Link to="/" className="text-sm text-amber-400 hover:text-amber-300">← Game Awards Picks</Link>
      <h1 className="mt-6 text-3xl font-bold">{title}</h1>
      <p className="mt-1 text-sm text-zinc-500">Last updated November 16, 2026</p>
      <div className="mt-8 space-y-4 leading-relaxed text-zinc-300 [&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-zinc-100 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-6">
        {children}
      </div>
    </main>
  );
}

export function Privacy() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Game Awards Picks is a small, private pick'em game for a group of friends predicting The Game Awards winners.
        It is not a commercial service.
      </p>
      <h2>What we collect</h2>
      <ul>
        <li>When you sign in with Google: your name, email address and Google account id.</li>
        <li>What you enter in the game: your display name and your picks.</li>
      </ul>
      <h2>How it's used</h2>
      <p>
        Only to run the game: to sign you in, show your name on the leaderboard, and score your picks. Your email is
        used to sign you in and to link you to picks you made in earlier years; it is not shown to other players.
      </p>
      <h2>Who can see it</h2>
      <p>
        Other signed-in players see your display name, your score, and your picks once each show has started. Nothing is
        sold, shared with advertisers, or used for tracking. There are no ads or analytics.
      </p>
      <h2>Where it's stored</h2>
      <p>
        In a database hosted by Supabase, and the site is served by Netlify. Google handles sign-in; we never see your
        Google password.
      </p>
      <h2>Deleting your data</h2>
      <p>
        Ask the person who invited you to the game and your account and picks will be deleted. You can also remove the
        app's access at any time from your Google Account's security settings.
      </p>
    </LegalPage>
  );
}

export function Terms() {
  return (
    <LegalPage title="Terms of Service">
      <p>
        Game Awards Picks is a free, just-for-fun pick'em game among friends. By signing in you agree to these terms.
      </p>
      <h2>Using the game</h2>
      <ul>
        <li>Make your own picks, and only with your own account.</li>
        <li>Pick a display name that's fine for the group to see.</li>
        <li>Don't try to break, overload or get around the game's rules (such as changing picks after the show starts).</li>
      </ul>
      <h2>No prizes, no guarantees</h2>
      <p>
        There is no money involved. The game is provided as is: it may change, have bugs, or go offline, and scores can
        be corrected if a result was entered wrongly.
      </p>
      <h2>Not affiliated</h2>
      <p>This is a fan project and is not affiliated with or endorsed by The Game Awards.</p>
      <h2>Ending access</h2>
      <p>
        You can stop playing at any time and ask for your data to be deleted (see the Privacy Policy). Access can be
        removed for anyone who misuses the game.
      </p>
    </LegalPage>
  );
}
