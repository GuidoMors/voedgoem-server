# Cookaloor — Player Controls and Movement

## 1. Keyboard Controls

Players can use either the arrow keys or WASD to move.

| Control | Behaviour |
|---|---|
| Left arrow or A | Move left |
| Up arrow or W | Move up |
| Right arrow or D | Move right |
| Down arrow or S | Move down |
| Spacebar | Perform the highest-priority available interaction |
| Escape | Request a pause, when the player is the host |

Movement continues while the relevant direction is held and stops when the key is released.

The game uses the player's current movement and facing state to determine their position and the direction in which they are looking.

## 2. Spacebar

The spacebar is the general interaction control.

Its behaviour depends on the player's current hands and the target in front of them.

Its exact priority is:

1. Drop the carried stack if the player is holding anything.
2. Otherwise, pick up an eligible ground item in front.
3. Otherwise, take an item from a dispenser in front, if it has a charge.
4. Otherwise, trigger the other interaction associated with the tile in front.

The full explanation and exceptions are described in the spacebar interaction document.

## 3. Facing Direction

The direction a player faces is important when interacting.

The spacebar uses the current facing direction. It does not automatically turn the player toward the nearest item or the nearest dispenser.

The game checks the tile in front of the player and searches for eligible ground items in the player's forward area.

Some alternative pointer-based controls can set the facing direction based on where the player points or taps before requesting an interaction.

## 4. Mouse and Touch Controls

The game also supports pointer-based controls on the play area and directional controller.

These controls can be used to move or point the player.

A quick double-click or double-tap can request an interaction in the direction indicated by the pointer.

The game uses the same interaction priorities as the spacebar. Changing the direction does not create a different set of interaction rules.

Holding and dragging can be used to direct movement. Releasing the pointer ends the corresponding movement input.

## 5. On-Screen Directional Controls

The on-screen directional buttons control movement.

Pressing a directional button moves the player in that direction.

Releasing it stops that directional input.

These buttons are movement controls, not a separate pickup, drop, dispenser or submission command.

## 6. Chat Input

When the in-game message input is active, keyboard input is treated as text entry rather than gameplay control.

As a result, pressing the spacebar while typing in chat does not perform the normal gameplay interaction.

## 7. Pause Control

Escape requests a pause only when the game is running and the current player is the host.

The pause control is not available to ordinary non-host players through this keyboard action.

## 8. Processing and Movement

Some item-processing actions require the player to remain in place.

Moving during manual processing can interrupt that processing.

Picking up an item also stops processing associated with the item's previous location.

Players should therefore avoid moving away from an item while a manual processing action is underway if they want that action to continue.

## 9. Practical Control Reminders

- Use movement keys to position the player.
- Face the object or item before interacting.
- Use spacebar to perform the highest-priority interaction available.
- If carrying anything, expect spacebar to attempt a drop first.
- If empty-handed, an eligible ground item takes priority over a dispenser.
- To submit a dish, carry the plated stack and drop it onto a submission tile.
- Avoid moving during manual processing if movement would interrupt the action.