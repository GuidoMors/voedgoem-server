# dworf server guide

Server game rules, state and validation notes. Consult the implementation and tests for current behavior; coordinate UI changes with the sibling frontend.

- Supports 4-14 players with a 7x13 board, ladder start, three goal positions, and role-specific win conditions.
- Tunnel placement must connect to the reachable path and match each adjacent tunnel/ladder edge. A placement can reveal a goal. Gold gives explorers an immediate win; monsters move toward the ladder at turn end and reaching it gives cultists the win.
- Includes gems and a face-up ability-card shop; gem placements can let the player gift a shop card to another player.
- Includes pickaxe/lantern break and repair, tunnel destruction, private goal/role peeks, and host force-skip when the active player is offline.
- Tunnel rotation is 180 degrees only. Symmetric tunnels (cross, vertical, and horizontal) do not need rotation.
- When no player holds a tunnel, the game ends under the current "all tunnels played" rule, regardless of cards remaining in the deck. Treat this interpretation as an established implementation decision unless the user changes it.
- Turn state and legal actions are validated by the game module.

## Historical implementation notes

- 7x13 board, ladder at row 3/column 3, three goal locations in far column, six gems, tunnel placements and role-specific objectives.
- Engine was separately simulated across random player counts/game outcomes. Historical assumptions about counts/edge cases are in [CURRENT_STATUS.md](../../../CURRENT_STATUS.md) and the 2026-10-24 checkpoint.
- Tunnels rotate only 180 degrees. Cross, vertical and horizontal cards are symmetric and their rotation controls are disabled.
- The UI has separate tunnel/ability hand areas, a Shop of face-up cards, monster move arrows between cells, player turn/history panels, mobile turn banner, and game-specific dirt/stone theme.
