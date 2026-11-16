// Builds the SQL that imports past years (data/history) into the tga_ tables.
//
//   npm run -s history-sql > history.sql
//
// The output is one DO block with the data embedded as JSON, so it runs as a
// single statement (all or nothing). Run it as a database owner: it writes picks
// after the shows started, which RLS would refuse for normal users. It is safe to
// re-run: each year's show is replaced, and players are reused.
//
// Players: each history player gets a stable id derived from their key. If
// data/history/emails.local.json (untracked; { "<key>": "<email>" }) gives an email
// and a player with that email already exists (they signed in first), the picks go
// to that player instead. The email is also recorded so that tga_join links the
// player to their Google account when they first sign in.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import show2024 from '../data/history/2024';
import show2025 from '../data/history/2025';
import type { HistoryShow } from '../data/history/types';

export const historyShows: HistoryShow[] = [show2024, show2025];

const importBlock = `
declare
  data     jsonb := $json$__DATA__$json$;
  ids      jsonb := '{}';
  p        jsonb;
  s        jsonb;
  c        jsonb;
  pid      uuid;
  existing uuid;
  sid      uuid;
  cid      uuid;
  pos      int;
begin
  for p in select * from jsonb_array_elements(data -> 'players') loop
    pid := md5('tga-history:' || (p ->> 'key'))::uuid;
    existing := null;
    if p ->> 'email' is not null then
      select player_id into existing from public.tga_player_emails where email = p ->> 'email';
    end if;
    if existing is not null then
      pid := existing;
    else
      insert into public.tga_players (id, display_name) values (pid, p ->> 'name') on conflict (id) do nothing;
      if p ->> 'email' is not null then
        insert into public.tga_player_emails (player_id, email) values (pid, p ->> 'email') on conflict do nothing;
      end if;
    end if;
    ids := ids || jsonb_build_object(p ->> 'key', pid);
  end loop;

  for s in select * from jsonb_array_elements(data -> 'shows') loop
    delete from public.tga_shows where year = (s ->> 'year')::int;
    insert into public.tga_shows (year, name, starts_at)
    values ((s ->> 'year')::int, s ->> 'name', (s ->> 'startsAt')::timestamptz)
    returning id into sid;

    pos := 0;
    for c in select * from jsonb_array_elements(s -> 'categories') loop
      pos := pos + 1;
      insert into public.tga_categories (show_id, kind, name, position)
      values (sid, c ->> 'kind', c ->> 'name', pos)
      returning id into cid;

      if c ->> 'kind' = 'award' then
        insert into public.tga_nominees (category_id, name, detail, position)
        select cid, n.e ->> 'name', n.e ->> 'detail', n.ord
          from jsonb_array_elements(c -> 'nominees') with ordinality as n(e, ord);
        update public.tga_categories
           set winner_nominee_id = (select id from public.tga_nominees where category_id = cid and name = c ->> 'winner')
         where id = cid;
        insert into public.tga_picks (player_id, category_id, nominee_id)
        select (ids ->> pk.key)::uuid, cid,
               (select id from public.tga_nominees where category_id = cid and name = pk.value #>> '{}')
          from jsonb_each(c -> 'picks') as pk;
      else
        update public.tga_categories set answer = (c ->> 'answer')::boolean where id = cid;
        insert into public.tga_picks (player_id, category_id, answer)
        select (ids ->> pk.key)::uuid, cid, (pk.value #>> '{}')::boolean
          from jsonb_each(c -> 'picks') as pk;
      end if;
    end loop;
  end loop;
end`;

export function buildHistorySql(shows: HistoryShow[], emails: Record<string, string> = {}): string {
  const players = new Map<string, { key: string; name: string; email?: string }>();
  for (const s of shows) {
    for (const p of s.players) {
      const email = emails[p.key]?.trim().toLowerCase();
      players.set(p.key, email ? { key: p.key, name: p.name, email } : { key: p.key, name: p.name });
    }
  }
  const data = JSON.stringify({
    players: [...players.values()],
    shows: shows.map((s) => ({ year: s.year, name: s.name, startsAt: s.startsAt, categories: s.categories })),
  });
  if (data.includes('$json$')) throw new Error('history data cannot contain $json$');
  return `do $$${importBlock.replace('__DATA__', () => data)}$$;\n`;
}

export function loadEmails(): Record<string, string> {
  const file = join(import.meta.dirname, '..', 'data', 'history', 'emails.local.json');
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>) : {};
}

if (process.argv[1] && import.meta.filename === process.argv[1]) {
  process.stdout.write(buildHistorySql(historyShows, loadEmails()));
}
