import { isUnbuiltTile } from "./archeology";
import { maxArmyStrength } from "./cards";
import { adjacent } from "./play";
import type { KinState } from "./types";

// Children of the Great Tree: helpers for the Great Tree, Seedling Villages and the tree characters.

export const GREAT_TREE = "the-great-tree";
export const LEAVAVEL_CONVERT = ["gold", "stone", "food"];

const armyOn = (state: KinState, tile: number) => state.armies.some(army => army.tile === tile);

// Seedling Villages: a village on a forest attached to one of your Great Trees costs nothing. A village needs a distance of 3 from
// every tile building, so "attached" means connected to the Great Tree by a chain of roads that reaches the village's tile.
export function seedlingFree(state: KinState, player: string, tile: number): boolean {
  if (state.tiles[tile]?.terrain !== "forest") return false;
  const linked = new Set(state.buildings.filter(building => building.def === GREAT_TREE && building.owner === player && building.tile >= 0).map(building => building.tile));
  const roads = state.buildings.filter(building => building.def === "road" && building.tile >= 0 && building.to !== undefined);
  for (let changed = true; changed;) {
    changed = false;
    for (const road of roads) {
      const ends = [road.tile, road.to!];
      if (!ends.some(end => linked.has(end)) || ends.every(end => linked.has(end))) continue;
      for (const end of ends) linked.add(end);
      changed = true;
    }
  }
  return linked.has(tile);
}

// Maprassil, Rejuvenation: armies standing on a forest that have room for more strength.
export const rejuvenationTargets = (state: KinState): string[] =>
  state.armies.filter(army => army.tile >= 0 && state.tiles[army.tile].terrain === "forest" && army.strength < maxArmyStrength(state, army.owner)).map(army => army.id);

// Yewanna, Moving Forest: every unbuilt armiless forest with the unbuilt armiless non-ocean tiles next to it that it could swap with.
export function movingForest(state: KinState, player: string): { forest: number; tiles: number[] }[] {
  const free = (tile: number) => state.tiles[tile].terrain !== "ocean" && isUnbuiltTile(state, tile) && !armyOn(state, tile);
  const result: { forest: number; tiles: number[] }[] = [];
  state.tiles.forEach((tile, index) => {
    if (tile.terrain !== "forest" || !free(index)) return;
    const tiles = [...new Set(adjacent(state, player, index))].filter(other => free(other) && state.tiles[other].terrain !== "forest");
    if (tiles.length > 0) result.push({ forest: index, tiles });
  });
  return result;
}

export function swapTiles(state: KinState, a: number, b: number) {
  const terrain = state.tiles[a].terrain;
  state.tiles[a].terrain = state.tiles[b].terrain;
  state.tiles[b].terrain = terrain;
}
