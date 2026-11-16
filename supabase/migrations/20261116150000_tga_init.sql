-- The Game Awards pick'em: initial schema.
--
-- These tables live in lula's Supabase project for now, so every object is
-- prefixed tga_ and nothing here touches lula's own tables or auth.users
-- triggers. Moving to a project of its own later is a dump of the tga_ objects.
--
-- Shape:
--   tga_players        everyone who has played, including past players who
--                      haven't signed in yet (user_id null until they do)
--   tga_player_emails  private: links a past player to their Google account by
--                      email on first sign-in (see tga_join)
--   tga_shows          one per year; picks lock at starts_at
--   tga_categories     award categories (kind 'award', with nominees) and
--                      reveal questions (kind 'reveal', answered Yes/No), plus
--                      their results (winner_nominee_id / answer)
--   tga_nominees       the choices in an award category
--   tga_picks          one per player per category
--   tga_leaderboard    view: points per player per show, 1 point per correct pick
--
-- Access (RLS): any signed-in user reads shows, categories, nominees and player
-- names. A player always sees their own picks, and everyone's picks once the
-- show has started. Picks can be changed only before the show starts. Only the
-- admin (tga_players.is_admin) edits shows, categories, nominees and results,
-- and can write picks for anyone (used to import past years).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table public.tga_players (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid unique references auth.users on delete set null,
  display_name text not null check (length(trim(display_name)) between 1 and 40),
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

create table public.tga_player_emails (
  player_id uuid primary key references public.tga_players on delete cascade,
  email     text not null unique check (email = lower(email))
);

create table public.tga_shows (
  id         uuid primary key default gen_random_uuid(),
  year       int not null unique check (year between 2014 and 2100),
  name       text not null,
  starts_at  timestamptz, -- picks lock at this time; null = not scheduled, still open
  created_at timestamptz not null default now()
);

create table public.tga_categories (
  id                uuid primary key default gen_random_uuid(),
  show_id           uuid not null references public.tga_shows on delete cascade,
  kind              text not null check (kind in ('award', 'reveal')),
  name              text not null,
  position          int not null default 0,
  winner_nominee_id uuid,    -- award result
  answer            boolean, -- reveal result
  created_at        timestamptz not null default now(),
  unique (show_id, name),
  check (kind = 'award' or winner_nominee_id is null),
  check (kind = 'reveal' or answer is null)
);

create table public.tga_nominees (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.tga_categories on delete cascade,
  name        text not null,
  detail      text, -- e.g. the game for a Best Performance nominee
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  unique (id, category_id),
  unique (category_id, name)
);

-- The winner must be one of the category's own nominees.
alter table public.tga_categories
  add constraint tga_categories_winner_fk
  foreign key (winner_nominee_id, id) references public.tga_nominees (id, category_id)
  on delete set null (winner_nominee_id);

create table public.tga_picks (
  player_id   uuid not null references public.tga_players on delete cascade,
  category_id uuid not null references public.tga_categories on delete cascade,
  nominee_id  uuid,    -- award pick
  answer      boolean, -- reveal pick
  updated_at  timestamptz not null default now(),
  primary key (player_id, category_id),
  -- The pick must be one of the category's own nominees.
  foreign key (nominee_id, category_id) references public.tga_nominees (id, category_id) on delete cascade,
  check ((nominee_id is null) <> (answer is null))
);

create index tga_categories_show_idx on public.tga_categories (show_id, position);
create index tga_nominees_category_idx on public.tga_nominees (category_id, position);
create index tga_picks_category_idx on public.tga_picks (category_id);

-- A pick's answer type must match its category's kind.
create function public.tga_picks_check_kind()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  k text;
begin
  select kind into k from public.tga_categories where id = new.category_id;
  if (k = 'award' and new.nominee_id is null) or (k = 'reveal' and new.answer is null) then
    raise exception 'a % category needs a % pick', k, case k when 'award' then 'nominee' else 'Yes/No' end;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger tga_picks_check_kind
  before insert or update on public.tga_picks
  for each row execute function public.tga_picks_check_kind();

-- ---------------------------------------------------------------------------
-- Helpers (security definer so RLS policies can call them without recursion)
-- ---------------------------------------------------------------------------
create function public.tga_my_player_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from public.tga_players where user_id = auth.uid();
$$;

create function public.tga_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce((select is_admin from public.tga_players where user_id = auth.uid()), false);
$$;

-- True once the category's show has started: picks are locked and visible to all.
create function public.tga_category_locked(p_category_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(s.starts_at <= now(), false)
    from public.tga_categories c
    join public.tga_shows s on s.id = c.show_id
   where c.id = p_category_id;
$$;

-- Called by the app after sign-in. Returns the caller's player, creating it on
-- first sign-in. A past player (imported, not yet linked) whose email matches
-- the caller's Google email is claimed instead of creating a new one.
create function public.tga_join(p_display_name text)
returns public.tga_players
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid   uuid := auth.uid();
  mail  text := lower(auth.jwt() ->> 'email');
  me    public.tga_players;
begin
  if uid is null then
    raise exception 'not signed in';
  end if;

  select * into me from public.tga_players where user_id = uid;
  if found then
    return me;
  end if;

  if mail is not null then
    update public.tga_players p
       set user_id = uid
      from public.tga_player_emails e
     where e.player_id = p.id and e.email = mail and p.user_id is null
    returning p.* into me;
    if found then
      return me;
    end if;
  end if;

  insert into public.tga_players (user_id, display_name)
  values (uid, coalesce(nullif(trim(p_display_name), ''), split_part(mail, '@', 1), 'Player'))
  returning * into me;

  if mail is not null then
    insert into public.tga_player_emails (player_id, email) values (me.id, mail)
    on conflict (email) do nothing;
  end if;

  return me;
end;
$$;

revoke execute on function public.tga_my_player_id() from public, anon;
revoke execute on function public.tga_is_admin() from public, anon;
revoke execute on function public.tga_category_locked(uuid) from public, anon;
revoke execute on function public.tga_join(text) from public, anon;
revoke execute on function public.tga_picks_check_kind() from public, anon, authenticated;
grant execute on function public.tga_my_player_id() to authenticated;
grant execute on function public.tga_is_admin() to authenticated;
grant execute on function public.tga_category_locked(uuid) to authenticated;
grant execute on function public.tga_join(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.tga_players       enable row level security;
alter table public.tga_player_emails enable row level security;
alter table public.tga_shows         enable row level security;
alter table public.tga_categories    enable row level security;
alter table public.tga_nominees      enable row level security;
alter table public.tga_picks         enable row level security;

-- Nothing here is for signed-out visitors.
revoke all on public.tga_players, public.tga_player_emails, public.tga_shows,
              public.tga_categories, public.tga_nominees, public.tga_picks
  from anon;

-- Players: everyone signed in sees names; you rename yourself; the admin does
-- the rest. A guard trigger stops non-admins making themselves admin or moving
-- their row to another account (tga_join's claim, null -> caller, is allowed).
create policy tga_players_select on public.tga_players
  for select to authenticated using (true);
create policy tga_players_update_own on public.tga_players
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tga_players_admin on public.tga_players
  for all to authenticated using (public.tga_is_admin()) with check (public.tga_is_admin());

create function public.tga_players_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if public.tga_is_admin() or auth.uid() is null then
    return new; -- admin, or SQL run without a signed-in user (dashboard, migrations)
  end if;
  if new.is_admin is distinct from old.is_admin then
    raise exception 'only the admin can change is_admin';
  end if;
  if new.user_id is distinct from old.user_id
     and not (old.user_id is null and new.user_id = auth.uid()) then
    raise exception 'a player cannot be moved to another account';
  end if;
  return new;
end;
$$;

create trigger tga_players_guard
  before update on public.tga_players
  for each row execute function public.tga_players_guard();
revoke execute on function public.tga_players_guard() from public, anon, authenticated;

-- Player emails: admin only (used to link imported past players).
create policy tga_player_emails_admin on public.tga_player_emails
  for all to authenticated using (public.tga_is_admin()) with check (public.tga_is_admin());

-- Shows, categories, nominees: read by all signed-in users, written by the admin.
create policy tga_shows_select on public.tga_shows
  for select to authenticated using (true);
create policy tga_shows_admin on public.tga_shows
  for all to authenticated using (public.tga_is_admin()) with check (public.tga_is_admin());

create policy tga_categories_select on public.tga_categories
  for select to authenticated using (true);
create policy tga_categories_admin on public.tga_categories
  for all to authenticated using (public.tga_is_admin()) with check (public.tga_is_admin());

create policy tga_nominees_select on public.tga_nominees
  for select to authenticated using (true);
create policy tga_nominees_admin on public.tga_nominees
  for all to authenticated using (public.tga_is_admin()) with check (public.tga_is_admin());

-- Picks: your own always; everyone's once the show has started.
create policy tga_picks_select on public.tga_picks
  for select to authenticated
  using (player_id = public.tga_my_player_id() or public.tga_category_locked(category_id));
create policy tga_picks_insert_own on public.tga_picks
  for insert to authenticated
  with check (player_id = public.tga_my_player_id() and not public.tga_category_locked(category_id));
create policy tga_picks_update_own on public.tga_picks
  for update to authenticated
  using (player_id = public.tga_my_player_id() and not public.tga_category_locked(category_id))
  with check (player_id = public.tga_my_player_id() and not public.tga_category_locked(category_id));
create policy tga_picks_delete_own on public.tga_picks
  for delete to authenticated
  using (player_id = public.tga_my_player_id() and not public.tga_category_locked(category_id));
create policy tga_picks_admin on public.tga_picks
  for all to authenticated using (public.tga_is_admin()) with check (public.tga_is_admin());

-- ---------------------------------------------------------------------------
-- Leaderboard: 1 point per correct pick. security_invoker makes the view run
-- with the caller's RLS, so before the show you only see your own row.
-- ---------------------------------------------------------------------------
create view public.tga_leaderboard
with (security_invoker = true)
as
select c.show_id,
       p.id           as player_id,
       p.display_name,
       count(*) filter (
         where (c.kind = 'award' and pk.nominee_id = c.winner_nominee_id)
            or (c.kind = 'reveal' and pk.answer = c.answer)
       )::int         as points,
       count(*) filter (
         where c.winner_nominee_id is not null or c.answer is not null
       )::int         as decided,
       count(*)::int  as picks
  from public.tga_picks pk
  join public.tga_players p on p.id = pk.player_id
  join public.tga_categories c on c.id = pk.category_id
 group by c.show_id, p.id, p.display_name;

revoke all on public.tga_leaderboard from anon;
grant select on public.tga_leaderboard to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime: show night pushes winners, picks (once visible) and lineup changes.
-- Realtime applies each table's RLS per subscriber.
-- ---------------------------------------------------------------------------
alter publication supabase_realtime
  add table public.tga_shows, public.tga_categories, public.tga_nominees,
            public.tga_picks, public.tga_players;
