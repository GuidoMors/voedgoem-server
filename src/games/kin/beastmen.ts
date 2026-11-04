import { maxArmyStrength } from "./cards";
import { wallBlocks } from "./buildings";
import { adjacent } from "./play";
import type { KinState } from "./types";

// Beastmen Tribes: helpers for Horned Hoof, Grog, Dinker and the battle effects.

// Horned Hoof, Trampler: armies of strength 1 of other players next to one of your armies.
export function trampleTargets(state: KinState, player: string): string[] {
  const mine = state.armies.filter(army => army.owner === player && army.tile >= 0);
  return state.armies
    .filter(army => army.owner !== player && army.tile >= 0 && army.strength === 1 && mine.some(own => adjacent(state, player, own.tile).includes(army.tile)))
    .map(army => army.id);
}

// Dinker, Out Thinkin': pay the key to gain the value.
export const DINKER_TRADES: Record<string, string> = { food: "stone", stone: "gold", gold: "food" };
export const dinkerOptions = (state: KinState, player: string): string[] =>
  Object.keys(DINKER_TRADES).filter(resource => (state.players[player].resources[resource] ?? 0) >= 1);

// Grog, Of Three Minds: the choices for each roll of the d3, picked before the roll.
export interface GrogOptions {
  grow: string[];
  march: { army: string; tiles: number[] }[];
  untap: string[];
}

export function grogOptions(state: KinState, player: string): GrogOptions {
  const max = maxArmyStrength(state, player);
  const mine = state.armies.filter(army => army.owner === player && army.tile >= 0);
  const free = (from: number, tile: number) =>
    state.tiles[tile].terrain === "desert" && !state.armies.some(army => army.tile === tile) && !wallBlocks(state, player, from, tile);
  return {
    grow: mine.filter(army => army.strength < max).map(army => army.id),
    march: mine.map(army => ({ army: army.id, tiles: adjacent(state, player, army.tile).filter(tile => free(army.tile, tile)) })).filter(option => option.tiles.length > 0),
    untap: Object.values(state.cards).filter(card => card.owner === player && card.tapped && !card.hostageOf && card.id !== "grog-og-n-zog").map(card => card.id)
  };
}
