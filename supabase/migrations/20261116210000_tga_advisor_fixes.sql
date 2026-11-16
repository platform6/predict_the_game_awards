-- Fixes from Supabase's performance advisor after the first apply.

-- Cover the composite foreign keys (pick -> nominee, category winner -> nominee).
create index if not exists tga_picks_nominee_idx on public.tga_picks (nominee_id, category_id);
create index if not exists tga_categories_winner_idx on public.tga_categories (winner_nominee_id, id);

-- Evaluate auth.uid() once per statement, not once per row.
drop policy if exists tga_players_update_own on public.tga_players;
create policy tga_players_update_own on public.tga_players
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
