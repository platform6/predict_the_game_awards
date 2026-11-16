# The Game Awards (predict_the_game_awards)

A pick'em site for The Game Awards: friends pick the winners, and the leaderboard updates live
during the show. It replaces the owner's yearly Google Form + Sheet. The design brief is in the notes
of the "Design: The Game Awards brief" card.

These instructions are for any coding agent (Codex reads this file; Claude Code reads it through
CLAUDE.md).

## Stack

Same as lula: Vite + React + TypeScript + Tailwind, Supabase (auth, Postgres, realtime), hosted on
Netlify (`netlify.toml`). `npm run dev` starts it locally.

For now the tables live in **lula's Supabase project**, every one prefixed `tga_`, so they can be
moved to a project of their own later. Never touch lula's own tables. `.env` (untracked) holds
`VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, the same public values as lula's `.env`;
see `.env.example`. Netlify needs the same two variables.

Schema changes are SQL files in `supabase/migrations/`; the comment at the top of the first one
explains the tables and who can see or change what (RLS). `supabase/tests/` runs every migration in
PGlite (Postgres in Node) with a small stand-in for Supabase's auth and roles, and tests the policies;
it's part of `npm run check`. Keep `src/lib/types.ts` in step with the tables. Applying a migration
changes the live database lula also uses, so only do it when the owner says to.

Past years (2024, 2025) are in `data/history/`, cleaned up from the owner's Google Form sheets.
`npm run -s history-sql` prints the SQL that imports them. The repo is public, so friends' emails stay
in the untracked `data/history/emails.local.json`, never in committed files.

## Checks

`npm run check` typechecks and then runs the tests (Vitest), and exits non-zero if either fails. Run it
before calling a change done.

## Working from the board

Ideas and work for this project live as cards on the **The Game Awards** board (Dev realm) in the
owner's lula app. Until lula's MCP server exists, the board is read and updated with the board script
in the lula repo, run from here with `--prefix`. It signs in with the login in lula's `.env.local`,
so the login stays in that repo; never copy it here.

```
npm --prefix C:/dev/listing_things_living_life run board -- list "The Game Awards"         # cards by column, with ids
npm --prefix C:/dev/listing_things_living_life run board -- show <id>                     # notes, steps, files, details, commits
npm --prefix C:/dev/listing_things_living_life run board -- files <id> [folder]           # download the card's attached files
npm --prefix C:/dev/listing_things_living_life run board -- move <id> Doing
npm --prefix C:/dev/listing_things_living_life run board -- note <id> "<text>"             # add --by <name> to sign it, e.g. --by Codex
npm --prefix C:/dev/listing_things_living_life run board -- step <id> "<text>" ["<text>"...]
npm --prefix C:/dev/listing_things_living_life run board -- add "The Game Awards" "<title>" [column]
npm --prefix C:/dev/listing_things_living_life run board -- help                          # everything else
```

`move`, `note` and `show` take several ids at once, comma-separated (`a1b2c3d4,e5f6a7b8`). `list`,
`show` and `add` print JSON with `--json`. `show` lists a card's commits from this repo's `Card:` lines.

On Windows, `npm` cuts an argument off at its first line break and drops the arguments after it,
without an error. For multi-line notes or several steps, write the text to a file and pass
`note <id> --file <path>` or `step <id> --file <path>` (one step per line), then `show` the card to
confirm it landed.

It needs network access and the owner's login. If it can't sign in or reach Supabase, say so rather
than working around it.

Rules for the board:

- Only take cards in **To Do**. Backlog and other columns are the owner's scratchpad; leave them alone.
- Move a card to **Doing** when starting it.
- When it's built and checked, add a note saying what changed. Commit and push only when the
  owner says to.
- Once it's pushed, add a note with the commit and move the card to **UAT**, where the owner
  tests it. Never move cards to **Done**; that is the owner's call after testing.
- If a card is unclear, add a note with the question and leave it in To Do rather than guessing.
- Don't fill the Backlog with a whole plan. Add a first slice of a few cards one session can finish;
  later work stays in the design brief as a short roadmap until it's next.

### Starting out: the design brief

The project begins with a design brief, not code. The brief lives in the notes of a
"Design: The Game Awards brief" card on the board:

1. A short interview: what it is and who it's for, what done looks like for a first version,
   constraints (stack, deadline, hosting), and what's out of scope.
2. Open questions go in the brief as a "To decide" list. Each is settled with a few options, a
   recommendation and the owner's choice; the brief records the decision and why.
3. Once the owner approves the brief, add only the first slice of cards (about 5 to 8), ending in
   something the owner can try. Setting up the stack and its check command is usually the first.

### "Work the next card" (or "work card <id>")

1. Pick the card: the one whose id was given (it must be in To Do; if not, say where it is and
   stop), otherwise the **top** card from `list "The Game Awards" "To Do"`. If To Do is empty, say
   so and stop.
2. `show <id>`: read the title, notes and steps. Unchecked steps and the latest notes are usually the
   owner's feedback from testing.
3. If it's unclear what's wanted, ask (or note the question on the card and leave it in To Do).
4. Move it to Doing, build it, and run the checks (see "Checks").
5. Note on the card what changed and anything left for the owner to check, then report back and ask
   whether to commit and push.

### "Commit and push" (or "cp")

Saying this is the owner's go-ahead to commit and push what's in the working tree.

1. `git status` and `git diff`; if there's nothing to commit, say so and stop.
2. Run the checks on their own and read the result; if they fail, report it and stop. Don't chain the
   commit or push onto a command whose failure wouldn't stop them.
3. Work out which cards in Doing the commit completes. Leave cards still in progress out.
4. Commit: a short summary line, then `-` bullets for each change, then a `Card: <8-character id>`
   line per card from step 3. Never stage `.claude/settings.local.json` or any secrets.
5. Push to the current branch.
6. Note `Committed in <short hash>.` on those cards and move them to UAT (comma-separated ids, one
   call each).
7. Report the commit hash and which cards moved.
