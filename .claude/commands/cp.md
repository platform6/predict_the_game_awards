---
description: Commit and push the current work, then move its cards on The Game Awards board to UAT
allowed-tools: Bash(git *), Bash(npm run *), Bash(npm --prefix C:/dev/listing_things_living_life run board *)
---

Typing this command is the owner's go-ahead to commit and push what's in the working tree now. The board
script runs from the lula repo: `npm --prefix C:/dev/listing_things_living_life run board -- …` (written
`board …` below).

1. Run `git status` and `git diff`. If there's nothing to commit, say so and stop.
2. Run the checks from AGENTS.md ("Checks") as a command of their own, and read the result before going on. If
   they fail, report the failure and stop without committing. Never chain `git commit` or `git push` onto a
   command whose failure wouldn't stop them. (If there's no check command yet, say so and go on.)
3. Work out which cards on the board in **Doing** this commit completes (check with
   `board list "The Game Awards" Doing` and the cards' notes). Leave cards that are still in progress out.
4. Stage the changes and commit with a message in this repo's style (a short summary line, then `-` bullets
   for each change), then a `Card: <8-character id>` line for each card from step 3, then the attribution lines
   the session gives for commits. Never stage `.claude/settings.local.json` or any secrets.
5. Push to the current branch.
6. Note and move the cards from step 3, all of them in one call each:
   `board note <id>,<id> "Committed in <short hash>."` then `board move <id>,<id> UAT`.
   Never move anything to Done.
7. Report the commit hash and which cards moved.
