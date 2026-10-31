I want to make a new game. It is called Pass Time. It uses the rules of the card game Take Time but with some changes. The rules are as follows:

Here are the game elements:

Players are represented in seating order by their avatars. They are seated around a table in a circle. In the center of the table is a clock. The clock is a large game piece element that takes up most of the view.

There are 24 cards. Cards have a color: they are either black or white.
Cards have a number: ranging from 1 to 12. At the start of the game the cards are shuffled and 12 of them are dealt out to the players and 12 of them are not part of the game.

Each game has a clock with 6 segments.The clock has a hand that separates two segments. It starts at the top, separating the top right and top left element.  The top right element will be called segment 1, the top left element will be called segment 6. Players take turns in seating order placing one card at a segment face down. When the last card is placed all the cards are revealed. Each segment has rules. If all the rules are met when the cards are revealed, the players win. 

After the game admin clicks start game no one sees their cards, but the clock and its rules are revealed to the players. The game admin can change the location of the hand to somewhere else. The game admin can at any point click a button to “start play”. When he does so the cards in each players hand are revealed to the players. The first turn is taken by the first player that chooses to play their card. Afterwards the card placements are done in seating order.

If at any point a rule of a segment is broken, the game ends early. If the rules of the segments are not met when the cards are revealed, the game also ends. When the game ends the admin can choose to exit back to lobby or to retry the clock. If they choose to retry the cards are shuffled and handed out again. Additionally there is another deliberation time where the admin can click the “start play” button to stop deliberations.

A clock has 6 segments.
 It also has a hand that points straight up, right between the top left element and the top right element.

For the segments the following rules are always active:
Rule: each segment needs to have at least one card when the cards are revealed at the end.
Rule: the total of a segment is not allowed to go over 24 in the value of the cards placed at that segment.
Rule: Each segment must be greater than or equal to the previous counter-clockwise segment, except for the segment 1 (directly right of the hand).

There are optional rules that can be added to make a clock more difficult. Only 1 extra optional rule can be added per segment:
For this clock every segment must have exact amount of cards: CLOCK 2 CARDS
For this clock the players arent allowed to hint. Example rule: NO HINT
No card of a certain value, or a card of one value lower or higher, can be played at this segment. Example rule: NO 7 = No 6, 7, 8 can be played at this segment.
No card at all can be played in this segment: Example rule: NOTHING
This segment should have most cards. Example rule: MOST
The total of this segment must be a certain value, or one value lower or higher when revealed. Example rule: X 6
This segment must contain a certain number of colored cards. Example rule: B W = a black card and a white card, and nothing else. Example Rule: W = one white card and nothing else. Example rule: B B W = Two black cards and a white card and nothing else.
This segment must contain a certain number of cards of any color. Example Rule: 2 CARDS
In order the certain ordered card must be placed at this segment. Example: #2 = the second card placed must be at this segment.
The highest card of a color from hands must be played here. Example: + B = highest black card among played cards must be here when revealed at end of game.
The lowest card of a color from hands must be played here. Example: - W = lowest white card among played cards must be here when revealed at end of game.
When play starts, a random card not among hands is drawn and placed in this segment. Example: DRAW
When a card is played here, the clock turns one segment in the direction of the arrow (the rules of segments move on direction, the hand moves one segment over, but the cards stay in place). Example: ↘ = rotates to the right, Example: ↙ = rotates to the left
For each of the rules use cool emoji’s, numbers and symbols for the rules on the segment. When you hover over the rules it should give an explanation. 


Players are allowed 4 hints. A hint is used by placing a card face up at a segment instead of face down.

The admin can make a clock while in the game lobby in the following ways:
They can click to customize a specific clock. This causes a modal pop-up where the admin can click segments and add bonus rules. After making a clock, the admin can even assign it a level and store it. The server saves this as a clock at that difficulty, adding it the json for the level of difficulty.
They can select a difficulty level for the clock. When the game starts it will generate a clock with random optional rules for that difficulty level.
Level 0: only the base rules, no optional rules.
Level 1: 
Segment 1: X 6, Segment 4: B W
Segment 3: X 9, Segment 4: 3 CARDS
Segment 2: #2, Segment 3: #1, Segment 6: X 24
Segment 1: W, Segment 2: 3 CARDS
Level 2:
Segment 1: NO 2, Segment 3: NO 5, Segment 4: NO 8, Segment 6: NO 11
NO HINT
Segment 3: NO 8, Segment 4: NO 8
Segment 1: No 2, Segment 2: NO 2, Segment 3: NO 2
Level 3:
Segment 2: 2 CARDS, Segment 3: X 6, Segment 4:  - W, Segment 6: B +
Segment 1: #1 #2, Segment 4: B+, Segment 6: W-
CLOCK 2 CARDS
Level 4:
CLOCK 2 CARDS, Segment 1: B+, Segment 6: B-
CLOCK 2 CARDS, Segment 1: B W, Segment 2: #2, Segment 5: #3, Segment 6: B W
CLOCK 2 CARDS, Segment 2: X 15, Segment 4: W-
Level 5:
Segment 1: MOST, Segment 3: NO 8, Segment 4: NO 8
Segment 1: #12, Segment 3: -W, Segment 4: -B
Segment 6: X 20, Segment 4 +W
Level 6:
Segment 2: DRAW, Segment 5: DRAW, Segment 6: #12
Segment 1: DRAW, Segment 2: BB WW, Segment 6: + B, - W
Segment 1: DRAW, Segment 3: DRAW, Segment 5: DRAW
Segment 1: DRAW, Segment 3: NO 8, Segment 4: NO 8
Level 7:
Segment 1: ↘, Segment 2: ↘, Segment 5: ↙, Segment 6: ↙
Segment 2: ↘, Segment 4: NOTHING, Segment 6: X 19


For each level make a .json file. Put all the clocks of that level inside the json file. 
Make it easy for me to edit the .json file.

In these special situations there are additional rules:
In a 2 player game each of the players first draws 3 cards. Then when they have each played their 3 cards they draw 3 more.
In a game with more than 6 players, each 2 players are considered neighbours.  If there is one play that is the odd one out, they join the last group of 2 neighbours into a trio of neighbours. They can see each other's cards, and they can access a special tab in the top called “Huddle”. This special tab functions like the chat tab, except only your neighbours that you share cards with are in it and can read it. The Huddle tab is cleared and removed when a game is ended.
