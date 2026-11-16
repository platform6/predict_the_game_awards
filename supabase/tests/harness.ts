// Runs the migrations in PGlite (Postgres in WASM) against a minimal stand-in for
// Supabase: the anon/authenticated roles, auth.users, auth.uid(), auth.jwt() and
// the supabase_realtime publication. Enough to test the tables and RLS policies.
import { PGlite } from '@electric-sql/pglite';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const migrationsDir = join(import.meta.dirname, '..', 'migrations');

const supabaseStub = `
  create role anon nologin;
  create role authenticated nologin;
  create role supabase_auth_admin nologin;
  grant usage on schema public to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant all on sequences to anon, authenticated;

  create schema auth;
  grant usage on schema auth to anon, authenticated;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as $$
    select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  create function auth.jwt() returns jsonb language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
  $$;

  create publication supabase_realtime;
`;

export async function freshDb(): Promise<PGlite> {
  const db = new PGlite();
  await db.exec(supabaseStub);
  for (const file of readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort()) {
    await db.exec(readFileSync(join(migrationsDir, file), 'utf8'));
  }
  return db;
}

export interface User {
  id: string;
  email: string;
}

let n = 0;
export async function createUser(db: PGlite, email: string): Promise<User> {
  const id = `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
  await db.query('insert into auth.users (id, email) values ($1, $2)', [id, email]);
  return { id, email };
}

/** Runs `fn` as a signed-in user (role authenticated), the way PostgREST would. */
export async function as<T>(db: PGlite, user: User, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.query(`select set_config('request.jwt.claim.sub', $1, true)`, [user.id]);
    await tx.query(`select set_config('request.jwt.claims', $1, true)`, [
      JSON.stringify({ sub: user.id, email: user.email, role: 'authenticated' }),
    ]);
    await tx.exec('set local role authenticated');
    return fn(tx);
  });
}

export type Tx = Parameters<Parameters<PGlite['transaction']>[0]>[0];
