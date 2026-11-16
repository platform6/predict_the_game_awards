-- Before User Created auth hook: only Google accounts can be created.
--
-- This is project-wide (it guards lula's sign-ups too, while the tga_ tables
-- share lula's Supabase project). lula keeps "new sign-ups" effectively closed:
-- email/password sign-up is refused, while friends can create accounts by
-- signing in with Google on the Game Awards site.
--
-- Enable it in the dashboard: Authentication > Hooks > Before User Created >
-- Postgres function public.hook_google_only_signups. Then turn on "Allow new
-- users to sign up". Creating a user from the dashboard also passes through the
-- hook, so disable it briefly if you ever need to add a non-Google user by hand.

create or replace function public.hook_google_only_signups(event jsonb)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
begin
  if event -> 'user' -> 'app_metadata' ->> 'provider' = 'google' then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object(
    'error', jsonb_build_object(
      'http_code', 403,
      'message', 'New accounts can only be created with Google sign-in.'
    )
  );
end;
$$;

grant execute on function public.hook_google_only_signups(jsonb) to supabase_auth_admin;
revoke execute on function public.hook_google_only_signups(jsonb) from authenticated, anon, public;
