# blokus server guide

Server game rules, state and validation notes. Consult the implementation and tests for current behavior; coordinate UI changes with the sibling frontend.

- Standard play uses four players on a 20×20 board. Colors and fixed turn order are Blue, Yellow, Red, Green.
- Each player has the 21 unique polyomino pieces made from one to five squares, with rotations and mirror flips allowed. Pieces cannot be moved after placement.
- A first piece must cover an unoccupied board corner. Every later piece must cover only empty board squares, corner-touch at least one piece of its own color, and never edge-touch its own color. Contact with other colors is unrestricted.
- A player must place a piece whenever any legal placement exists. When no legal placement remains, that player is permanently out; play continues until every player is out.
- Basic scoring counts unplaced unit squares; the player with the fewest wins and tied scores share victory. Two/three-player variants, Blokus Duo, and optional advanced scoring are not part of the standard implementation.
