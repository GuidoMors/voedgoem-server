# Overview and Components

## Objective
Blokus is a turn-based strategy game of territory and space. Each player tries to place as many of their 21 pieces on the board as possible. The player with the fewest squares left unplaced at the end of the game wins.

## Players
- The standard game is for **4 players**.
- Each player has one color: **Blue, Yellow, Red, Green**.
- Variants for 2 and 3 players are in `07-variants.md`.

## Board
- A square grid of **20 columns by 20 rows (400 squares)**.
- Squares are identified by (column, row), each from 1 to 20, with (1,1) at the top-left corner.
- The four corner squares are (1,1), (20,1), (1,20), (20,20).
- All squares start empty.

## Pieces
- Each player has a set of **21 pieces** in their own color.
- Each piece is made of 1 to 5 unit squares joined edge to edge.
- Each set contains **89 unit squares** in total.
- Details of each piece are in `02-pieces.md`.
- Pieces, once placed, are never moved or removed for the rest of the game.

## Summary of how play works
1. Players take turns in a fixed order.
2. On a turn, a player places exactly one of their unplaced pieces on the board, or passes if no legal placement exists.
3. A player's first piece must cover a corner square of the board.
4. Every later piece must touch at least one of that player's own pieces **only at corners**, never along an edge.
5. Pieces of different colors may touch each other in any way.
6. The game ends when no player can place any more pieces.
7. Scoring is based on the squares left unplaced.
