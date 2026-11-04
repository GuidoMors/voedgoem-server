# Pass Time

Pass Time is a cooperative card game based on Take Time, with the changes described here.

## Visual style

The game should feel old-timey, with the atmosphere of an old-fashioned clockhouse. Use a warm, traditional look that evokes aged clockwork and a historic timepiece, while keeping the clock, cards, and game information clear and easy to read.

## Components and deal

There are 24 cards: one black and one white card for each value from 1 to 12. The game supports 2 to 12 players. At the start of each attempt, shuffle the deck, deal 12 cards, and leave the other 12 out of play. If the game does not end early because a segment total exceeds 24, all dealt cards must be played.

This is how the 12 cards are dealt:
- 2 players: each player is dealt 3 cards, then after both players have played those cards, each is dealt another 3 cards.
- 3 players: each player is dealt 4 cards.
- 4 players: each player is dealt 3 cards.
- 5 players: three players are dealt 2 cards and two players are dealt 3 cards. The players earlier in turn order receive the extra cards.
- 6 players: each player is dealt 2 cards.
- 7–12 players: start with six two-card hands, as in a six-player game. Each additional player joins one of those six players to form a pair sharing that player's two-card hand. A pair always has exactly two players; no trios are formed.

## The clock

Players are represented by their avatars around a circular table. The clock is a large central game piece with six segments. The top left most segment is segment 1, with the next segment clockwise being segment 2, etcetera.

The clock has a hand that lies in a boundary between segments. During deliberations, the host picks a spot for the hand on one of the boundaries. Deliberations cannot end before the hand has been placed. Each deliberation, the hand starts in the last spot that the host chose, but they can move it to another boundary during deliberation. The location of the hand only affects the base incremental-value rule; it does not affect segment numbering.

Segment positions stay fixed as well; only the rules move between segments when a rotation rule is triggered. A clockwise rotation moves every segment rule one segment position clockwise; a counter-clockwise rotation moves every segment rule one segment position counter-clockwise.

### Base rules

These rules always apply:

- One-card rule: By the end of the game, every segment must contain at least one card.
- 24-total rule: A segment's total must not exceed 24. Exceeding 24 is an immediate loss, even on a clock with rotation rules; later rule rotations or the final hand move cannot undo it.
- incremental-value rule: When all cards are played, the segment immediately clockwise from the hand can have any value, but every other segment has the rule that the combined value of the cards played there must be equal or greater than the previous segment clockwise.

### Optional rules

Optional rules may be combined on a segment, except that no segment may have more than one rotation rule. Some rules are clockwide.

- **CLOCK 2 CARDS:** Clockwide. Every segment must contain exactly two cards.
- **NO HINT:** Clockwide. players may not use hints anywhere in this clock.
- **NO N:** cards valued one below, equal to, or one above N cannot be played in this segment (for example, NO 7 applies to 6, 7, and 8). On a clock with no rotation rule, reject a placement into NO N if the card is in that range and let the player choose again; this does not cause a loss. If the clock contains any rotation rule, allow these placements during play and evaluate the rule at the end.
- **NOTHING:** this segment is unavailable for players to choose while this rule is there; reject the placement and let the player choose again. It is allowed only on clocks that also contain a rotation rule. Cards are allowed to be in this segment, they just aren't allowed to be placed there. It does not require the segment to be empty at the end of play.
- **MOST:** this segment must contain strictly more cards than every other segment. At most one segment in a clock may have MOST.
- **X N:** the segment total must be N, one below, or one above (for example, X 6 allows totals of 5, 6, or 7). The base maximum total of 24 still applies.
- **B W:** the segment must contain exactly one black and one white card. **W** means exactly one white card and no others. **B B W** means exactly two black cards and one white card, and no others.
- **N CARDS:** the segment must contain exactly N cards (for example, 2 CARDS means exactly two).
- **#N:** the Nth player-played card of the attempt must be placed in this segment. The game enforces this destination when that card is played. DRAW cards do not count toward this numbering. Multiple numbers on one segment (for example, **#1 #2**) each apply, so both the first and second player-played cards must go in that segment.
- **+ B / - W (also written B+ / W-):** the highest black card / lowest white card dealt to players must be placed in this segment. Similar rules apply to other colors.
- **DRAW:** when play starts, process DRAW rules one at a time in current segment order. For each, draw one random card from the 12 cards not dealt to players and place it in that segment. DRAW cards count toward segment totals, card counts, color requirements, the one-card minimum, and the 24 maximum. If a DRAW placement triggers a rotation rule, resolve that rotation before processing the next DRAW. DRAW cards do not count as a player's turn or toward #N. Clocks may not contain more than 12 DRAW rules.
- **↘ / ↙:** Also called the rotation rule. immediately after a card is placed in this segment, move all segment rules one position clockwise / counter-clockwise. This applies to player-played and DRAW cards. The hand and card piles remain in place.

Show rules on the clock using clear symbols, numbers, and icons. Each symbol must have an explanation available on hover or equivalent touch interaction.

## Lobby, deliberation, and play

The host chooses a clock in the lobby. Clocks are grouped by level, and the selected clock has a preview before the game starts.

When the game starts, players see the clock and its rules but no cards, including their own. Players deliberate. When play begins, each player can see their own hand and, if assigned to a pair, the shared cards of that pair.

Any player with cards may play the first card. After that, turns follow seating order, starting with the player after whoever played the first card. A player must play one card on each of their turns. Cards are placed in a segment face down, except when using a hint.

Check rule requirements using only cards already played on the clock, not cards remaining in players' hands. During play, the only rule-based loss is a segment total exceeding 24; it ends the game immediately, including when caused by a DRAW card. On clocks without a rotation rule, an invalid NO N placement is rejected without ending the game. NOTHING segments are unavailable for placement on every clock. On clocks with a rotation rule, do not check other rule requirements during play; evaluate them after all cards have been placed and the optional final hand move is complete. On clocks without a rotation rule, check final requirements after all cards have been placed and the optional hand move is complete as well. The players win only if every final requirement is satisfied. At the end, whether the players win or lose, all 24 cards become visible to everyone, including cards that were out of play and cards remaining in hands after an early loss. The results show the 12 cards originally dealt grouped by player or shared hand, separately from the 12 cards that were not dealt; DRAW cards come from this second group. On a loss, highlight the card or cards that caused it.

When a game ends, the host can return to the lobby or retry the same clock. A retry starts a new attempt with the same clock, shuffles and deals new cards, provides another deliberation period, and resets the shared hint allowance. The hint allowance does not reset after the second three-card draw in a two-player game.

During play, the host can end the current attempt at any time. This ends the game as a loss and reveals all cards.

After all cards have been placed, all players have a simultaneous opportunity to move the hand once. Click an edge between segments to place the hand there; the current hand position cannot be selected. The first player to choose a different position ends this step immediately, and no other player can move the hand. If everyone passes, or no one moves it for 20 seconds, the hand stays where it is. As soon as this step ends, evaluate final requirements and reveal the results. Moving the hand changes the orientation used for the base incremental-value rule.

## Hints

The group has four shared hints per attempt. A hint is used by placing a card face up at a segment instead of face down; it counts as a normal card placement.

## Clock catalog

Admins can create and edit clocks in a modal by selecting segments and adding optional rules, then assigning a level. Admins can also edit existing clocks. All clocks, including the initial catalog and custom clocks, are stored in the Cloudflare D1 database and are available to everyone. The host chooses a clock in the lobby from the available clocks, grouped by level; show a clock preview before the game starts. Do not generate a random combination of optional rules at game start. JSON files are not used as the editable clock store.

The following starter clocks are grouped by level. Each bullet is one complete selectable clock; the listed segment rules are applied together. A standalone NO HINT bullet is a clock-wide rule.

- **Level 0:** only the base rules, no optional rules.
- **Level 1:**
  - Segment 1: X 6; Segment 4: B W
  - Segment 3: X 9; Segment 4: 3 CARDS
  - Segment 2: #2; Segment 3: #1; Segment 6: X 24
  - Segment 1: W; Segment 2: 3 CARDS
- **Level 2:**
  - Segment 1: NO 2; Segment 3: NO 5; Segment 4: NO 8; Segment 6: NO 11
  - NO HINT
  - Segment 3: NO 8; Segment 4: NO 8
  - Segment 1: NO 2; Segment 2: NO 2; Segment 3: NO 2
- **Level 3:**
  - Segment 2: 2 CARDS; Segment 3: X 6; Segment 4: - W; Segment 6: B +
  - Segment 1: #1 #2; Segment 4: B+; Segment 6: W-
  - CLOCK 2 CARDS
- **Level 4:**
  - CLOCK 2 CARDS; Segment 1: B+; Segment 6: B-
  - CLOCK 2 CARDS; Segment 1: B W; Segment 2: #2; Segment 5: #3; Segment 6: B W
  - CLOCK 2 CARDS; Segment 2: X 15; Segment 4: W-
- **Level 5:**
  - Segment 1: MOST; Segment 3: NO 8; Segment 4: NO 8
  - Segment 1: #12; Segment 3: -W; Segment 4: -B
  - Segment 6: X 20; Segment 4: +W
- **Level 6:**
  - Segment 2: DRAW; Segment 5: DRAW; Segment 6: #12
  - Segment 1: DRAW; Segment 2: B B W W; Segment 6: + B, - W
  - Segment 1: DRAW; Segment 3: DRAW; Segment 5: DRAW
  - Segment 1: DRAW; Segment 3: NO 8; Segment 4: NO 8
- **Level 7:**
  - Segment 1: ↘; Segment 2: ↘; Segment 5: ↙; Segment 6: ↙
  - Segment 2: ↘; Segment 4: NOTHING; Segment 6: X 19

## Pairs and Huddle

With 6 players, each player has a separate two-card hand. With 7–12 players, the first six players in seating order when the game starts are the original players, each with a separate two-card hand. Each additional player pairs with the next original player in seating order: player 7 pairs with player 1, player 8 with player 2, and so on. The pair shares that original player's two-card hand. Every pair contains exactly two players, and any original players not joined in a pair keep their own two-card hands. Either player in a pair may play either card from their shared hand on their own turn. Players in a pair can see each other's cards and use a special **Huddle** tab. Huddle works like chat but is visible only to the two players in that pair. Clear and remove it when the game ends.

## Roles and controls

- The **host** is the creator of the lobby. The host chooses a clock, starts the game and play, sets the hand position, and retries the clock.
- An **admin** is an account with the admin account type. Admins can create and edit clocks, including existing clocks, and save them in the shared D1 catalog.
- Seating order is the order in which players joined the lobby. Before the game starts, an admin can rearrange players. Turns proceed clockwise in seating order, wrap around, and skip players who have no cards.
- In a two-player game, both players must play all three cards from the first deal before either player draws the second three cards.
