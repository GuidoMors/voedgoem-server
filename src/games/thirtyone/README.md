# thirtyone server guide

Server game rules, state and validation notes. Consult the implementation and tests for current behavior; coordinate UI changes with the sibling frontend.

The easy and hard word pools are in `content/31seconds/`. `npm run words`
runs `scripts/build-words.mjs` to produce `words.generated.ts` here; edit
the source lists rather than the generated file.

- The game uses six-word cards (four easy words followed by two hard words) and 31-second describing turns, with a configurable grace period and target score.
- The host can scramble all connected players into one captain per team and balanced player teams, or scramble only the two captains while preserving other team assignments.
- Red takes the first turn; the captain/player draft may be randomized. A describer opens the card to start the clock, may end the clock early, or can pass an unopened card to a teammate.
- A captain from the opposing team scores the words after the timer and grace period. A connected teammate can substitute if that captain is unavailable.
- During play, the host can assign a connected spectator to either team as a player.
- Display accounts may see the words only once the opposing captain has entered the scoring period. They must not see them during lobby/draft, while describing, or during the clock/grace period. The words disappear again when the card is no longer being scored.
- The first team to the configured target normally wins. If the first team to reach target does not have a lead greater than the other team's remaining potential (six points), allow the opposing team its last card. A tie at or above target continues through sudden death until a full round ends with different scores.
- Players can submit existing words for review or recommend additions. Submissions do not automatically remove or add words; admins can review and dismiss reported/recommended entries.
- The host can abort with confirmation; the finished score/history and per-player results are recorded.

## Historical implementation notes

- Six words per card (four easy, two hard), 31-second timer, host-set grace interval/target score.
- Red plays first; captain draft can remain randomized.
- Describer opens the card; opposing captain marks guessed words after timer/grace. A connected teammate can step in when captain offline.
- Display-only account sees the words only in the opposing captain's scoring phase. Lobby tick broadcasts this transition without a player action.
- Overtime continues until a full round concludes with non-tied scores under the target rules. Abort is at the bottom with confirmation.
