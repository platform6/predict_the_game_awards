---
description: Work the next To Do card on The Game Awards board (or the card whose id you give)
argument-hint: "[card id]"
allowed-tools: Bash(npm --prefix C:/dev/listing_things_living_life run board *)
---

Work one card from the **The Game Awards** board, following the board rules in AGENTS.md. The board
script runs from the lula repo: `npm --prefix C:/dev/listing_things_living_life run board -- …`
(written `board …` below).

1. Pick the card:
   - If an id was given (`$ARGUMENTS`), use that card. It must be in **To Do**; if it isn't, say where it is and stop.
   - Otherwise run `board list "The Game Awards" "To Do"` and take the **top** card. If To Do is empty, say so and stop.
2. Run `board show <id>` and read the title, notes and steps. Unchecked steps and the latest notes are
   usually the owner's feedback from testing.
3. If it's unclear what's wanted, ask the owner (or add a note with the question and leave the card in To Do). Don't guess.
4. Move it to **Doing**, build it, and run the checks from AGENTS.md ("Checks"); fix anything they report.
   A design card (the brief) is worked as a conversation with the owner, written into the card's notes.
5. Add a note to the card saying what changed (and anything left for the owner to check), then report back and ask
   whether to commit and push. Multi-line notes go through `--file` (see AGENTS.md).
6. Once the owner says yes: follow `/cp` (commit with a `Card:` line, push, note the hash, move the card to **UAT**).
   Never move it to Done.
