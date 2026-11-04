# voedgoem-server

Cloudflare Worker + D1 + Durable Objects backend for Voedgoem.

- `src/index.ts` – HTTP API (auth, lobbies, admin) and WebSocket entry point.
- `src/lobby.ts` – generic `Lobby` Durable Object: one per lobby. Owns sockets, the host and broadcasting, and delegates game rules to the lobby's game module.
- `src/games/types.ts` – the `GameModule` interface every game implements.
- `src/games/registry.ts` – exports game modules and their public game info.
- `src/games/<game>/` – one folder per game, with its `index.ts` exporting one `GameModule`. The registry is generated from these folders, so adding a game does not require editing a shared list. Codenames word lists are in `src/games/codenames/words/*.txt`; 31 Seconds easy and hard lists are in `content/31seconds/`. `src/games/wordle-pvp/words.txt` contains one lowercase five-letter Wordle word per line; add words there, not to the generated TypeScript file. `npm run words` bundles the Codenames and 31 Seconds lists into generated TypeScript.

To add a game: create `src/games/<id>/index.ts` exporting exactly one const typed as `GameModule` (with `info`). The generated game registry is refreshed automatically by `npm run dev`, `npm run typecheck`, `npm test`, `npm run build`, and `npm run deploy`; do not edit the generated file.

Then complete the [frontend's cross-repository checklist](../voedgoem/README.md#adding-a-game), including game-scoped styling for the hub game bar, lobby and bot controls, and both statistics tabs and modal. Hub Join/Show and Close actions keep shared hub styling; keep shared cards and controls for other games unchanged. A generated registry entry alone is not a finished game integration.

### Standard lobby lifecycle

The Werewolves Village seats list is the seating order. In the pregame lobby, the GM moves players up or down directly in that list; each move saves immediately for everyone, without a separate ordering menu.

During an active Werewolves game, the lobby host can use **Exit game** in Host controls. After confirmation, everyone returns to the pregame lobby as spectators; the match and GM assignment are cleared, game settings are preserved, and no match result is recorded.

Werewolves GM recording controls show each player's options as a row of buttons beside their name, including individual Werewolf choices. Players use the same option buttons on their own devices. Their recorded selection is highlighted; unanswered questions have no selected option. Clicking another option changes it immediately. Multi-target and potion actions are recorded once all required selections are complete. The GM still confirms the step separately. Town names remain text inputs, and secret role icons in target buttons remain GM-only.

A live summary beside **Confirm step and continue** shows the recorded choices or step being confirmed, including the agreed Werewolf target, passes, votes, potion targets, and private results. Missing votes or pack disagreements are shown rather than implying an outcome is ready.

GM-recorded individual choices are reflected on the acting player's device, and player changes are reflected in the GM controls. These selections remain private to the actor and GM; town-name updates synchronize without recreating the text field.

The GM can browse previously confirmed steps with **Previous step**, **Next step**, and **Return to current step**. History is private to the GM and read-only: browsing never rewinds gameplay or edits earlier choices. Steps confirmed before history recording was introduced are not available.

After each Sniffer check, a separate result step privately shows the discovered role on the Sniffer's device and in the GM controls. The result must be marked **Seen it** before the GM can continue. First-night Werewolf checks still show thumbs-down, followed by another check after acknowledgement.

After each Seer check, a separate private result step shows the discovered role (or the existing thumbs-down result for roles hidden from the Seer). Seer and Sniffer result steps have synchronized **Seen it** / **Not yet** buttons that either the player or GM can change. Both steps require **Seen it** before continuing. Other players cannot see the result.

The Guard and Little Girl also receive separate private result steps with the same shared acknowledgement buttons, requiring **Seen it** before continuing. The Guard sees the dog's thumbs-up/down result. The Little Girl sees whether the checked player visited and their recorded destinations from this night, not earlier nights. Older games without recorded destinations explicitly show that the destination was not recorded.

During Werewolf target selection, participating living Werewolves see each other's secret role icons beneath their names in the village circle. This includes a converted Wolfchild, excludes absent players, and ends when the step changes; other players and spectators do not receive these roles.

Werewolves cannot select a Werewolf-aligned attack target, including themselves or a converted Wolfchild. A Wolfchild whose chosen player is still alive remains a valid Villager target and does not participate in pack selection.

The Throatcutter can silence only active Villager-aligned targets, including an unconverted Wolfchild, never Werewolves or neutrals. Eligible choices are shared privately with the Throatcutter and GM; player selections, GM choices, and final confirmation all enforce this restriction. Passing remains allowed.

After a Throatcutter uses their ability, a separate GM announcement step precedes dawn's night-death list. Confirming it publicly marks the victim's town card with a red dashed border and **Throat cut · Cannot speak** for that day. They may still vote; the marker disappears when the next night begins. Passing or an undrafted Throatcutter causes no reveal or marker.

Visible role badges below village avatars use team colors: grey for the Fool, yellow for Villagers, and red for Werewolves. The Wolfchild's badge is yellow while their chosen player lives and red after that player dies.

After the Wolfchild selects their imitation target, **feeling-watched** wakes that player alone and privately tells them they are being imitated, without identifying the Wolfchild. Shared **Seen it / Not yet** controls require acknowledgement before continuing. The target sees an orange border on their own card during this step. Afterwards, the Wolfchild and target see the border only with **Show secret role** enabled while the Wolfchild lives. The GM always sees the imitation border and lovers' pink borders, independent of player toggles. When both apply to one card, a pink border and orange outline show both relationships.

The GM's dawn death list includes each player's role icon. Deaths caused by Old Knight protection distinguish **Old Knight's Last Stand** (the Knight) from **Old Knight's Revenge** (the Werewolf); these causes carry through to death reveals and village events.

Night deaths are resolved at dawn in the daytime phase, before individual death reveals and the day's win-condition check.
Every night begins with the GM instruction to tell everyone to close their eyes and go to sleep. No player action is required; the GM continues when ready.

At dawn, the GM's upcoming-steps panel previews the remaining daytime flow even before those steps are queued. Once resolved, the actual queued daytime steps replace that forecast. Next-night steps remain a separate preview.

The Bearman's dawn report is skipped if the Bearman is dead or outside the role pool, including when they die during the morning reveals. Before confirmation, the GM sees whether the bear growls and why: either closest living neighbour in circular seating order must be Werewolf-aligned, with the Cloaked Wolf treated as a Villager.

The GM's dawn list previews only actual deaths using the same calculation as resolution. Unsuccessful Old Knight protection, potion saves, and an Elder surviving a Werewolf attack appear as small notes below the list, not as death entries.

Cupido's confirmed assignment immediately queues **lovers-meet**: the GM wakes both lovers to meet, then puts them back to sleep. Each lover privately sees their partner and pink borders on both town cards during that step, even with secret roles hidden. Afterwards the partner text and borders appear only with **Show secret role** enabled. Other players and display screens never see these private indicators; the GM's private view retains them.

Roles in the pool but not dealt to a player receive GM-only **Pretend** steps at their normal action moments (including first-night roles, Alchemist, Bearman, Big Bad Wolf, and Judge intervention). These steps have no choices, player UI, private results, or gameplay effects; the GM pauses and confirms to continue. Roles outside the pool and assigned roles that have died remain skipped. Conditional abilities such as the Hunter's death shot still require their actual trigger.

Revealed deaths include their cause in Village events and the death list for all viewers. Buried still hides the victim's role, not the cause of death.
Heartbreak causes also name the player's lover, including in the death list for previously recorded deaths.

When the lynch result already determines the last player's identity, the GM can only confirm it, not choose a different target.

The chain of votes to spare players continues until exactly one player remains unsaved. That player is the lynch target; having two unsaved players does not end voting or automatically spare the mayor.

Werewolf faction victories award wins to all Werewolf-aligned players, alive or dead, including converted Wolfchildren. Results and recorded match statistics use the same winner list.

A dead Wolfchild's alignment is frozen at death. They win with that faction, including a Villager victory if they died before converting; their imitation target dying later does not change it. Older death records use recorded death order to recover this alignment.

If the lynch target is the Fool, the GM confirms a separate public reveal step, followed by a step announcing the Fool's individual victory. The role stays visible to everyone, the Fool remains alive, and the normal post-lynch flow continues.

During the victory step, a Fool who is mayor must choose another active player as successor (the GM can also record the choice). After victory, the Fool is marked **Won · Out of play**: they are treated as dead for targeting, voting, living neighbours, Wolfchild imitation, and other game mechanics, without a death record or losing their individual victory.

Every new game starts in its pregame lobby with zero players assigned. Connected users initially remain spectators until they explicitly join an available team, role, or seat. The generic Lobby Durable Object exposes spectators in every snapshot; preserve that distinction in the game's `participants` implementation and let spectators view only information permitted by the rules. The frontend displays the live spectator list in its right-side spectator tab/panel.

Starting a match is an explicit host action, not an automatic side effect of lobby creation or a player's join. Validate the game-specific readiness requirements on the server and expose the corresponding start option in snapshots. In the frontend, place Start game and other host actions in the bottom `HostControlsTab`, with disabled state and clear guidance when the game is not ready. Keep the admin test-bot panel in its shared bottom location; do not recreate or relocate generic bot management controls inside each game.

### Test-bot support for every game

The generic Lobby Durable Object owns the admin **Add bot**, **Remove**, **Bots join game**, **Control**, **Control bot whose turn it is**, and **Autopilot** controls. These are not game-specific UI features to omit when adding a game; implement the game-module hooks and frontend turn detection so the shared tools work with that game's rules:

- `openSpots(state, userId)` returns the normal `handle` messages a bot can use to claim an available place, or an empty array when it cannot join. The server applies a randomly selected open-spot message. Check the lobby phase, existing membership, and seat/team/role limits in this hook and in `handle`; adding a bot only creates a spectator.
- `participants(state)` and `disconnect(state, userId)` must include/remove joined bots just as they do human players. Bot IDs are stable `bot-*` IDs, and the shared connected-player context includes them. Ensure snapshots and capacity checks account for bots appropriately.
- Admin snapshots contain a `botViews` entry for each bot, generated with `snapshot(state, botId, connected)`. Preserve the same privacy rules as for human viewers. The frontend's existing Control action uses that view and routes normal game messages through the bot's actor identity.
- `botMove(state, botId, options)` supplies a legal game message for Autopilot, or `null` when that bot has no move to make. The shared server applies moves through `handle`, repeatedly while progress is possible. Keep moves legal under the same phase, turn, and validation rules as human actions; do not rely on Autopilot to bypass normal checks. If automated play is not meaningful for a game, state this explicitly in its game documentation.
- In the frontend, extend `getTurnBotId` in `src/pages/LobbyPage.tsx` for games where a bot can be prompted to act. Identify the correct bot for the current phase/step and return `null` when none can take a manual turn. This drives **Control bot whose turn it is**; bot snapshots alone do not enable that control.
- Add focused tests covering bot join spots and limits, manual bot actions, removal/disconnect, and Autopilot behavior where supported. Test that an added but unjoined bot remains a spectator, and that all controls update snapshots without leaking private game state.

The Kin-only **Force pass** mode is intentionally separate and is not required for other games. New games should support the shared lifecycle above without adding duplicate bot-management UI to their lobby.

- `src/auth.ts` – PBKDF2 password hashing, bearer-token sessions, recovery keys (only hashes are stored).
- `migrations/` – D1 schema.

Pass Time's starter and custom clock catalog is stored in the `passTimeClocks` D1 table. The first request to `/api/pass-time/clocks` seeds any missing starter clocks; admins can edit, add, and remove catalog clocks in the Pass Time lobby.

## Local development

```
npm install
npm run db:migrate:local
npm run dev
```

## Tests

Run `npm test`. The runner automatically discovers all `*.test.ts` and `*.test.mjs` files recursively under `src/` and `scripts/`, including new game directories. Add test files there without editing `package.json` or a shared test list. No shell glob expansion is required, so the same command works on Windows and other platforms.

Node test-runner options can be forwarded, for example `npm test -- --test-name-pattern=Exploration`. Test failures produce a nonzero exit code.

## Live deployment

migrations:
npx.cmd wrangler d1 migrations list voedgoem --remote
npm.cmd run db:migrate:remote

deployment:
npx wrangler deploy

compile src:
npm run build


## Making a user an admin

Admins are set from the console only:

```
npm run admin:grant -- <username>            # local database
npm run admin:grant -- <username> --remote   # production database
npm run admin:grant -- <username> --revoke
```

Admins and Hosters can optionally set a password when creating a lobby. Leave it empty for a public lobby. Protected lobbies require the password before the server sends lobby state to a joining player; the host can enter directly.

The hub has a shared chat, and each lobby has its own chat over the lobby WebSocket. Chats retain at most 100 messages and expire each message after 30 days; closing a lobby deletes its chat history.

Admins can also grant or revoke the Hoster role from the Admin dashboard. Hosters can create and host lobbies, including configuring their games, but do not have access to the Admin dashboard or its user-management features.

## Deployment

Cloudflare Worker, D1, and Durable Object bindings are configured in `wrangler.jsonc`. Confirm the target account, database, CORS origin, and migration state before deploying:

```
npm run typecheck
npm run build
npm run db:migrate:remote
npm run deploy
```

Do not apply remote migrations or deploy unless the change has been reviewed and deployment is intended. See [CURRENT_STATUS.md](./CURRENT_STATUS.md) for the last known production and validation status.

## 31 Seconds

The rules of 30 Seconds with six words per card (four easy followed by two hard) and 31 seconds per turn. Teams have a captain and are drafted like Codenames. The describer opens the card to start the clock; after the timer and a host-set grace period the opposing captain marks each word as guessed or not (a connected teammate steps in if that captain is offline). Players can report existing words or recommend additions; neither action changes the active word pools. Admins can review and dismiss feedback in the Admin dashboard. First team to the host-set points (default 31) wins.

## Blokus

Standard four-player Blokus on a 20×20 board, with 21 pieces per color, rotations and flips, Blue/Yellow/Red/Green turn order, and server-validated placements. The first piece must cover a board corner; later pieces must touch the same color at a corner and never along an edge. Players with no legal placement are permanently out. The fewest unplaced squares wins, with ties sharing the win.

## Statistics, displays and cleanup

- Finished games record one row per real player in `gameResults` (migrations 0004 and 0005). Each game's `takeResult` hook supplies `userId`, `role`, `won`, and optional game-specific `flag`, `score`, and `extra` values. Define these meanings per game and keep them stable; do not record bot players.
- `src/stats.ts` defines 3-6 per-game statistics as SQL aggregates over those result fields. Add definitions for each game and make their labels and aggregates match the recorded meanings. `GET /api/stats/:game` serves them; the frontend needs matching game-specific styling for the statistics tab and modal.
- Display accounts (users.isDisplay) can't join games and only receive the spectator view.
- An hourly cron deletes non-admin, non-display users named dbg_* that are over an hour old.
- Games: Tetrys (solo and team mode), Woerdgoem, 31 Seconds, Dworf, Blokus, and Pass Time.
