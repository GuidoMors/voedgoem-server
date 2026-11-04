import { arkBoardOf, arkOf, wallBlocks } from "./buildings";
import { hasCard } from "./cards";
import { cardById } from "./cards.data";
import { isUnbuiltTile } from "./archeology";
import { activationError, adjacent, endTurn, setTapped, type Source } from "./play";
import { neighbors } from "./world";
import { announce, counterfuge } from "./tactics";
import { hasChar } from "./neutrals";
import { pleaRespond } from "./streams";
import type { KinState } from "./types";

// Archive Ark: Drifting Citadel, Calculators, Mass Harvest, and the helpers of its characters.

const gear = (state: KinState, player: string, count: number) => {
  state.players[player].resources.gear = (state.players[player].resources.gear ?? 0) + count;
};

const technologies = (state: KinState, player: string) => state.items.filter(item => item.zone === `court:${player}` && cardById(item.def)?.kind === "technology").length;

// --- Drifting Citadel ---

// Unbuilt tiles next to the Ark, of any tile type, that no other player has an army on.
export function driftTiles(state: KinState, player: string): number[] {
  const ark = arkOf(state, player);
  if (!ark) return [];
  return neighbors(ark.tile).filter(tile => isUnbuiltTile(state, tile) && !wallBlocks(state, player, ark.tile, tile));
}

export function validateDrift(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "drifting-citadel");
  if (typeof source === "string") return source;
  return driftTiles(state, player).includes(action.tile as number) ? null : "Choose an unbuilt tile next to the Ark.";
}

export function drift(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "drifting-citadel") as Source;
  arkOf(state, player)!.tile = action.tile as number;
  setTapped(state, source, true);
  state.play!.passes = 0;
  endTurn(state);
}

// --- Calculators ---

const isActionCard = (def: string) => {
  const card = cardById(def);
  return card?.kind === "action" || (card?.kind === "faction" && card.form === "action");
};

export const isArkPlayer = (state: KinState, player: string) => hasCard(state, player, "the-eternal-ark");

const courtOf = (state: KinState, player: string) => Object.values(state.cards).filter(card => card.owner === player && !card.hostageOf).map(card => card.id);

export interface CalculatorOptions {
  players: { player: string; characters: string[] }[];
  actions: string[];
}

export function calculatorOptions(state: KinState, player: string): CalculatorOptions {
  return {
    players: state.order.filter(other => other !== player).map(other => ({ player: other, characters: courtOf(state, other) })).filter(entry => entry.characters.length > 0),
    actions: [...new Set(state.items.filter(item => isActionCard(item.def)).map(item => item.def))]
  };
}

export function calculatorError(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const options = calculatorOptions(state, player);
  const target = options.players.find(entry => entry.player === action.target);
  if (!target) return "Calculators: choose another player with a character in their court.";
  if (!options.actions.includes(String(action.action))) return "Calculators: choose an action card.";
  return target.characters.includes(String(action.character)) ? null : "Calculators: choose a character in that player's court.";
}

export function predict(state: KinState, player: string, action: Record<string, unknown>) {
  (state.predictions ??= []).push({ player, target: String(action.target), action: String(action.action), character: String(action.character), round: state.round });
}

// The action card an action of the engine uses.
const cardOfAction = (type: string) => type === "activateMove" ? "move" : type === "driftingCitadel" ? "drifting-citadel" : type;

// Called when an action is about to be applied: a character that is tapped for the predicted action card fulfils the prediction.
export function resolvePredictions(state: KinState, action: Record<string, unknown> & { type: string; actor: { id: string } }) {
  if (!state.predictions?.length || action.kind !== "character") return;
  const found = state.predictions.find(entry => entry.round === state.round && entry.target === action.actor.id && entry.action === cardOfAction(action.type) && entry.character === action.card);
  if (!found) return;
  state.predictions = state.predictions.filter(entry => entry !== found);
  const reward = technologies(state, found.player);
  gear(state, found.player, reward);
  announce(state, `${state.players[found.player].username}'s Calculators predicted ${state.players[found.target].username}'s ${cardById(found.action)?.name ?? found.action} with ${found.character}: +${reward} gear.`);
}

// --- Mass Harvest ---

// What Mass Harvest gives: one basic resource of the terrain under the Ark for each worksite on the ark board.
export function massHarvestYield(state: KinState, player: string): { resource: string; count: number } | null {
  const ark = arkOf(state, player);
  if (!ark || !hasCard(state, player, "the-eternal-ark")) return null;
  const terrain = state.tiles[ark.tile]?.terrain;
  const resource = terrain === "farmland" ? "food" : terrain === "forest" ? "lumber" : terrain === "mountain" ? "stone" : terrain === "plains" && hasChar(state, player, "agri-1f") ? "food" : null;
  const count = arkBoardOf(state, ark).filter(building => building.def === "worksite").length;
  return resource && count > 0 ? { resource, count } : null;
}

export function massHarvest(state: KinState, player: string) {
  const result = massHarvestYield(state, player)!;
  state.players[player].resources[result.resource] = (state.players[player].resources[result.resource] ?? 0) + result.count;
}

// --- Characters ---

// Coppygen: tile buildings of other players next to the Ark.
export function researchTargets(state: KinState, player: string): string[] {
  const ark = arkOf(state, player);
  if (!ark) return [];
  const near = adjacent(state, player, ark.tile);
  return state.buildings.filter(building => building.kind === "tile" && building.owner && building.owner !== player && near.includes(building.tile)).map(building => building.id);
}

// Aurosphoros: armies of other players next to the Ark.
export function barrageTargets(state: KinState, player: string): string[] {
  const ark = arkOf(state, player);
  if (!ark) return [];
  const near = adjacent(state, player, ark.tile);
  return state.armies.filter(army => army.owner !== player && army.tile >= 0 && near.includes(army.tile)).map(army => army.id);
}

// Nitrosium: tile and center buildings of other players next to an army of yours.
export function sabotageTargets(state: KinState, player: string): string[] {
  const near = new Set(state.armies.filter(army => army.owner === player && army.tile >= 0).flatMap(army => adjacent(state, player, army.tile)));
  return state.buildings
    .filter(building => (building.kind === "tile" || building.kind === "center") && building.owner && building.owner !== player && near.has(building.tile) && !state.sabotaged?.includes(building.id))
    .map(building => building.id);
}

// Oxylium: the Ark can Explore a ruins on an adjacent tile.
export function oxyliumTiles(state: KinState, player: string): number[] {
  const ark = arkOf(state, player);
  if (!ark || ark.tile < 0 || !hasChar(state, player, "oxylium")) return [];
  const near = adjacent(state, player, ark.tile);
  return [...new Set((state.blocks ?? []).filter(block => block.kind === "ruins" && near.includes(block.tile)).map(block => block.tile))];
}
export const oxyliumReady = (state: KinState, player: string) => oxyliumTiles(state, player).length > 0;

// --- Consent (Coppygen) ---

export function validateConsent(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const consent = state.play?.consent;
  if (!consent) return "Nobody is waiting for your answer.";
  if (consent.owner !== player) return "That question is not for you.";
  return typeof action.accept === "boolean" ? null : "Agree or decline.";
}

export function consentRespond(state: KinState, accept: boolean) {
  const play = state.play!;
  const consent = play.consent!;
  if (consent.plea) return pleaRespond(state, accept);
  if (consent.counterfuge) return counterfuge(state, accept);
  if (accept) {
    gear(state, consent.player, 1);
    gear(state, consent.owner, 1);
  }
  play.consent = null;
  play.passes = 0;
  endTurn(state);
}
