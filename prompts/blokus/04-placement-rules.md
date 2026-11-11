# Placement Rules

This file defines when a placement is legal.

## Definitions

- **Edge contact (side contact):** Two squares share a side. For square (c, r), the edge neighbors are (c-1, r), (c+1, r), (c, r-1), (c, r+1).
- **Corner contact (diagonal contact):** Two squares touch only at a corner point, and do not share a side. For square (c, r), the corner neighbors are (c-1, r-1), (c+1, r-1), (c-1, r+1), (c+1, r+1).
- **Own piece:** A piece in the same color as the player.
- **Opponent piece:** A piece in a different color.

## Legal Placement: First Piece
A player's first piece is legal if and only if:
1. All of its squares are on the board.
2. All of its squares are empty.
3. At least one of its squares is on a corner square of the board.

## Legal Placement: All Later Pieces
A later piece is legal if and only if **all** of the following hold:

1. **On the board.** Every square of the piece lies within the 20x20 board.
2. **On empty squares.** No square of the piece overlaps any piece already placed, of any color.
3. **Corner contact with own color (required).** At least one square of the new piece has a corner contact with a square of one of the player's own already-placed pieces.
4. **No edge contact with own color (forbidden).** No square of the new piece shares a side with a square of any of the player's own already-placed pieces. This includes the other squares of the new piece's own edges touching previously placed own pieces anywhere.

## Interaction with Opponent Pieces
- A piece may touch opponent pieces by edge, by corner, or both.
- Touching opponents has no restriction and no benefit by itself.
- Corner contact with an opponent piece does **not** satisfy rule 3. The required corner contact must be with the player's own piece.
- Pieces may block an opponent by occupying squares the opponent would want to use. Blocking is a normal and intended part of play.

## Notes on the Corner Rule
- The corner contact needed for rule 3 must be a true diagonal touch between a square of the new piece and a square of one of the player's own pieces.
- One valid corner contact is enough. A piece may touch several of the player's own pieces at corners at once.
- Rule 4 applies to the whole piece. If even one square of the new piece shares a side with any own piece, the placement is illegal, even if other squares make valid corner contacts.

## Examples
Let `B` be an existing Blue piece and `n` a new Blue piece. Dots are empty.

**Legal (corner contact only):**
```
B . .
. n n
```
The `n` square at the lower-left of the new piece touches `B` diagonally, and no side of any `n` square touches `B`.

**Illegal (edge contact with own piece):**
```
B n
. n
```
The new piece shares a side with `B`.

**Legal (touching an opponent by side):**
```
R n n
```
`R` is Red. Blue's new piece sits beside a Red piece. This is allowed, but the piece must still meet rule 3 through contact with a Blue piece elsewhere.

**Illegal (only corner contact is with an opponent):**
```
R . .
. n n
```
If `R` is Red and Blue has no corner contact elsewhere, the placement fails rule 3.

## Summary Checklist for a Legal Later Move
- [ ] Fully on the board
- [ ] Only on empty squares
- [ ] At least one corner contact with an own piece
- [ ] Zero edge contacts with own pieces
