// Row types for the tga_ tables (supabase/migrations). Keep in step with the SQL.

export interface Player {
  id: string;
  user_id: string | null;
  display_name: string;
  is_admin: boolean;
  created_at: string;
}

export interface Show {
  id: string;
  year: number;
  name: string;
  /** Picks lock at this time; null means not scheduled yet (still open). */
  starts_at: string | null;
  created_at: string;
}

export type CategoryKind = 'award' | 'reveal';

export interface Category {
  id: string;
  show_id: string;
  kind: CategoryKind;
  name: string;
  position: number;
  /** Award result. */
  winner_nominee_id: string | null;
  /** Reveal result. */
  answer: boolean | null;
  created_at: string;
}

export interface Nominee {
  id: string;
  category_id: string;
  name: string;
  detail: string | null;
  position: number;
  created_at: string;
}

export interface Pick {
  player_id: string;
  category_id: string;
  nominee_id: string | null;
  answer: boolean | null;
  updated_at: string;
}

export interface LeaderboardRow {
  show_id: string;
  player_id: string;
  display_name: string;
  points: number;
  /** How many of this player's picked categories have a result yet. */
  decided: number;
  picks: number;
}
