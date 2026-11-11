# Plenet - server guide

Implemented from `C:\Users\Nils\Downloads\Waar ligt dat land_.html`.
The module uses the extracted country trivia in `questions.ts` and country
centers in `countries.ts`. Coordinate snapshot and action changes with the
sibling frontend guide at
`../../../../voedgoem/src/games/waar-ligt-dat-land/README.md`.

## Authoritative game rules

- A match has 1–8 explicitly joined participants and a host-selected 1–50
  rounds per participant (default 5). Start is an explicit host action; adding
  a lobby or connecting a user does not seat or start anyone.
- Turns follow the seated-player order. Each participant gets the configured
  number of turns, for `roundsPerPlayer × participantCount` turns total.
- Each turn draws one country from a shuffled deck. Do not repeat a country
  until the deck has been exhausted; reshuffle before drawing again.
- The active player has up to three distinct country guesses. Validate the
  selected country ID against the server's supported country set. An incorrect
  guess scores no points and returns its name and rounded great-circle
  distance to the target. On the third incorrect guess, end the location
  phase, reveal the country, and award no location points.
- A correct guess scores `3 - incorrectGuesses` points (3/2/1), reveals the
  country, and starts one trivia question. Select one of the six categories
  and that country's question for the selected category, balancing true/false
  and open-ended questions. If a country has no question of the selected type,
  generate a geography question using its centre coordinate so both formats
  remain available for the game.
- Check true/false answers immediately on the server and award 1 point only
  for the correct choice; these answers do not need another player's review.
  For open-ended questions, reveal the answer after the active player has
  answered aloud, then let the next connected player in turn order approve or
  reject it. Only that reviewer may grade, and award 1 point to the active
  player only when approved. If no other player is connected, the active player
  reviews their own answer. Do not allow grading before answer reveal or
  changing the result after grading.
- After feedback, advance to the next participant/turn. After the final turn,
  finish the game. Highest score wins; all players tied for highest score are
  winners.
- The host may quit an active game from host controls. Return all participants
  to the lobby, clear the unfinished match and its scores, and do not record
  results for the cancelled game.

Keep question data and answer keys server-side. The Dutch question bank is in
`questions.ts`; `questions-en.ts` contains the English questions and answers
for all 195 countries, keyed by the same six categories. Each entry contains
the question, a simple answer, and an explanation. Snapshots must withhold both
answer and explanation until the answer is revealed. Review both banks for
accuracy before release. Admin edits are stored in D1 and loaded when a match
starts; they change the question and explanation only, not the answer key.
Country IDs must agree with the frontend's map dataset.

## Module, snapshots, and validation

- Implement the standard `GameModule` contract in
  `src/games/waar-ligt-dat-land/index.ts`; do not add a custom room transport.
  The generated registry is refreshed by the existing scripts.
- Start with all connected users as spectators. `participants()` returns only
  seated players. A disconnect during a match preserves the seat and skips
  that player's current turn; a reconnect restores their ability to play in
  subsequent turns.
- Suggested phases: waiting, location guess, trivia, answer revealed, turn
  feedback, and finished. Use an explicit phase and turn index; reject actions
  that are invalid for the phase or actor.
- Define typed, bounded actions for joining/leaving a seat, host options/start,
  drawing a country, guessing a country, answering true/false, revealing an
  open-ended answer, reviewer approval/rejection, and advancing after feedback.
  The host may set rounds only in the waiting phase.
- The clue country name is public, but keep the target map ID/geometry and
  true/false answer out of snapshots until their respective reveal/resolution.
  The host and spectators receive public state, not privileged hidden data.
  Set `perViewer` if any snapshot field depends on viewer identity, and test
  spectator, active participant, other participant, display viewer, and bot
  views.
- Include only presentation data needed by clients in snapshots: public
  country name/clue, selected map IDs, guesses remaining, distance feedback,
  category/question, revealed answer when allowed, scores, turn owner, phase,
  rounds, and readiness. Never trust client-supplied scores, answer keys,
  distances, turn indices, or question content.
- Treat country IDs as allowlisted data, not arbitrary map labels. Bound and
  validate action strings and numbers, check unique guesses, and make repeated
  or stale actions harmless. The current action's actor must match the active
  participant except for explicitly authorized host setup actions.
- The frontend owns map geometry and gestures. The server uses canonical
  country IDs, names, trivia content, and approximate Natural Earth label
  coordinates for great-circle distance feedback. The simplified map comes
  from Natural Earth 1:110m Admin-0 data (public domain,
  https://www.naturalearthdata.com/); the HTML's supplied fallback points are
  used for tiny countries without a polygon. Test distance rounding and
  boundary behavior.

## Results, statistics, and test bots

- Implement `takeResult()` with one result per human participant: role
  `player`, final score, and `won` true for every highest-score tie. Keep any
  extra counters (for example countries found or correct trivia answers)
  consistent with the final state and register only useful aggregates in
  `src/stats.ts`. The generic lobby excludes bot results from persisted stats.
- Implement `openSpots()` for each available participant slot in the waiting
  phase. Added-but-unseated bots remain spectators. Bots use the same
  participant, disconnect, capacity, and snapshot rules as human players.
- Manual bot control is supported through the normal game actions. Add the
  frontend `getTurnBotId` behavior so an admin can control a bot on its turn;
  map guesses, trivia answers, and open-answer reviews must pass the same
  membership and phase validation as human actions.
- Open-ended questions require another connected participant to review the
  answer unless the active participant is alone. This does not support meaningful
  knowledge-based Autopilot. For the initial version, implement no automatic
  bot moves (`botMove()` returns `null`) and explicitly communicate that
  Autopilot is unsupported. Revisit only if a fair, clearly defined bot policy
  is designed; never let automated moves bypass normal validation.

## Tests

Add focused tests for:

- Start readiness, host-only options/start, participant limits, and rounds
  bounds.
- Spectators versus seated participants, disconnect/reconnect, and turn order.
- Draw/deck exhaustion and reshuffle, valid/invalid country IDs, duplicate
  guesses, 3/2/1 location scoring, and a miss after three attempts.
- Balanced true/false/open-question selection, answer reveal, next-player
  review authorization, exactly-once trivia scoring, and attempts to grade or
  reveal in the wrong phase.
- Turn/round completion, ties, final results, and bot-result exclusion.
- Snapshot privacy before and after country/answer reveal for players,
  spectators, display viewers, and bots.
- Bot seating, manual actions, removal/disconnect, and turn-control flows.
  Verify that Autopilot remains unsupported and does not change game state.

Run the targeted game tests, server typecheck/build, and the frontend's
corresponding tests/build after implementation. Do not deploy or apply remote
migrations as part of local implementation work.
