import type { KinState } from "./types";

// Influence (called authority in some rule texts) is a resource only the Hanshu use. It cannot be bartered.

export const influence = (state: KinState, player: string): number => state.players[player]?.resources.influence ?? 0;

export function gainInfluence(state: KinState, player: string, count = 1) {
  state.players[player].resources.influence = influence(state, player) + count;
}

export function spendInfluence(state: KinState, player: string, count = 1) {
  state.players[player].resources.influence = influence(state, player) - count;
}
