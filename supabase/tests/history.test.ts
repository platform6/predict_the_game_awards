import { describe, expect, it } from 'vitest';
import { buildHistorySql, historyShows } from '../../scripts/history-sql';
import type { HistoryShow } from '../../data/history/types';
import { as, createUser, freshDb } from './harness';

async function standings(sql: string, setup?: (db: Awaited<ReturnType<typeof freshDb>>) => Promise<void>) {
  const db = await freshDb();
  await setup?.(db);
  await db.exec(sql);
  const res = await db.query<{ year: number; display_name: string; points: number; picks: number }>(
    `select s.year, l.display_name, l.points, l.picks
       from tga_leaderboard l join tga_shows s on s.id = l.show_id
      order by s.year, l.points desc`,
  );
  return { db, rows: res.rows };
}

describe('history data', () => {
  it.each(historyShows.map((s): [number, HistoryShow] => [s.year, s]))('%i is consistent', (_year, show) => {
    const keys = show.players.map((p) => p.key);
    for (const c of show.categories) {
      expect(Object.keys(c.picks).sort(), c.name).toEqual([...keys].sort());
      if (c.kind === 'award') {
        const names = c.nominees.map((n) => n.name);
        expect(names, c.name).toContain(c.winner);
        for (const pick of Object.values(c.picks)) expect(names, c.name).toContain(pick);
      }
    }
  });
});

describe('history import', () => {
  it('imports both years with the expected final standings', async () => {
    const { rows } = await standings(buildHistorySql(historyShows));
    expect(rows).toEqual([
      { year: 2024, display_name: 'Dave', points: 19, picks: 33 },
      { year: 2024, display_name: 'Garrett', points: 15, picks: 33 },
      { year: 2024, display_name: 'Brian', points: 14, picks: 33 },
      { year: 2025, display_name: 'Garrett', points: 23, picks: 31 },
      { year: 2025, display_name: 'Dave', points: 17, picks: 31 },
      { year: 2025, display_name: 'Chris', points: 9, picks: 31 },
    ]);
  });

  it('is safe to run twice', async () => {
    const sql = buildHistorySql(historyShows);
    const { db } = await standings(sql);
    await db.exec(sql);
    const counts = await db.query<{ players: number; picks: number }>(
      'select (select count(*)::int from tga_players) as players, (select count(*)::int from tga_picks) as picks',
    );
    expect(counts.rows[0]).toEqual({ players: 4, picks: 3 * 33 + 3 * 31 });
  });

  it('links a past player to their Google account when they sign in later', async () => {
    const { db } = await standings(buildHistorySql(historyShows, { dave: 'dave@example.com' }));
    const dave = await createUser(db, 'Dave@example.com');
    const player = await as(db, dave, (tx) => tx.query<{ id: string; display_name: string }>('select (tga_join($1)).*', ['D']));
    expect(player.rows[0].display_name).toBe('Dave');
    const picks = await db.query<{ n: number }>('select count(*)::int as n from tga_picks where player_id = $1', [player.rows[0].id]);
    expect(picks.rows[0].n).toBe(33 + 31);
  });

  it('attaches picks to a player who signed in before the import', async () => {
    let existing = '';
    const { db } = await standings(buildHistorySql(historyShows, { garrett: 'garrett@example.com' }), async (db) => {
      const user = await createUser(db, 'garrett@example.com');
      existing = await as(db, user, async (tx) => (await tx.query<{ id: string }>('select (tga_join($1)).id', ['G'])).rows[0].id);
    });
    const res = await db.query<{ n: number }>('select count(*)::int as n from tga_picks where player_id = $1', [existing]);
    expect(res.rows[0].n).toBe(33 + 31);
  });
});
