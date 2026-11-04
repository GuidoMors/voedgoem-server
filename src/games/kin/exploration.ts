import { ruinsSpots } from "./archeology";
import { addItem } from "./cards";
import { cardById } from "./cards.data";
import { naturalOrder } from "./draft";
import { beginChapterPlay } from "./play";
import { makePublic } from "./tech";
import type { KinState } from "./types";

export function startExploration(state: KinState) {
  const science = state.items.find(item => item.def === "archeology-science") ?? addItem(state, "archeology-science", "board:research");
  makePublic(state, science);
  for (const grant of cardById(science.def)!.grants ?? []) {
    if (!state.items.some(item => item.def === grant && item.zone === "board:phase")) addItem(state, grant, "board:phase");
  }
  const target = Math.min(9, ruinsSpots(state).length);
  state.exploration = { placed: 0, target, placing: target > 0 };
}

export function explorationPlacer(state: KinState): string | null {
  return state.exploration?.placing ? naturalOrder(state)[state.exploration.placed % state.order.length] : null;
}

export function validateExplorationRuins(state: KinState, player: string, action: Record<string, unknown>): string | null {
  if (state.phase !== "playing" || !state.play || !state.exploration?.placing) return "No Exploration ruins are waiting to be placed.";
  if (explorationPlacer(state) !== player) return "It is not your turn to place Exploration ruins.";
  return typeof action.tile === "number" && Number.isInteger(action.tile) && ruinsSpots(state).includes(action.tile)
    ? null : "Choose an unbuilt non-ocean tile without an army or ruins.";
}

export function placeExplorationRuins(state: KinState, action: Record<string, unknown>) {
  (state.blocks ??= []).push({ tile: action.tile as number, kind: "ruins" });
  const exploration = state.exploration!;
  exploration.placed += 1;
  exploration.placing = exploration.placed < exploration.target;
  if (exploration.placing) state.play!.turn = explorationPlacer(state)!;
  else beginChapterPlay(state);
}

export function cleanupExploration(state: KinState) {
  if (!state.exploration) return;
  for (const player of Object.values(state.players)) {
    player.resources.relic = 0;
    player.relicsTapped = 0;
  }
  delete state.exploration;
}
