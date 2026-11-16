// Past years' picks, cleaned up from the owner's Google Form response sheets.
// No emails here: the repo is public. Emails for linking past players to their
// Google accounts live in the untracked data/history/emails.local.json.

/** Stable key for a player across years (the key in emails.local.json). */
export type PlayerKey = string;

export interface HistoryPlayer {
  key: PlayerKey;
  name: string;
}

export interface AwardCategory {
  kind: 'award';
  name: string;
  /** Exact nominee name; must be in `nominees`. */
  winner: string;
  /** The winner plus every nominee someone picked (not the full official list). */
  nominees: { name: string; detail?: string }[];
  picks: Record<PlayerKey, string>;
}

export interface RevealCategory {
  kind: 'reveal';
  name: string;
  answer: boolean;
  picks: Record<PlayerKey, boolean>;
}

export type HistoryCategory = AwardCategory | RevealCategory;

export interface HistoryShow {
  year: number;
  name: string;
  startsAt: string;
  players: HistoryPlayer[];
  categories: HistoryCategory[];
}

/** Award category where `picks` is player -> nominee name, nominee list derived from picks + winner. */
export function award(
  name: string,
  winner: string,
  picks: Record<PlayerKey, string>,
  details: Record<string, string> = {},
): AwardCategory {
  const names = [winner, ...Object.values(picks)].filter((n, i, all) => all.indexOf(n) === i);
  return {
    kind: 'award',
    name,
    winner,
    nominees: names.map((n) => (details[n] ? { name: n, detail: details[n] } : { name: n })),
    picks,
  };
}

export function reveal(name: string, answer: boolean, picks: Record<PlayerKey, boolean>): RevealCategory {
  return { kind: 'reveal', name, answer, picks };
}
