# Design Decisions

This is a living record of decisions that shape the server. It describes the current approach and its rationale; the source code and migrations remain authoritative.

## Durable Objects own live lobby state

**Decision:** One Cloudflare Durable Object instance is addressed by lobby ID and owns that lobby's active WebSockets and game state.

**Rationale:** A game needs a single serialized authority for simultaneous actions, current participants, and broadcasts. The generic lobby shell can provide that without duplicating transport and persistence code in every game.

**Alternative not chosen:** Implementing separate HTTP state mutation and synchronization layers for each game would duplicate concurrency and connection handling.

## Games plug into a shared module contract

**Decision:** Each game implements `GameModule` and is listed in `src/games/registry.ts`.

**Rationale:** The shared lobby can dispatch actions, track participants, take snapshots, handle disconnects, run optional ticks, and persist results consistently. Game-specific state and rules remain isolated.

**Alternative not chosen:** A large game switch statement in the lobby would mix generic infrastructure with game rules.

## D1 stores durable account and summary data

**Decision:** D1 stores users, sessions, lobbies, and completed per-player results; active game state belongs to the Durable Object.

**Rationale:** Account and historical records require relational queries, while live game state is naturally scoped to one lobby.

## Keep authentication secrets hashed

**Decision:** Passwords are PBKDF2 hashes; bearer session tokens and recovery keys are stored only as SHA-256 hashes. Recovery keys are returned once when generated.

**Rationale:** A database read should not expose reusable credentials or recovery secrets.

## Snapshot generation is viewer-aware

**Decision:** Game snapshots receive a viewer ID and connected-player set; modules declare whether their snapshot varies per viewer.

**Rationale:** Codenames and similar games have hidden information. The transport can send each user the correct view and cache only snapshots that are safe to share.

**Display exception:** Display accounts receive a reserved `DISPLAY_VIEWER` identity. This allows a game to grant narrowly-scoped spectator information without impersonating a player. In 31 Seconds, the display identity reveals a card only during the opposing captain's scoring period.

## Display accounts are spectators, not players

**Decision:** Display accounts cannot send WebSocket game actions and are excluded from connected-player membership.

**Rationale:** A screen can follow a lobby without occupying a seat, affecting player availability, or exercising player permissions.

## Admin provisioning is an operator action

**Decision:** Admin grants and revocations use `scripts/set-admin.mjs`, rather than a public self-service endpoint.

**Rationale:** Escalation of account privilege must remain an explicit database operator action. Admin APIs are then guarded by the authenticated `isAdmin` property.

**Hoster role:** Lobby creation can also be granted from the admin dashboard through a separate `isHoster` flag. This allows trusted users to create and host games without granting access to admin APIs, user management, recovery-key generation, or test-bot controls.

## Word lists are generated during lifecycle scripts

**Decision:** Text word lists are bundled into generated TypeScript by `scripts/build-words.mjs`, which runs before typecheck, build, and deploy.

**Rationale:** Word data remains maintainable as text files while the Worker receives a build-time module it can import.

## Real-time progression is opt-in

**Decision:** A game that needs timers or automatic progression implements `tickMs` and `tick`; the generic lobby schedules only the next requested tick.

**Rationale:** Games without timed behavior do not require a constant polling loop. Timed games can still trigger authoritative updates and snapshots.

## Game-specific outcome data, shared persistence

**Decision:** Each game supplies a `takeResult()` payload through a shared per-player result type; `src/stats.ts` defines its aggregate meaning.

**Rationale:** The lobby can persist completed games uniformly while each game retains control over its roles and result semantics.

## Frontend behavior stays in the frontend repository

**Decision:** UI layout, appearance, pointer interactions, and visual presentation live in the sibling `../voedgoem` repository. The server validates corresponding game actions and permissions.

**Rationale:** Keeping the React client separate from the Worker avoids coupling presentation to server modules while retaining server authority over outcomes.
