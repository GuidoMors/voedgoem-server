# Cookaloor — Spacebar Interaction and Action Priority

## 1. What the Spacebar Does

The spacebar is the game's general-purpose interaction button.

It does not have one fixed action. The result depends on the player's hands and the objects in front of them at the moment the button is pressed.

The game checks possible actions in a fixed priority order. Once a higher-priority condition applies, lower-priority actions are not considered for that press.

## 2. Exact Priority Order

The order is:

1. Drop what the player is holding.
2. If the player's hands are empty, collect an eligible item on the ground in front of them.
3. If there is no eligible ground item, use a dispenser in front of them.
4. If there is no eligible ground item and the tile is not a dispenser, trigger the tile's other interaction behaviour.

This order is important. The game does not choose whichever action seems most useful. It follows this priority sequence.

## 3. Priority 1 — Drop the Carried Stack

If the player is holding at least one ingredient or any tool, pressing the spacebar attempts to place the carried stack in front of them.

This is always the first gameplay action considered.

It applies even if:

- There is another item on the floor in front of the player.
- The player is facing a dispenser.
- The player is facing a processing station.
- The player is facing a submission tile.

The player must first deal with what they are already carrying. The game does not let the player use the same press to collect another item or take something from a dispenser while their hands are occupied.

### Placing onto an Empty Space

If there is no existing item stack in the target area and placement is allowed, the carried stack is placed on the ground in front of the player.

The precise placement is adjusted to the kitchen layout. Blocking or non-floor spaces receive special placement handling, so an item is not simply placed through an obstruction.

### Placing onto an Existing Stack

If an item stack is already in the target area, the game attempts to combine the carried stack with it rather than creating a separate stack in the same place.

If the player is adding ingredients to an existing stack, that stack's current processing progress is reset before the combination.

The combination rules determine the resulting ingredients and tool.

### What Happens After a Drop

Placing an item can trigger the behaviour of the tile underneath or in front of the placement location.

For example, a compatible item may begin processing, be transformed, or be submitted.

A deletion tile removes the relevant item rather than carrying out the normal tile-use behaviour.

### Special Case: Tool Dispensers

A tile that is a tool dispenser does not accept an ordinary drop in the same way as a normal tile.

If the player is holding something and faces a tool dispenser, the game still chooses the drop priority first.

However, the placement is rejected for that dispenser tile. The game does not switch to taking another item from the dispenser during that same press.

### Special Case: Deletion Tiles

When the target is a deletion tile, the normal tile-use step is skipped.

The held tool can be retained in the player's hands under the game's deletion-tile handling rules.

## 4. Priority 2 — Pick Up a Ground Item

This priority is considered only when the player's hands are empty.

The game looks for an item stack that is:

- In front of the player.
- Within the allowed pickup distance.
- On the side of the player that they are facing.

If more than one stack qualifies, the closest eligible stack is selected.

The game does not simply collect the nearest item anywhere around the player. The item's position relative to the player's facing direction matters.

When a stack is collected:

- It is removed from the ground.
- Its contents are transferred into the player's hands.
- Any applicable processing progress is transferred or reset according to the state of the player's hands.
- Processing associated with the item's previous location is stopped.

If a qualifying ground item is found, the game collects it and does not check the dispenser or other tile behaviour during that press.

## 5. Priority 3 — Use a Dispenser

The dispenser check is reached only when:

- The player's hands are empty.
- There is no eligible ground item to collect in front of them.
- The tile in front is a dispenser.

The dispenser must exist at that location and have at least one remaining charge.

If it can be used, it gives the item configured for that dispenser:

- If the configured item is an ingredient, the ingredient is placed in the player's hands.
- Otherwise, if it is a recognised tool, that tool is placed in the player's hands.

One charge is consumed when an item is successfully dispensed.

If the dispenser has no charges, the player receives nothing. The game does not continue to the ordinary tile interaction as a fallback.

## 6. Priority 4 — Other Tile Interaction

This is the final priority.

It is considered when the player is empty-handed, there is no eligible ground item to collect, and the tile in front is not a dispenser.

The game then triggers the tile's other interaction behaviour.

The result depends on the tile and its configured purpose. This is the route used for tile-specific interactions that are not ordinary item pickup or dispenser use.

## 7. Decision Table

| Player's hands | What is in front | Result |
|---|---|---|
| Holding ingredients | Any target | Attempt to drop the carried stack |
| Holding a tool only | Any target | Attempt to drop the carried tool |
| Empty | Eligible ground item | Pick up the ground item |
| Empty | No eligible ground item; charged dispenser | Take the dispenser's item |
| Empty | No eligible ground item; empty dispenser | Receive nothing; no ordinary tile fallback |
| Empty | No eligible ground item; non-dispenser tile | Trigger the tile's other interaction |
| Empty | Several eligible ground items | Pick up the closest qualifying item |

## 8. Examples Demonstrating the Priority Order

### Example A — Holding an Ingredient While Facing a Counter

The player presses space.

The game sees that the player is holding an ingredient, so it attempts to drop the carried stack.

If the counter accepts the item, its tile behaviour may then process it.

The game does not attempt to pick up another item first.

### Example B — Empty Hands With an Item on the Floor

The player faces a ground stack that is close enough and within the forward pickup area.

The player presses space and collects that stack.

The dispenser is not checked during the same press.

### Example C — Empty Hands Facing a Dispenser

There is no eligible ground stack in front of the player.

The player presses space. If the dispenser has a remaining charge, it gives the configured item.

### Example D — Holding a Plate While Facing a Dispenser

The player presses space.

Because the player is holding a plate, the drop priority applies first.

The player does not receive another dispenser item.

If the tile is a tool dispenser that rejects drops, the drop is not carried out and the game still does not switch to dispensing.

### Example E — Empty Hands Facing a Submission Tile With a Plate on the Floor

If the plate stack is eligible for pickup, the player picks it up.

The game does not submit it simply because the player is facing the submission tile.

The player must then press space again while holding the plated stack, causing the drop attempt onto the submission tile.

### Example F — Holding a Plated Dish and Facing a Submission Tile

The player presses space.

The game attempts to drop the dish.

If the submission tile accepts the placement and the dish meets the submission requirements, the game checks it against the team's recipes.

The spacebar itself does not guarantee a successful submission. The contents and order must match a recipe.

## 9. Recipe Submission and the Spacebar

Recipe submission is part of the drop-and-tile interaction.

For a submission to be checked:

- The player must be carrying a stack with a plate.
- The player must drop it onto a submission tile.
- The submitted ingredients must match a recipe belonging to the player's team.
- The number of ingredients and their order must match exactly.

A correct submission earns the configured points and completes the recipe.

An incorrect submission causes the configured penalty.

A dirty plate is produced after either result.

## 10. Direction and Target Selection

The spacebar uses the player's current facing direction.

It does not make the player face a new direction by itself.

The game determines the tile in front from the player's position and facing direction.

It also checks ground items using both distance and whether they are in the player's forward area.

An item may be visible but still not be eligible for pickup if it is too far away or not in the area the player is facing.

## 11. Repeated Presses

The game limits how quickly ordinary interaction requests can be sent.

There is a short delay of approximately one tenth of a second between accepted requests from the normal controls.

This is an input-rate limit, not a queue of actions.

Pressing repeatedly does not guarantee that every press will be stored and performed later.

## 12. Essential Rule

The spacebar always follows this decision order:

**DROP → PICK UP → DISPENSE → OTHER TILE INTERACTION**

The player's hands are the deciding factor at the first step.

If the player is holding an ingredient or a tool, the game prioritises dropping it over every other possible interaction.