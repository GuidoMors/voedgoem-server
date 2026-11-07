# kin server guide

Server game rules, state and validation notes. Consult the implementation and tests for current behavior; coordinate UI changes with the sibling frontend.

Kin snapshots are personalized per viewer (identity, private cards, and decisions) and must not be shared through the lobby broadcast cache.
The Barter form stays open until the server confirms the pending offer; rejected offers retain their draft, and errors remain visible across selection-step broadcasts.

## Architecture and data

`engine.ts` dispatches and validates actions; `index.ts` exposes snapshots
and game-module hooks. Setup choices are generated from the faction starting
setup tables in the frontend rulebook by `scripts/gen-cards.mjs`; do not edit
generated card data directly. See the [frontend Kin guide](../../../../voedgoem/src/games/kin/README.md)
for the setup schema and generation workflow.

`treaties.ts` validates and resolves Barter. A pending offer is sent to
viewers; only its recipient can answer. A player's Tradegoods can be offered
or requested when they have the Tradegoods card, and are converted to the
selected basic resource on acceptance.

Chapter transitions and pending decisions are server-authoritative. The
Commonwealth, Kingdom and Exploration chapters have focused tests; preserve
decision guards, scoring and cleanup when changing them. Exploration places
additional ruins before normal play and uses server-calculated court relic
totals for its end-of-Control victory check.

## Bots and tests

Kin supports automated setup and game actions through `bots.ts`. Its per-bot
Force pass mode is separate from global Autopilot. Run focused tests with
`npm test -- --test-name-pattern=Exploration` or select relevant tests under
`src/games/kin/`; test state migrations and private snapshots as well as action
validation.
