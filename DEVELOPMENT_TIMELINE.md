# Development Timeline (Handoff)

This timeline reconstructs major work from the full conversation as summarized in retained checkpoints, the current visible conversation, and repository state. It is not a complete transcript. Prompt fragments are quoted exactly only when exact wording was preserved; other entries are explicitly summaries.

## Earlier project: CommonTime (separate from current work)

The first checkpoints concern a schedule planner with a React/Vite frontend and Cloudflare Worker/D1 backend. This is historical context only; do not modify those repositories for Voedgoem work.

- Admin account support, user list and recovery-key generation; the user reported not seeing the Admin tab and asked the assistant to fix it.
- Mobile schedule editing evolved into an always-visible drag-range editor. The old fine-tune grid was later removed at the user's request.
- Fixed a production login 404 caused by a missing `VITE_API_BASE_URL`.
- Added hour and half-hour dividers; corrected their appearance in dark mode.
- Added green override indicators for alternating-week and specific-week availability, plus finished-week controls/markers.
- Added group availability previews and loading overlays.
- User asked about cache behavior and avoiding stale data; caching was discussed but not implemented.
- The CommonTime changes were deployed live. Its repos had uncommitted changes at the time of handoff. Preserve them, but leave them untouched.

## Voedgoem foundation

**Prompt wording preserved in checkpoint summary (not guaranteed to be a verbatim full prompt):**

> Users register with username and password only, then land on a hub where they see games and join lobbies. Admins are set via the console. An admin has a tab to see all users and send recovery keys, and can create game lobbies from the hub.

The first game was Tetris: spectators can join, an admin/host starts the game, each player has a board, a score/results screen appears when play ends, and the host can return to the lobby.

- The first work was accidentally placed in incorrect sibling folders. The user corrected the location; code was moved to `F:\Workspace\voedgoem-groomp\voedgoem` and `...\voedgoem-server`. These are the actual repositories.
- Frontend hosting was kept as a static-assets Cloudflare Worker, not changed to Pages. A production `.env.production` value supplies the API URL.
- API and frontend Workers were deployed and smoke-checked; the API health endpoint returned `{"ok":true}`.
- Lobby capacity was raised to 20 for the initial game hub.
- Server architecture was later generalized into registered game modules.

## Game additions and platform capabilities (dates unavailable in retained summary)

- Added Codenames with bundled word lists, team roles, card key visibility, clue/guess/history handling.
- Added Codenames host-controlled scramble/draft phase and hints.
- Added admin lobby test bots; admins receive per-bot snapshots and can act as a bot.
- Fixed an old Durable Object state WebSocket 500 by adding module migration support and safe property access.
- Added avatars/profile editor, user avatar persistence, generated asset index, canvas tinting and avatar presence in lobby views.
- Added 31 Seconds with team/captain draft, seven-word cards, 31-second clock, grace interval, scoring by opposing captain, history and overtime.
- Added Saboteur server engine and UI, tunnel map, abilities, monsters, turn history, and detailed responsive controls.
- Added per-game completed results and statistics, display-only accounts, admin display-account creation, QR display, and hourly cleanup of old debug users.
- Added host kick controls; a kicked player returns to spectator and can re-seat. No ban was implemented.
- Added the general arcade-neon theme and distinct per-game themes.

## Conversation history with exact prompt fragments available

### Account administration

Exact user text recorded from the conversation:

> I want there to be admin users. An admin user should have their own tab where they can see a list of all current existing users, and they can generate and see recovery keys for users. Make the user groomp an admin

Follow-ups recorded exactly:

> I dont see an admin tab

> do it for me

The admin UI/API and account promotion were implemented in stages. Later an account named `Admin` was also promoted in production by a direct D1 update. The production account history is now inconsistent in the retained notes; verify current admin identities rather than assuming.

### Codenames, Saboteur, and responsive fixes

These prompt fragments were preserved exactly in the conversation summary:

- “the paimary disabled button that says "Can't choose yourself" still needs to have disabled stylign that makes it look darker”
- “The arrow that indicates movement of the monster should be between the tiles that it moves to, instead of the tile it is on, the monsters z-index should also be higher than the arrow”
- “in saboteur: the background of the player whose turn it is is transparent. Dont make it transparent, instead amek it a lighter version of the default brown that the player background usually is”
- “the can't choose yourself button needs to be a darker color when its disabled, its still not a darker color. This is the html I mean: `<button class="primary small" disabled="">Can't choose yourself</button>`”
- “On mobile, put the tab whose turn it is above the map (only on mobile)”
- “fix lantern should be a needle and thread icon instead of a hammer and wrench icon”
- “`<span class="sb-icon big">🪡🧵</span>` right now its this, make it this: `<span class="sb-icon big">🧵</span>`”
- “In the hisstory it doesnt say which ability card type was given to which player. It should say that”
- “the history log should be larger, on desktop it should cover most of the screen”
- “you should only be able to rotate tunnels by 180 degrees, not 90 degrees. As such the + tunnels can't be rotated and the straight up vertical and horizontal tunnels also can't be rotated. So disabled their buttons. Also edit the text to "↻ 180°" instead of "turn ↻"”
- “for codenames: the spymaster can't seem to see the cards right now.”
- “The spymaster still can't seem to see the color of the cards, plus due to "disabled" styling, all the cards look muted”

Fixes included high-specificity disabled CSS that excludes game pieces, solid active-turn background, mobile turn indicator above the map, one-thread icon, gifting history names, wide History modal, and 180-degree-only rotation.

### Codenames turn timer and operative tags

Exact prompt wording preserved:

> for codenames: there should be a timer for how long a team's turn is allowed to take (spymaster + operatives turn) which is 2 minutes. If you end your turn before the time is up that turn is added to your next turn. Team red gets an addition +1 minute to their first turn timer.

> There should be an end turn early button that operatives can click. When they click it it ends their turn for their entire team. Operatives can only click it when it s their operative turn.
>
> the timer should also be realtime, right now it only updates at the moment of clicking (the timer in the cn-status bar)

> for codenames: the amount of time left for a time should also real time update on the player team cards on the right. It should also show any time they had left over from the previous round after they end their team's turn

> for codenames: the time banked should be halfed when you end your turn. so if you end your turn with +2:00 it should be +1:00

The user later asked for operative interest tags and clarified audience and UI:

> in codenames: it should be possible for operatives to tag words to show they are interested in clicking it. on desktop that should be done by right clicking, on mobile this should be done by holding it. when tagging a word it should show the uername of the person tagging it in a small label at the top

> the small tag of the operative hint should be in the color of the team, so if a blue operative hints it it should be a blue tag

> are operative hints visible to all players? your hint should be visible to all

> each operative hint should be in its own box, as many boxes should be visible per card

The implementation makes tags public to all viewers, one team-coloured username box per tagger, and allows per-user toggling. The last request's “operative hint” was interpreted as the operative word-tag label, not the spymaster hint received by one operative.

Another exact prompt:

> for codenames: spymasters giving a hint should be of the opposite color of your own team. so if youre blue the hint can only be for red and not for blue etc

### 31 Seconds display visibility

Exact prompt:

> in 31 seconds: display users should see the words when the captain of the other team is scoring (but no other time)

Implemented via a reserved display viewer identity and a timed lobby tick so the display gets a snapshot exactly when the scoring phase begins.

### Recent production admin request

Exact prompt:

> make the user admin an admin

The assistant interpreted this as the production account with username `Admin`, queried D1, and set `isAdmin=1`. A later checkpoint also described `Groomp` as admin; therefore, verify current account status before any admin-account action.

### Documentation requests

Exact request to add server docs:

> Put the following markdown files in the voedgoem-serve repository:
> PROJECT_CONTEXT.md The main reference file for every new session
> REQUIREMENTS.md All agreed features and expected behavior
> DECISIONS.md Why you chose particular approaches and rejected others
> DEVELOPMENT_LOG.md Chronological record of important changes and prompts
> CURRENT_STATUS.md What works, what is broken, and what comes next
> ARCHITECTURE.md How the app is structured and how its parts connect

The repository spelling in that prompt was “voedgoem-serve”; the actual repository is `voedgoem-server`.

Current exact handoff request:

> I need to transfer this entire app development project to a new AI session without losing important context.
>
> Use the full conversation history available to you, including my original prompts, follow-up instructions, corrections, decisions, and the code or files created during development.
>
> Create a comprehensive PROJECT HANDOFF PACKAGE that another AI session can use to continue development as if it had participated in this session.
>
> [The user specified the 12 sections now covered by PROJECT_HANDOFF.md, plus a request to list unrecoverable information and files to transfer separately.]

## 2026-10-24 — recent gameplay refinements

- Fixed Codenames spymaster key visibility and disabled styling.
- Added a live two-minute Codenames team timer, red's initial one-minute bonus, time-bank display, early-end button, and half of unused time carried into the next team turn.
- Added Codenames public operative interest tags: desktop context menu, mobile hold, individual colored name boxes. Tags clear at turn end or on revealed cards.
- Restricted spymaster hints to unrevealed words in the opposing team's colour; hint's target operative remains randomly assigned and private to the intended recipient and giver.
- Made 31 Seconds display users see card words only while the opposing captain is scoring.
- Made production account `Admin` an admin via D1, according to the conversation.
- Server/frontend deployments were reported successful. No commit/push was made.

## 2026-10-26 — handoff documentation

- Added server-side context, requirements, decisions, status, architecture and development log documents.
- Corrected deployment guidance in backend README after finding its old “resources are not created yet” section contradicted the actual Cloudflare config.
- Added this comprehensive handoff package and implementation/timeline companion docs.
- No application source code was changed for the handoff.

## What cannot be reconstructed

- Exact date/order and complete exact wording for most older prompts, due to conversation summarization.
- Exact commits, PRs, branches, and pushes for the two repositories; current repo history had only a couple of visible commits, and prior summaries say feature work is uncommitted.
- Exact currently deployed Worker version for all historical deployments.
- Full manual browser/phone test results; most recent UI behaviors were explicitly unverified live.

Don't invent the missing details. If exact user intent matters, ask the user.
