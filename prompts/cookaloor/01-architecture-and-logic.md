# Cookaloor — Game Rules and Overall Behaviour

## 1. Overview

Cookaloor is a cooperative kitchen game in which players move around a kitchen, collect ingredients and tools, prepare food, and submit completed dishes to fulfil recipes.

The game is played on a grid-based kitchen layout. Players move around the kitchen and interact with the objects and items around them.
The grids for the kitchens are found in kitchens.json. Ignore the template kitchen, it should not be a playable kitchen. What each tile means is found in KitchenHashes.js. Kitchens with 111 doors and 222 doors are kitchens for the versus game mode. Kitchen without 111 and 222 doors are kitchens for the cooperative game mode.

The result of an interaction depends on the player's current situation, what they are holding, what is directly in front of them, and whether the relevant object can be used. For how specific interactions work check spacebar priority and controld and interaction markdowns.

The goal is to collect ingredients from dispensers, interact with them by cooking them or chopping them, to make dishes. Dishes are submitted to the submit counter for points. Only dishes that are requested can be submitted, wrong dishes lead to minus points.
To find all the recipes check the recipes.json. Each recipe also has a difficulty. At the beginning of the game only recipes of difficulty one are chosen, but as the game lasts longer, more and more difficult recipes are picked when selecting recipes.

If the context of a specific game element is not clear, check the game files folder to find out.

If you need a graphic for something, look in the images folder for the graphic.

To make the kitchens, check the kitchens.json file in the resource folder. Playable Kitchens should be selectable in the main menu. Some kitchens are only playable in cooperative, others only playable in versus game mode.

When using models for the players of the game, use the avatars that players have generated.

## 2. Players and Teams

Players have individual positions and facing directions. The starting positions of players are found in kitchens.json.

The game has 2 modes. Cooperative, and versus. In cooperative all players belong to the same team. In versus, players belong to different teams.

Recipes and team progress are associated with the relevant team.

## 3. Movement and Facing

Players can move in four main directions:

- Up
- Down
- Left
- Right

A player's facing direction determines which nearby tile or item is considered to be in front of them when they interact.

Moving and interacting are separate actions. Pressing the interaction button does not itself mean that the player moves.

When the interaction button is used without specifying a new direction, the game uses the player's existing facing direction.

## 4. Items and Hands

Players can carry ingredients and tools.

An item stack can contain one or more ingredients and may also contain a tool.

A player counts as holding something if they have at least one ingredient or if they are carrying a tool. Carrying a tool by itself is enough to count as having something in hand.

Items can be on the floor or in a player's hands.

When a player interacts with a nearby item while their hands are empty, the item can be collected.

When a player interacts while carrying something, the carried stack is handled first.

The items and tools that exist are found in ingredients.json and tools.json

## 5. Combining Items

When a player places their carried stack where another stack already exists, the game attempts to combine the two stacks.

The resulting stack depends on the ingredients and tools involved and on the available combination rules.

When ingredients are added to an existing ground stack, any processing progress associated with that ground stack is reset before the combination is completed.

## 6. Kitchen Tiles

Kitchen tiles can have different purposes.

Depending on the tile, interacting with it may:

- Dispenser: Provide an ingredient or tool.
- Processor: Process or transform an item.
- Submit counter: Accept a completed dish for submission.
- Trash: Delete an item.
- Trigger another tile-specific behaviour.

For what tiles do, check the tiles.json.
An item can only be used by a tile when it meets that tile's compatibility requirements.

## 7. Dispensers

A dispenser can provide a configured ingredient or tool.

A player can receive an item from a dispenser only when:

- Their hands are empty.
- There is no eligible ground item to collect in front of them.
- The tile in front of them is a dispenser.
- The dispenser has at least one remaining use.

Each successful use consumes one available charge. Unless specifically stated otherwise, dispensers have infinite charges.

The dispenser provides the item assigned to it. A tomato dispenser puts the tomato item into the hands of the player interacting with it. The game first treats the configured item as an ingredient if it is a recognised ingredient; otherwise, it treats it as a tool.

A dispenser with no remaining charges does not provide an item.

## 8. Processing Items

Some kitchen tiles process items over time. The item may need to remain in the appropriate place while the processing takes place.

Processing progress is associated with the item being processed.

Picking up an item can stop its current processing. Moving during manual processing can also interrupt that processing.

When ingredients are added to an existing ground stack, the existing processing progress is reset.

Some tile actions happen immediately, while others require a processing period.

Processing is detailed in the transitions.json

## 9. Recipes and Submissions

Recipes specify which ingredients are required.

To submit a dish, the player must place a stack containing a plate onto a submission tile.

The game checks the submitted ingredients against the recipes belonging to the player's team.

A recipe is accepted only when the submitted ingredient list contains exactly the required ingredients, in exactly the required order.

Having the correct ingredients in a different order is not sufficient.

### Successful Submission

When a submission matches a recipe:

- The recipe is completed and removed.
- The team receives points.
- The score bonus depends on the remaining time for the recipe.
- The team's completed-recipe count increases.
- A replacement recipe is created for a team with the fewest active recipes, normally avoiding the team that just completed one when another team can receive it.

### Failed Submission

When a submission does not match a recipe:

- The configured penalty is applied.
- The team's failed-submission count increases.

A dirty plate is produced after either a successful or unsuccessful submission.

## 10. Game Time and Ending Conditions for cooperative

The game tracks time as part of its game state.

Each recipe has a duration. If within the duration it is not submitted, the team gets minus points.

Scores, completed recipes, failures and other configured conditions contribute to the final outcome.

The game can be paused by the host. Ordinary players cannot pause the game through the host-only pause control.


## 11. Game Time and Ending Conditions for versue game mode.

Each team has lives. When a team has a recipe time out, they lose a live, and the other team gets a new recipe. When a team completes a recipe at the submit counter, the other team gets a new recipe. The first team to lose all lives loses the game, and the other team is the winner.

A team starts with 3 lives.

## 12. Important Interaction Principles

- The player's hands determine the first interaction priority.
- A carried tool counts as an item being held, even when no ingredients are carried.
- A reachable ground item is considered before a dispenser.
- A dispenser is considered before other tile-specific interactions.
- A player interacts with the tile and items in front of their current facing direction.
- Placing an item on a tile can trigger that tile's behaviour immediately or begin processing.
- Submitting a recipe is a consequence of placing a plated stack on a submission tile; it is not a separate type of interaction.