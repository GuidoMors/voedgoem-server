import { breweries } from "./buildings";
import { adjacent, hasActionCard } from "./play";
import { maxArmyStrength } from "./cards";
import { hasChar } from "./neutrals";
import { claimTactic, tacticsDeckSize } from "./tactics";
import type { KinState } from "./types";

// Hammers of the Ash: helpers for Craftdwarves, the Brewery and the characters Khaz, Daxgrim, Uhzrun, Jaggengrog and Gottrek.

export const CRAFT_COST = 5;

const gold = (state: KinState, player: string) => state.players[player].resources.gold ?? 0;

// Craftdwarves: why it cannot be used (apart from the card that is tapped), or null.
export function craftError(state: KinState, player: string): string | null {
  if (gold(state, player) < CRAFT_COST) return `You need ${CRAFT_COST} gold.`;
  return tacticsDeckSize(state) === 0 ? "The tactics deck is empty." : null;
}

export const canCraft = (state: KinState, player: string) => hasActionCard(state, player, "craftdwarves") && craftError(state, player) === null;

export function craft(state: KinState, player: string): string | null {
  state.players[player].resources.gold = gold(state, player) - CRAFT_COST;
  return claimTactic(state, player);
}

// Daxgrim, Arkenax: an army of another player next to an army of yours that has room to grow, and the armies of yours it could go to.
export function transferOptions(state: KinState, player: string): { from: string; to: string[] }[] {
  const max = maxArmyStrength(state, player);
  const mine = state.armies.filter(army => army.owner === player && army.tile >= 0 && army.strength < max);
  return state.armies
    .filter(army => army.owner !== player && army.tile >= 0)
    .map(army => ({ from: army.id, to: mine.filter(own => adjacent(state, player, own.tile).includes(army.tile)).map(own => own.id) }))
    .filter(option => option.to.length > 0);
}

// Uhzrun, Gold Refiner: how much stone may be turned into gold.
export const refineMax = (state: KinState, player: string) => Math.min(breweries(state, player), state.players[player].resources.stone ?? 0);

// Seasons Change, once it resolved fully: Khaz has power 4 with 3 breweries (otherwise his own power); Gottrek has the number of breweries, up to 5.
export function hammersSeasons(state: KinState) {
  const power = (state.charPower ??= {});
  for (const player of state.order) {
    const count = breweries(state, player);
    if (hasChar(state, player, "ostraria")) power.ostraria = Math.min(5, state.items.filter(item => item.def === "access-treaty" && item.zone === "court:" + player).length);
    if (hasChar(state, player, "trotskyr")) power.trotskyr = Math.min(5, state.buildings.filter(building => building.owner === player && building.def === "fort").length);
    if (hasChar(state, player, "khaz")) {
      if (count >= 3) power.khaz = 4;
      else delete power.khaz;
    }
    if (hasChar(state, player, "gottrek")) power.gottrek = Math.min(5, count);
  }
}
