import { useState, type FormEvent } from 'react';
import { useAuth } from './AuthProvider';

/** Signed-in player's name (click to rename) and a sign-out button. */
export default function AccountBar() {
  const { player, signOut, rename } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!player) return null;

  async function save(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 40) {
      setError('Use 1 to 40 characters.');
      return;
    }
    try {
      await rename(trimmed);
      setEditing(false);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
      {editing ? (
        <form onSubmit={save} className="flex items-center gap-2">
          <input
            aria-label="Display name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            autoFocus
            className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-zinc-100"
          />
          <button type="submit" className="rounded-md bg-amber-400 px-2 py-1 font-medium text-zinc-950">
            Save
          </button>
          <button type="button" onClick={() => setEditing(false)} className="text-zinc-400 hover:text-zinc-200">
            Cancel
          </button>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => {
            setName(player.display_name);
            setEditing(true);
          }}
          title="Change your display name"
          className="text-zinc-300 hover:text-white"
        >
          Signed in as <span className="font-semibold text-zinc-100">{player.display_name}</span>
          {player.is_admin && (
            <span className="ml-2 rounded bg-amber-400/15 px-1.5 py-0.5 text-xs text-amber-300">admin</span>
          )}
        </button>
      )}
      <button type="button" onClick={() => void signOut()} className="text-zinc-500 hover:text-zinc-300">
        Sign out
      </button>
      {error && (
        <p role="alert" className="w-full text-center text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
