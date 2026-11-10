# Setup and Turn Order

## Setup
1. The 20x20 board is empty.
2. Each of the four players receives their full set of 21 pieces in one color.
3. No pieces are pre-placed.

## Turn Order
- Turn order is fixed for the whole game: **Blue, then Yellow, then Red, then Green**, and then back to Blue.
- Blue takes the first turn of the game.
- A player whose turn comes up must either place one piece or pass (see `05-passing-and-game-end.md`).

## Turn Structure
On their turn, a player:
1. Chooses one of their pieces that has not yet been placed.
2. Chooses an orientation (rotation and/or flip).
3. Places it on the board in a legal position (see `04-placement-rules.md`).

Exactly one piece is placed per turn. Players may not place two pieces in one turn, and may not swap or take back a placement.

## First Move
- Each player's first piece must cover **one of the four corner squares** of the board: (1,1), (20,1), (1,20), or (20,20).
- Any piece may be used for the first move, in any orientation, as long as one of its squares sits on a board corner.
- Players are **not** assigned particular corners. A corner may be chosen freely, provided it is still empty (not already covered by another player's piece).
- If every corner is already covered when a player has yet to make their first move, that player has no legal first move and must pass (see edge cases).
- The first piece is exempt from the normal "touch your own piece at a corner" requirement, because the player has no pieces on the board yet.
- The first piece **is** still subject to the rule that it must lie fully on the board on empty squares.

## Later Moves
Every piece placed after a player's first must follow the rules in `04-placement-rules.md`.
