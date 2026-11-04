import { addItem, claimCard } from "./cards";
import { payment } from "./expansion";
import { naturalOrder } from "./draft";
import { discardEnacted, lawBoard } from "./laws";
import { activationError, endTurn, hasActionCard, setTapped, type Source } from "./play";
import { shuffle } from "./rng";
import { makePublic } from "./tech";
import { removeItem } from "./treaties";
import type { KinState } from "./types";

export function startKingdom(state: KinState, king: string) {
  const diplomacy = state.items.find(item => item.def === "vassal-diplomacy") ?? addItem(state, "vassal-diplomacy", "board:research");
  makePublic(state, diplomacy);
  state.items = state.items.filter(item => item.def !== "vassal-ban" && item.def !== "vassal-treaty");
  for (const player of state.order) if (player !== king) addItem(state, "vassal-treaty", `court:${king}`, king, player);
  discardEnacted(state);
  const board = lawBoard(state);
  board.deck = shuffle(state.rng, [...board.deck, ...board.discard]);
  board.discard = [];
  state.kingdom = { king, rebel: [], kingdom: [] };
  for (const def of ["rebel", "taxation"]) addItem(state, def, "board:phase");
  for (const def of ["righteous-ruler", "iron-grip"]) claimCard(state, king, def);
}

export function cleanupKingdom(state: KinState) {
  const kingdom = state.kingdom;
  if (!kingdom) return;
  const board = lawBoard(state);
  board.deck = shuffle(state.rng, [...board.deck, ...board.discard, ...kingdom.rebel, ...kingdom.kingdom]);
  board.discard = [];
  board.enacted = null;
  state.items = state.items.filter(item => !["rebel", "taxation", "righteous-ruler", "iron-grip"].includes(item.def));
  delete state.kingdom;
}

export const personalStrength = (state: KinState, player: string) =>
  state.armies.filter(army => army.owner === player && army.tile >= 0).reduce((sum, army) => sum + army.strength, 0);

export const canRebel = (state: KinState, player: string) => !!state.kingdom &&
  hasActionCard(state, player, "rebel") &&
  state.items.some(item => item.def === "vassal-treaty" && item.giver === player && item.zone === `court:${state.kingdom!.king}`) &&
  personalStrength(state, player) > personalStrength(state, state.kingdom.king);

export function validateRebel(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "rebel", "control");
  if (typeof source === "string") return source;
  return canRebel(state, player) ? null : "The King must hold your Vassal Treaty, and your deployed army strength must exceed the King's personal strength.";
}

export function rebel(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "rebel", "control") as Source;
  setTapped(state, source, true);
  removeItem(state, state.items.find(item => item.def === "vassal-treaty" && item.giver === player && item.zone === `court:${state.kingdom!.king}`)!);
  state.play!.passes = 0;
  endTurn(state);
}

export function ironGripOptions(state: KinState, player: string) {
  if (!state.kingdom || state.kingdom.king !== player || !hasActionCard(state, player, "iron-grip")) return undefined;
  return { laws: [...lawBoard(state).discard], power: state.kingdom.rebel.length };
}

export function validateIronGrip(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "iron-grip", "control");
  if (typeof source === "string") return source;
  const options = ironGripOptions(state, player);
  if (!options) return "Only the King can use Iron Grip.";
  if (!options.laws.includes(String(action.law))) return "Choose a law from the law discard pile.";
  if (action.track !== "rebel" && action.track !== "kingdom") return "Choose the rebel or kingdom track.";
  const paid = payment(state, player, source, action, options.power, "control");
  return typeof paid === "string" ? paid : null;
}

export function ironGrip(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "iron-grip", "control") as Source;
  const cards = payment(state, player, source, action, state.kingdom!.rebel.length, "control");
  if (typeof cards === "string") throw new Error(cards);
  for (const card of cards) setTapped(state, card, true);
  const board = lawBoard(state);
  board.discard.splice(board.discard.indexOf(String(action.law)), 1);
  state.kingdom![action.track as "rebel" | "kingdom"].push(String(action.law));
  state.play!.passes = 0;
  endTurn(state);
}

export function taxation(state: KinState) {
  const king = state.kingdom!.king;
  for (const player of naturalOrder(state)) {
    if (player === king || (state.players[player].resources.gold ?? 0) < 1) continue;
    state.players[player].resources.gold -= 1;
    state.players[king].resources.gold = (state.players[king].resources.gold ?? 0) + 1;
  }
}
