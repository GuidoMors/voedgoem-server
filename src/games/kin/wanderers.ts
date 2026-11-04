import { slotFree } from "./buildings";
import { activationError, endTurn, setTapped, type Source } from "./play";
import type { Building, KinState } from "./types";
import { neighbors, tileDistance } from "./world";

// Nomads (Wanderers): a Discovery action that moves a village, with the slice buildings inside it, to an adjacent snow tile.

export interface NomadOption {
  village: string;
  tiles: number[];
}

const villageTarget = (state: KinState, village: Building, tile: number) =>
  state.tiles[tile].terrain === "snow" && slotFree(state, tile)
  && !state.buildings.some(other => other.kind === "tile" && other.tile >= 0 && other.id !== village.id && tileDistance(other.tile, tile) < 3);

export function nomadOptions(state: KinState, player: string): NomadOption[] {
  return state.buildings
    .filter(building => building.def === "village" && building.owner === player && building.tile >= 0)
    .map(village => ({ village: village.id, tiles: neighbors(village.tile).filter(tile => villageTarget(state, village, tile)) }))
    .filter(option => option.tiles.length > 0);
}

export function validateNomads(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "nomads");
  if (typeof source === "string") return source;
  const option = nomadOptions(state, player).find(candidate => candidate.village === action.village);
  if (!option) return "Choose one of your villages next to a free snow tile.";
  return option.tiles.includes(action.tile as number) ? null : "Choose a free snow tile next to the village.";
}

export function nomads(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "nomads") as Source;
  const village = state.buildings.find(building => building.id === action.village)!;
  const tile = action.tile as number;
  const from = village.tile;
  for (const building of state.buildings) if (building.tile === from && (building.kind === "tile" || building.kind === "slice")) building.tile = tile;
  setTapped(state, source, true);
  state.play!.passes = 0;
  endTurn(state);
}
