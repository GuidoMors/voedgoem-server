# The Pieces

Each player has the same 21 pieces. The set is every possible polyomino (shape of edge-joined squares) of size 1 through 5.

| Size | Name type | Count of shapes |
|------|-----------|-----------------|
| 1 | Monomino | 1 |
| 2 | Domino | 1 |
| 3 | Trominoes | 2 |
| 4 | Tetrominoes | 5 |
| 5 | Pentominoes | 12 |
| | **Total pieces** | **21** |

Total unit squares: 1 + 2 + 6 + 20 + 60 = **89**.

## Piece Shapes
Each shape is drawn with `X` for a filled square and `.` for an empty one. Shapes are shown in one orientation only; every piece may be rotated and flipped (see below).

### 1 square
**I1 (Monomino)**
```
X
```

### 2 squares
**I2 (Domino)**
```
XX
```

### 3 squares
**I3 (Straight tromino)**
```
XXX
```
**V3 (Bent tromino)**
```
X.
XX
```

### 4 squares
**I4 (Straight tetromino)**
```
XXXX
```
**L4 (L tetromino)**
```
XXX
X..
```
**O4 (Square tetromino)**
```
XX
XX
```
**T4 (T tetromino)**
```
XXX
.X.
```
**Z4 (Skew tetromino)**
```
XX.
.XX
```

### 5 squares
**F5**
```
.XX
XX.
.X.
```
**I5**
```
XXXXX
```
**L5**
```
XXXX
X...
```
**N5**
```
XXX.
..XX
```
**P5**
```
XX
XX
X.
```
**T5**
```
XXX
.X.
.X.
```
**U5**
```
X.X
XXX
```
**V5**
```
X..
X..
XXX
```
**W5**
```
X..
XX.
.XX
```
**X5**
```
.X.
XXX
.X.
```
**Y5**
```
XXXX
.X..
```
**Z5**
```
XX.
.X.
.XX
```

## Transformations
When placing a piece, a player may:
- **Rotate** it by 90, 180, or 270 degrees.
- **Flip** it (mirror image), then rotate.

Any of the up to 8 resulting orientations is allowed. Pieces that look the same after a transformation simply have fewer distinct orientations (for example, the monomino has 1, the O4 square has 1, the X5 has 1, and the I pieces have 2).

A flipped piece is always allowed. Players are not restricted to the printed "handedness" of asymmetric pieces such as F5, L5, N5, P5, Y5, Z4, Z5.

## Piece placement footprint
A placed piece covers exactly the squares of its chosen orientation, all of which must lie on the board and on currently empty squares.
