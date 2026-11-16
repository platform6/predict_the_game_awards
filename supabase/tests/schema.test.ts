import type { PGlite } from '@electric-sql/pglite';
import { beforeEach, describe, expect, it } from 'vitest';
import { as, createUser, freshDb, type Tx, type User } from './harness';

interface Ids {
  show: string;
  goty: string;
  reveal: string;
  astro: string;
  elden: string;
}

let db: PGlite;
let admin: User;
let alice: User;
let bob: User;
let ids: Ids;

async function one<T>(tx: Tx | PGlite, sql: string, params: unknown[] = []): Promise<T> {
  const res = await tx.query<T>(sql, params);
  return res.rows[0];
}

async function join(user: User, name: string): Promise<string> {
  return as(db, user, async (tx) => (await one<{ id: string }>(tx, 'select (tga_join($1)).id', [name])).id);
}

/** Show starting in `hours` from now (negative = already started). */
async function setStart(hours: number) {
  await db.query(`update tga_shows set starts_at = now() + make_interval(hours => $1) where id = $2`, [hours, ids.show]);
}

beforeEach(async () => {
  db = await freshDb();
  admin = await createUser(db, 'owner@example.com');
  alice = await createUser(db, 'Alice@Example.com');
  bob = await createUser(db, 'bob@example.com');

  await join(admin, 'Owner');
  // Bootstrapping the first admin is done in SQL, without a signed-in user.
  await db.query('update tga_players set is_admin = true where user_id = $1', [admin.id]);

  ids = await as(db, admin, async (tx) => {
    const show = (await one<{ id: string }>(tx, `insert into tga_shows (year, name, starts_at) values (2024, 'TGA 2024', now() + interval '1 day') returning id`)).id;
    const goty = (await one<{ id: string }>(tx, `insert into tga_categories (show_id, kind, name, position) values ($1, 'award', 'Game of the Year', 1) returning id`, [show])).id;
    const reveal = (await one<{ id: string }>(tx, `insert into tga_categories (show_id, kind, name, position) values ($1, 'reveal', 'GTA VI trailer?', 2) returning id`, [show])).id;
    const astro = (await one<{ id: string }>(tx, `insert into tga_nominees (category_id, name) values ($1, 'Astro Bot') returning id`, [goty])).id;
    const elden = (await one<{ id: string }>(tx, `insert into tga_nominees (category_id, name) values ($1, 'Elden Ring Shadow of the Erdtree') returning id`, [goty])).id;
    return { show, goty, reveal, astro, elden };
  });
});

describe('players', () => {
  it('tga_join creates a player once and returns the same one after', async () => {
    const first = await join(alice, 'Alice');
    const again = await join(alice, 'Someone else');
    expect(again).toBe(first);
    const row = await one<{ display_name: string }>(db, 'select display_name from tga_players where id = $1', [first]);
    expect(row.display_name).toBe('Alice');
  });

  it('tga_join links an imported past player by email (case-insensitive)', async () => {
    const past = await as(db, admin, async (tx) => {
      const p = (await one<{ id: string }>(tx, `insert into tga_players (display_name) values ('Alice (2024)') returning id`)).id;
      await tx.query('insert into tga_player_emails (player_id, email) values ($1, $2)', [p, 'alice@example.com']);
      return p;
    });
    expect(await join(alice, 'Alice')).toBe(past);
  });

  it('a player can rename themselves but not make themselves admin', async () => {
    const id = await join(alice, 'Alice');
    await as(db, alice, (tx) => tx.query(`update tga_players set display_name = 'Ali' where id = $1`, [id]));
    await expect(
      as(db, alice, (tx) => tx.query('update tga_players set is_admin = true where id = $1', [id])),
    ).rejects.toThrow(/admin/);
  });

  it("a player cannot rename someone else or read player emails", async () => {
    const bobId = await join(bob, 'Bob');
    await join(alice, 'Alice');
    await as(db, alice, (tx) => tx.query(`update tga_players set display_name = 'Hacked' where id = $1`, [bobId]));
    const row = await one<{ display_name: string }>(db, 'select display_name from tga_players where id = $1', [bobId]);
    expect(row.display_name).toBe('Bob');
    const emails = await as(db, alice, (tx) => tx.query('select * from tga_player_emails'));
    expect(emails.rows).toHaveLength(0);
  });
});

describe('lineup', () => {
  it('only the admin can edit shows, categories and nominees', async () => {
    await join(alice, 'Alice');
    await expect(
      as(db, alice, (tx) => tx.query(`insert into tga_shows (year, name) values (2026, 'Nope')`)),
    ).rejects.toThrow(/row-level security/);
    await as(db, alice, (tx) => tx.query(`update tga_categories set winner_nominee_id = $1 where id = $2`, [ids.astro, ids.goty]));
    const goty = await one<{ winner_nominee_id: string | null }>(db, 'select winner_nominee_id from tga_categories where id = $1', [ids.goty]);
    expect(goty.winner_nominee_id).toBeNull();
  });

  it("a winner must be one of the category's nominees", async () => {
    const other = await as(db, admin, async (tx) => {
      const cat = (await one<{ id: string }>(tx, `insert into tga_categories (show_id, kind, name) values ($1, 'award', 'Best RPG') returning id`, [ids.show])).id;
      return (await one<{ id: string }>(tx, `insert into tga_nominees (category_id, name) values ($1, 'Metaphor') returning id`, [cat])).id;
    });
    await expect(
      as(db, admin, (tx) => tx.query('update tga_categories set winner_nominee_id = $1 where id = $2', [other, ids.goty])),
    ).rejects.toThrow(/foreign key/);
  });
});

describe('picks', () => {
  it('a player picks before the show and cannot change picks after it starts', async () => {
    const aliceId = await join(alice, 'Alice');
    await as(db, alice, (tx) =>
      tx.query('insert into tga_picks (player_id, category_id, nominee_id) values ($1, $2, $3)', [aliceId, ids.goty, ids.astro]),
    );
    await setStart(-1);
    await as(db, alice, (tx) =>
      tx.query('update tga_picks set nominee_id = $1 where player_id = $2', [ids.elden, aliceId]),
    );
    const pick = await one<{ nominee_id: string }>(db, 'select nominee_id from tga_picks where player_id = $1', [aliceId]);
    expect(pick.nominee_id).toBe(ids.astro);
    await expect(
      as(db, alice, (tx) =>
        tx.query('insert into tga_picks (player_id, category_id, answer) values ($1, $2, true)', [aliceId, ids.reveal]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it("other players' picks are hidden until the show starts", async () => {
    const aliceId = await join(alice, 'Alice');
    await join(bob, 'Bob');
    await as(db, alice, (tx) =>
      tx.query('insert into tga_picks (player_id, category_id, nominee_id) values ($1, $2, $3)', [aliceId, ids.goty, ids.astro]),
    );
    const before = await as(db, bob, (tx) => tx.query('select * from tga_picks'));
    expect(before.rows).toHaveLength(0);
    await setStart(-1);
    const after = await as(db, bob, (tx) => tx.query('select * from tga_picks'));
    expect(after.rows).toHaveLength(1);
  });

  it('a player cannot pick for someone else', async () => {
    const bobId = await join(bob, 'Bob');
    await join(alice, 'Alice');
    await expect(
      as(db, alice, (tx) =>
        tx.query('insert into tga_picks (player_id, category_id, nominee_id) values ($1, $2, $3)', [bobId, ids.goty, ids.astro]),
      ),
    ).rejects.toThrow(/row-level security/);
  });

  it('a pick must match its category: a nominee for awards, Yes/No for reveals', async () => {
    const aliceId = await join(alice, 'Alice');
    await expect(
      as(db, alice, (tx) =>
        tx.query('insert into tga_picks (player_id, category_id, answer) values ($1, $2, true)', [aliceId, ids.goty]),
      ),
    ).rejects.toThrow(/award category needs a nominee/);
    await expect(
      as(db, alice, (tx) =>
        tx.query('insert into tga_picks (player_id, category_id, nominee_id) values ($1, $2, $3)', [aliceId, ids.reveal, ids.astro]),
      ),
    ).rejects.toThrow('a reveal category needs a Yes/No pick');
  });

  it('the admin can write picks for a past player after the show (import)', async () => {
    await setStart(-24);
    await as(db, admin, async (tx) => {
      const p = (await one<{ id: string }>(tx, `insert into tga_players (display_name) values ('David')`.concat(' returning id'))).id;
      await tx.query('insert into tga_picks (player_id, category_id, nominee_id) values ($1, $2, $3)', [p, ids.goty, ids.astro]);
    });
    const count = await one<{ n: number }>(db, 'select count(*)::int as n from tga_picks');
    expect(count.n).toBe(1);
  });
});

describe('leaderboard', () => {
  it('scores 1 point per correct award or reveal pick', async () => {
    const aliceId = await join(alice, 'Alice');
    const bobId = await join(bob, 'Bob');
    await as(db, alice, async (tx) => {
      await tx.query('insert into tga_picks (player_id, category_id, nominee_id) values ($1, $2, $3)', [aliceId, ids.goty, ids.astro]);
      await tx.query('insert into tga_picks (player_id, category_id, answer) values ($1, $2, true)', [aliceId, ids.reveal]);
    });
    await as(db, bob, async (tx) => {
      await tx.query('insert into tga_picks (player_id, category_id, nominee_id) values ($1, $2, $3)', [bobId, ids.goty, ids.elden]);
      await tx.query('insert into tga_picks (player_id, category_id, answer) values ($1, $2, true)', [bobId, ids.reveal]);
    });
    await setStart(-1);
    await as(db, admin, async (tx) => {
      await tx.query('update tga_categories set winner_nominee_id = $1 where id = $2', [ids.astro, ids.goty]);
      await tx.query('update tga_categories set answer = true where id = $1', [ids.reveal]);
    });

    const board = await as(db, bob, (tx) =>
      tx.query<{ display_name: string; points: number; decided: number; picks: number }>(
        'select display_name, points, decided, picks from tga_leaderboard where show_id = $1 order by points desc',
        [ids.show],
      ),
    );
    expect(board.rows).toEqual([
      { display_name: 'Alice', points: 2, decided: 2, picks: 2 },
      { display_name: 'Bob', points: 1, decided: 2, picks: 2 },
    ]);
  });
});
