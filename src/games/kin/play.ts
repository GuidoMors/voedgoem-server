import { hasCard } from "./cards";
import { produce, roadBetween, sideBetween, wallBlocks } from "./buildings";
import { canExpand } from "./expansion";
import { forbiddenBy } from "./laws";
import { canControl } from "./control";
import { checkVictory } from "./victory";
import { cardById } from "./cards.data";
import { characterById, naturalOrder } from "./draft";
import { holdsTreaty, seasonsChangeTreaties } from "./treaties";
import type { Army, KinState, MoveState, PlayPhase, ReactionState, SourceKind } from "./types";
import { discardTactic, hasPlayableTactic } from "./tactics";
import { characterPower, hasAbilityFor, hasChar } from "./neutrals";
import { influence, spendInfluence } from "./hanshu";
import { hammersSeasons } from "./hammers";
import { deepSeasons, thrallInMove } from "./deepones";
import { ROWS, neighbors, sideEdge, tileCol, tileDistance, tileIndex, tileRow } from "./world";

export const PLAY_PHASES: readonly PlayPhase[] = ["event", "discovery", "expansion", "control"];

// A card that can be tapped for an action of the current phase: an untapped character or activation card of a matching archetype.
export interface Source {
  kind: SourceKind;
  id: string;
  name: string;
  power: number;
}

export function sourcesFor(state: KinState, player: string, phase: PlayPhase): Source[] {
  if (phase === "event") return [];
  const result: Source[] = [];
  // The Graphiscope acts as a universal activation card of power 2 and is discarded when used.
  if (state.tactics?.hands[player]?.includes("graphiscope")) result.push({ kind: "tactic", id: "graphiscope", name: "Graphiscope", power: 2 });
  for (const card of Object.values(state.cards)) {
    const def = characterById(card.def);
    if (card.owner !== player || card.tapped || card.hostageOf || !def) continue;
    const power = card.id === "horus" ? def.power : characterPower(state, card.owner, card.id, def.power);
    if (def.archetypes.includes(phase) || def.archetypes.includes("universal")) result.push({ kind: "character", id: card.id, name: def.name, power });
  }
  for (const item of state.items) {
    const def = cardById(item.def);
    if (item.zone !== `court:${player}` || item.tapped || def?.kind !== "activation") continue;
    if (def.archetype === phase || def.archetype === "universal") result.push({ kind: "item", id: item.id, name: def.name, power: def.power ?? 1 });
  }
  return result;
}

export function findSource(state: KinState, player: string, phase: PlayPhase, kind: string, id: string): Source | undefined {
  return sourcesFor(state, player, phase).find(source => source.kind === kind && source.id === id);
}

export function setTapped(state: KinState, source: { kind: SourceKind; id: string }, tapped: boolean) {
  if (source.kind === "tactic") {
    // The Graphiscope goes to the tactics discard pile when it is used; an effect that untaps cannot bring it back.
    if (tapped) discardTactic(state, state.play!.turn, source.id);
  } else if (source.kind === "character") state.cards[source.id].tapped = tapped;
  else state.items.find(item => item.id === source.id)!.tapped = tapped;
}

// With Snow Strider the top and bottom tile of a column count as adjacent.
export function adjacent(state: KinState, player: string, tile: number): number[] {
  const result = neighbors(tile);
  if (hasCard(state, player, "snow-strider")) {
    const row = tileRow(tile);
    if (row === 0) result.push(tileIndex(ROWS - 1, tileCol(tile)));
    else if (row === ROWS - 1) result.push(tileIndex(0, tileCol(tile)));
  }
  return result;
}



// Other players have no access to tiles with your armies and tile or center buildings, unless they hold your Access Treaty
// (then buildings can be passed, but not stopped on). A Fort can only be crossed by its owner.
const guestBuilding = (state: KinState, tile: number) =>
  state.buildings.find(building => building.tile === tile && (building.kind === "tile" || building.kind === "center") && building.owner !== null);

function accessible(state: KinState, player: string, tile: number): boolean {
  if (state.armies.some(army => army.tile === tile && army.owner !== player)) return false;
  const building = guestBuilding(state, tile);
  if (!building || building.owner === player) return true;
  return building.def !== "fort" && holdsTreaty(state, player, building.owner!, "access");
}

// A Move may not end on a building of someone whose Access Treaty you hold.
const mustNotStop = (state: KinState, player: string, tile: number) => {
  const building = guestBuilding(state, tile);
  return !!building && building.owner !== player;
};

// Fjarjarl, Seafarer: Moves made with him count ocean tiles at ⅓ for embarked armies.
const SEAFARER_COST = 2 / 3;
const isSeafarer = (state: KinState, player: string) => hasChar(state, player, "fjarjarl");

// Tile speed cost in halves, or null when the army may not move there.
export function stepCost(state: KinState, player: string, from: number, to: number, embarked = false, seafarer = false): number | null {
  if (!accessible(state, player, to) || wallBlocks(state, player, from, to)) return null;
  const terrain = state.tiles[to].terrain;
  const origin = state.tiles[from].terrain;
  let cost: number;
  if (terrain === "ocean") {
    if (!embarked && !hasCard(state, player, "benthic-walkers")) return null;
    // Fjarjarl's Seafarer: an embarked army pays ⅓ per ocean tile instead of ½ (costs are counted in halves).
    cost = embarked && seafarer ? SEAFARER_COST : 1;
  } else if (terrain === "desert") cost = hasCard(state, player, "desert-movement") ? 2 : 4;
  else if (terrain === "mountain") cost = hasCard(state, player, "mountain-movement") ? 2 : 6;
  else cost = 2;
  if (state.buildings.some(building => building.tile === to && building.kind === "tile" && building.owner === player)) cost = 2;
  if (origin === "plains" && terrain === "plains" && hasCard(state, player, "plaintsriders")) cost = Math.min(cost, 1);
  if (origin === "forest" && terrain === "forest" && hasCard(state, player, "rootwalkers")) cost = Math.min(cost, 1);
  if (origin === "snow" && terrain === "snow" && hasCard(state, player, "snow-strider")) cost = Math.min(cost, 1);
  const side = sideBetween(from, to);
  if (roadBetween(state, from, to)) return 1;
  if (side !== null && sideEdge(from, side) in state.world!.rivers && !hasCard(state, player, "river-movement")) cost += 2;
  return cost;
}

// An army may not leave a tile next to an army of another player without that player's permission: an Access Treaty is permission.
const blockedByNeighbour = (state: KinState, player: string, tile: number) =>
  adjacent(state, player, tile).some(next => state.armies.some(other => other.tile === next && other.owner !== player && !holdsTreaty(state, player, other.owner, "access")));

function rawSteps(state: KinState, player: string, from: number, speed: number, embarked = false, seafarer = false): { tile: number; cost: number }[] {
  if (from < 0 || blockedByNeighbour(state, player, from)) return [];
  const steps: { tile: number; cost: number }[] = [];
  for (const tile of new Set(adjacent(state, player, from))) {
    const cost = stepCost(state, player, from, tile, embarked, seafarer);
    if (cost !== null && cost <= speed + 1e-9) steps.push({ tile, cost });
  }
  return steps;
}

// A tile where the Move may not end is only worth entering when the army can carry on to a tile where it may.
function canEndFrom(state: KinState, player: string, tile: number, speed: number): boolean {
  if (!mustNotStop(state, player, tile)) return true;
  return rawSteps(state, player, tile, speed).some(step => canEndFrom(state, player, step.tile, speed - step.cost));
}

export function legalSteps(state: KinState, army: Army, speed: number, seafarer = false): { tile: number; cost: number }[] {
  if (army.status) return [];
  return rawSteps(state, army.owner, army.tile, speed, !!army.embarked && state.tiles[army.tile].terrain === "ocean", seafarer).filter(step => canEndFrom(state, army.owner, step.tile, speed - step.cost));
}

// Ocean tiles an army on a Harbor of its owner can embark onto.
export function embarkTiles(state: KinState, army: Army): number[] {
  if (army.tile < 0 || army.embarked || hasCard(state, army.owner, "benthic-walkers")) return [];
  const harbor = state.buildings.some(building => building.def === "harbor" && building.owner === army.owner && building.tile === army.tile);
  if (!harbor || blockedByNeighbour(state, army.owner, army.tile)) return [];
  return neighbors(army.tile).filter(tile => state.tiles[tile].terrain === "ocean" && accessible(state, army.owner, tile));
}

export const mayStopOn = (state: KinState, player: string, tile: number) => !mustNotStop(state, player, tile);

export const armiesOf = (state: KinState, player: string) => state.armies.filter(army => army.owner === player && army.tile >= 0);

// Armies that can make at least one step with the best card the player could tap.
export function movableArmies(state: KinState, player: string): Army[] {
  const best = Math.max(0, ...sourcesFor(state, player, "discovery").map(source => source.power));
  return armiesOf(state, player).filter(army => legalSteps(state, army, best * 2, hasChar(state, player, "fjarjarl")).length > 0);
}

function canActivate(state: KinState, player: string): boolean {
  const phase = state.play!.phase;
  // Move, Research, Publicize, Barter and Dissolve are implemented; only Discovery needs a check and it is never skipped.
  if (phase === "expansion") return canExpand(state, player) || hasPlayableTactic(state, player) || hasAbilityFor(state, player, "expansion");
  if (phase === "control") return canControl(state, player);
  return phase === "discovery" && movableArmies(state, player).length > 0;
}

const anyCanActivate = (state: KinState) => state.order.some(player => canActivate(state, player));

const nextPlayer = (state: KinState, player: string) => {
  const order = naturalOrder(state);
  return order[(order.indexOf(player) + 1) % order.length];
};

// Seasons Change, the first thing of every Event phase: everything untaps and every building produces its resource. Exhaustion
// wears off: exhausted armies recover, overexhausted armies become exhausted. The card itself taps afterwards.
function seasonsChange(state: KinState) {
  for (const player of Object.values(state.players)) player.relicsTapped = 0;
  for (const card of Object.values(state.cards)) card.tapped = false;
  for (const item of state.items) item.tapped = false;
  for (const army of state.armies) {
    if (army.status === "exhausted") delete army.status;
    else if (army.status === "overexhausted") army.status = "exhausted";
  }
  produce(state);
  seasonsChangeTreaties(state);
  hammersSeasons(state);
  deepSeasons(state);
  if (state.tactics) state.tactics.archeologists = [];
  delete state.sabotaged;
  delete state.borrowed;
  delete state.predictions;
  for (const item of state.items) if (item.def === "seasons-change" && item.zone === "board:phase") item.tapped = true;
}

function nextPhase(state: KinState) {
  const play = state.play!;
  const index = PLAY_PHASES.indexOf(play.phase) + 1;
  if (index === PLAY_PHASES.length) {
    if (checkVictory(state)) return;
    state.round += 1;
    play.phase = PLAY_PHASES[0];
    seasonsChange(state);
  } else play.phase = PLAY_PHASES[index];
  play.turn = naturalOrder(state)[0];
  play.passes = 0;
  play.forcePass = [];
}

// Expansion ends when nobody can activate a card. Event auto-passing is settled by dispatch;
// Discovery and Control wait for players to pass.
function settlePlay(state: KinState) {
  for (let guard = 0; guard < 8 && state.play!.phase === "expansion" && !anyCanActivate(state); guard++) nextPhase(state);
}

export function startPlay(state: KinState) {
  state.round = 1;
  state.play = { phase: "event", turn: naturalOrder(state)[0], passes: 0, move: null, barter: null, verdicts: [] };
  seasonsChange(state);
  settlePlay(state);
}

export function endTurn(state: KinState) {
  const play = state.play!;
  play.turn = nextPlayer(state, play.turn);
  settlePlay(state);
}

export function pass(state: KinState) {
  const play = state.play!;
  play.passes += 1;
  if (play.passes >= state.order.length) {
    nextPhase(state);
    settlePlay(state);
  } else endTurn(state);
}

// An action card can be activated when it is public on the phase board or lies in your court.
export const hasActionCard = (state: KinState, player: string, def: string) =>
  !forbiddenBy(state, def) && state.items.some(item => item.def === def && (item.zone === "board:phase" || item.zone === `court:${player}`));

// What every Discovery action has in common: your turn, the Discovery phase, nothing in progress, the action card is available
// and the chosen character or activation card is untapped. Returns the error or the card to tap.
export function activationError(state: KinState, player: string, action: Record<string, unknown>, def: string, phase: PlayPhase = "discovery"): string | Source {
  const play = state.play;
  const label = phase[0].toUpperCase() + phase.slice(1);
  if (!play) return "The game is not being played yet.";
  if (play.turn !== player) return "It is not your turn.";
  if (play.move) return "You are already moving an army.";
  if (play.barter) return "A barter offer is waiting for an answer.";
  if (play.battle) return "A battle is waiting for the defender.";
  if (play.council) return "A council is being held; vote first.";
  if (play.auction) return "An auction is being held; bid first.";
  if (play.quantum) return "Quantum Collapse: choose your cards first.";
  if (play.consent) return "Wait for the answer of the other player.";
  if (play.phase !== phase) return `${cardById(def)?.name ?? def} can only be activated in the ${label} phase.`;
  const forbidding = forbiddenBy(state, def);
  if (forbidding) return `${forbidding.name} is enacted: ${cardById(def)?.name ?? def} is forbidden.`;
  if (!hasActionCard(state, player, def)) return `You do not have the ${cardById(def)?.name ?? def} action card.`;
  return findSource(state, player, phase, String(action.kind), String(action.card)) ?? `Choose one of your untapped ${label} characters or activation cards.`;
}

// Loong: pay 1 influence to use him with power 6 for a Move.
const LOONG_POWER = 6;
const loongPower = (state: KinState, player: string, source: Source, action: Record<string, unknown>) =>
  action.longReach === true && source.kind === "character" && source.id === "loong" && hasChar(state, player, "loong") && influence(state, player) >= 1 ? LOONG_POWER : source.power;

export function validateMoveStart(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "move");
  if (typeof source === "string") return source;
  if (action.longReach === true && loongPower(state, player, source, action) !== LOONG_POWER) return "Long reach needs Loong as the character for the Move and 1 influence.";
  const army = state.armies.find(candidate => candidate.id === action.army);
  if (!army || army.owner !== player) return "Choose one of your armies.";
  if (army.tile < 0) return "That army cannot move on the world board.";
  if (army.status) return "That army is exhausted and cannot move this round.";
  if (blockedByNeighbour(state, player, army.tile)) return "An army of another player is next to it; you need their permission (an Access Treaty) to move off.";
  return legalSteps(state, army, loongPower(state, player, source, action) * 2, isSeafarer(state, player)).length > 0 ? null : "That army has nowhere to go with that card.";
}

export function startMove(state: KinState, player: string, action: Record<string, unknown>) {
  const play = state.play!;
  const source = findSource(state, player, "discovery", String(action.kind), String(action.card))!;
  const power = loongPower(state, player, source, action);
  if (power !== source.power) spendInfluence(state, player, 1);
  setTapped(state, source, true);
  play.passes = 0;
  play.move = { player, army: String(action.army), source: { kind: source.kind, id: source.id }, speed: power * 2, moved: false };
}

export function currentMove(state: KinState): MoveState | null {
  return state.play?.move ?? null;
}

export function moveTargets(state: KinState, move: MoveState) {
  const army = state.armies.find(candidate => candidate.id === move.army)!;
  return legalSteps(state, army, move.speed, isSeafarer(state, move.player));
}

function riverTollReaction(state: KinState, mover: string, from: number, to: number): ReactionState | null {
  const side = sideBetween(from, to);
  if (side === null || !state.world?.rivers || !(sideEdge(from, side) in state.world.rivers)) return null;
  for (const demander of state.order) {
    if (demander === mover || !hasChar(state, demander, "velzero")) continue;
    const village = state.buildings.some(building => building.def === "village" && building.owner === demander && building.tile >= 0
      && Math.min(tileDistance(building.tile, from), tileDistance(building.tile, to)) <= 3 && [0, 1, 2, 3, 4, 5].some(edge => sideEdge(building.tile, edge) === sideEdge(from, side)));
    if (!village) continue;
    return {
      kind: "river-toll", owner: demander, title: "River Toll",
      text: "Demand 1 gold from " + state.players[mover].username + " for crossing your river, or let the army pass.",
      options: [{ id: "demand", label: "Demand 1 gold" }], min: 0, max: 1,
      data: { mover, demander }
    };
  }
  return null;
}
export function validateMoveStep(state: KinState, player: string, tile: unknown, blocks?: unknown): string | null {
  const move = currentMove(state);
  if (!move) return "You are not moving an army.";
  if (move.player !== player) return "It is not your turn.";
  if (!moveTargets(state, move).some(step => step.tile === tile)) return "The army cannot move there.";
  if (blocks === undefined || blocks === null) return null;
  if (!Array.isArray(blocks) || new Set(blocks).size !== blocks.length || blocks.some(block => block !== "treasure" && block !== "relic")) return "Only one treasure block and one relic block can be moved along.";
  const army = state.armies.find(candidate => candidate.id === move.army)!;
  const missing = blocks.find(block => !state.blocks?.some(entry => entry.tile === army.tile && entry.kind === block));
  return missing ? `There is no ${missing} block on the tile the army leaves.` : null;
}

export function moveStep(state: KinState, tile: number, blocks: string[] = []) {
  const move = currentMove(state)!;
  const army = state.armies.find(candidate => candidate.id === move.army)!;
  const step = moveTargets(state, move).find(candidate => candidate.tile === tile)!;
  const from = army.tile;
  // Chosen Thrall (Deep Ones): the character joins their court and the Move is cancelled.
  if (thrallInMove(state, move, tile)) return finishMove(state);
  // The army may bring 1 treasure block and 1 relic block along each tile it moves.
  for (const kind of blocks) state.blocks!.find(entry => entry.tile === army.tile && entry.kind === kind)!.tile = tile;
  army.tile = tile;
  if (state.tiles[tile].terrain !== "ocean") army.embarked = false;
  move.speed = Math.round((move.speed - step.cost) * 1e6) / 1e6;
  move.moved = true;
  const toll = riverTollReaction(state, move.player, from, tile);
  if (toll) (state.play!.reactions ??= []).push(toll);
  if (!state.play!.reactions?.length && moveTargets(state, move).length === 0) finishMove(state);
}

// Tapping is payment: stopping, even before the first step, leaves the card tapped. Only another effect untaps it.
export function stopMove(state: KinState) {
  finishMove(state);
}

export function resumeMove(state: KinState) {
  const move = currentMove(state);
  if (move && !state.play?.reactions?.length && moveTargets(state, move).length === 0) finishMove(state);
}

function finishMove(state: KinState) {
  state.play!.move = null;
  endTurn(state);
}
