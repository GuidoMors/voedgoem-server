import { BASIC_RESOURCES } from "./buildings";
import { oxyliumReady, oxyliumTiles } from "./ark";
import { hasCard } from "./cards";
import { activationError, endTurn, hasActionCard, setTapped, type Source } from "./play";
import { characterAbilitySource, hasChar } from "./neutrals";
import { nextInt } from "./rng";
import { isUnbuilt } from "./setup";
import type { Block, BlockKind, KinState } from "./types";
import { TILE_COUNT } from "./world";

// Archeology: the event that places ruins, Explore (Control) that turns ruins into a warp, treasure or relic block, and Reclaim
// (Expansion) that collects treasure and relic blocks from a tile building.

export const TREASURE_RESOURCES = 3;

export const blocksAt = (state: KinState, tile: number, kind?: BlockKind): Block[] =>
  (state.blocks ?? []).filter(block => block.tile === tile && (kind === undefined || block.kind === kind));

const removeBlocks = (state: KinState, tile: number, kind: BlockKind) => {
  state.blocks = (state.blocks ?? []).filter(block => !(block.tile === tile && block.kind === kind));
};

// A tile with ruins on it is not unbuilt.
export const isUnbuiltTile = (state: KinState, tile: number) => isUnbuilt(state, tile) && blocksAt(state, tile, "ruins").length === 0;

// --- Archeology event ---

export function ruinsSpots(state: KinState): number[] {
  const result: number[] = [];
  for (let tile = 0; tile < TILE_COUNT; tile++) {
    if (state.tiles[tile].terrain !== "ocean" && isUnbuiltTile(state, tile) && !state.armies.some(army => army.tile === tile)) result.push(tile);
  }
  return result;
}

export function placeRuins(state: KinState) {
  const spots = ruinsSpots(state);
  const tile = spots[nextInt(state.rng, spots.length)];
  (state.blocks ??= []).push({ tile, kind: "ruins" });
}

// --- Explore ---

export const exploreOptions = (state: KinState, player: string): string[] => [
  ...state.armies.filter(army => army.owner === player && army.tile >= 0 && blocksAt(state, army.tile, "ruins").length > 0).map(army => army.id),
  // Oxylium, Aero Magnetism: the Ark itself can Explore.
  ...(oxyliumReady(state, player) ? ["ark"] : [])
];

export const choosesRuins = (state: KinState, player: string) => !!state.tactics?.archeologists.includes(player) || hasCard(state, player, "quantum-collapse");

export function validateExplore(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "explore", "control");
  if (typeof source === "string") return source;
  if (choosesRuins(state, player) && !["warp", "treasure", "relic"].includes(String(action.choice))) return "Great Archeologist or Quantum Collapse: choose warp, treasure or relic.";
  if (action.army === "ark" && !oxyliumTiles(state, player).includes(Number(action.tile ?? oxyliumTiles(state, player)[0]))) return "Choose a ruins on a tile next to the Ark.";
  return exploreOptions(state, player).includes(String(action.army)) ? null : "Choose one of your armies on ruins.";
}

export function explore(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "explore", "control") as Source;
  // Oxylium: the Ark explores a ruins on an adjacent tile.
  const tile = action.army === "ark" ? Number(action.tile ?? oxyliumTiles(state, player)[0]) : state.armies.find(candidate => candidate.id === action.army)!.tile;
  // With the Great Archeologist played this round, or Quantum Collapse, you choose the outcome instead of rolling; the roll is then 0.
  const chosen = choosesRuins(state, player) ? action.choice as "warp" | "treasure" | "relic" : null;
  const roll = chosen ? 0 : nextInt(state.rng, 6) + 1;
  const result = chosen ?? (hasCard(state, player, "relic-seekers") ? "relic" : roll <= 2 ? "warp" : roll <= 4 ? "treasure" : "relic");
  removeBlocks(state, tile, "ruins");
  if (result === "warp") {
    state.players[player].resources.mana = (state.players[player].resources.mana ?? 0) + 2;
    // Mana Affluent (Children of the Great Tree): whenever someone explores a warp, its holders gain 1 mana.
    for (const holder of state.order) if (hasCard(state, holder, "mana-affluent")) state.players[holder].resources.mana = (state.players[holder].resources.mana ?? 0) + 1;
  }
  else if (action.army === "ark") reclaimAtOnce(state, player, result, action.basic);
  else (state.blocks ??= []).push({ tile, kind: result });
  state.play!.found = { id: (state.play!.found?.id ?? 0) + 1, player, tile, roll, result };
  setTapped(state, source, true);
  state.play!.passes = 0;
  endTurn(state);
}

// --- Reclaim ---

// Oxylium: a treasure or relic found by the Ark is reclaimed at once and for free. The treasure's 3 basic resources are the
// ones in `basic` when that is a valid choice of 3, otherwise gold.
function reclaimAtOnce(state: KinState, player: string, result: "treasure" | "relic", basic: unknown) {
  const resources = state.players[player].resources;
  if (result === "relic") return void (resources.relic = (resources.relic ?? 0) + 1);
  const chosen = Object.entries((basic ?? {}) as Record<string, number>);
  const valid = chosen.every(([resource, amount]) => BASIC_RESOURCES.includes(resource) && Number.isInteger(amount) && amount >= 0) && chosen.reduce((sum, [, amount]) => sum + amount, 0) === TREASURE_RESOURCES;
  for (const [resource, amount] of valid ? chosen : [["gold", TREASURE_RESOURCES] as [string, number]]) resources[resource] = (resources[resource] ?? 0) + amount;
}

export interface ReclaimOption {
  building: string;
  tile: number;
  treasure: number;
  relic: number;
}

// Tile buildings of the player with treasure or relic blocks on their tile. A Vault with an army of its owner on it can Reclaim
// the relic blocks of its tile even without a tile building.
export function reclaimOptions(state: KinState, player: string): ReclaimOption[] {
  const options = state.buildings
    .filter(building => building.kind === "tile" && building.owner === player && building.tile >= 0 && state.armies.some(army => army.owner === player && army.tile === building.tile))
    .map(building => ({ building: building.id, tile: building.tile, treasure: blocksAt(state, building.tile, "treasure").length, relic: blocksAt(state, building.tile, "relic").length }));
  const hasTileBuilding = (tile: number) => options.some(option => option.tile === tile);
  for (const vault of state.buildings.filter(building => building.def === "vault" && building.owner === player && building.tile >= 0)) {
    if (hasTileBuilding(vault.tile) || !state.armies.some(army => army.owner === player && army.tile === vault.tile)) continue;
    options.push({ building: vault.id, tile: vault.tile, treasure: 0, relic: blocksAt(state, vault.tile, "relic").length });
  }
  return options.filter(option => option.treasure + option.relic > 0);
}

export const canReclaim = (state: KinState, player: string) => hasActionCard(state, player, "reclaim") && reclaimOptions(state, player).length > 0;

// `basic` is the choice of basic resources for the treasure blocks: 3 for each.
function reclaimError(option: ReclaimOption | undefined, basic: unknown): string | null {
  if (!option) return "Choose one of your tile buildings with a treasure or relic block on its tile.";
  const chosen = Object.entries((basic ?? {}) as Record<string, number>);
  if (chosen.some(([resource, amount]) => !BASIC_RESOURCES.includes(resource) || !Number.isInteger(amount) || amount < 0)) return "Choose gold, lumber, stone and food.";
  const total = chosen.reduce((sum, [, amount]) => sum + amount, 0);
  return total === option.treasure * TREASURE_RESOURCES ? null : `Choose ${option.treasure * TREASURE_RESOURCES} basic resources for the treasure.`;
}

export function validateReclaim(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "reclaim", "expansion");
  if (typeof source === "string") return source;
  return reclaimError(reclaimOptions(state, player).find(option => option.building === action.building), action.basic);
}

export function reclaim(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "reclaim", "expansion") as Source;
  const option = reclaimOptions(state, player).find(candidate => candidate.building === action.building)!;
  const resources = state.players[player].resources;
  for (const [resource, amount] of Object.entries((action.basic ?? {}) as Record<string, number>)) resources[resource] = (resources[resource] ?? 0) + amount;
  resources.relic = (resources.relic ?? 0) + option.relic;
  if (option.treasure > 0) removeBlocks(state, option.tile, "treasure");
  removeBlocks(state, option.tile, "relic");
  // Njarny, Winterhoard: gain 1 mana when you Reclaim with him.
  if (characterAbilitySource(state, player, source, "njarny"))   resources.mana = (resources.mana ?? 0) + 1;
  setTapped(state, source, true);
  state.play!.passes = 0;
  endTurn(state);
}
