import { characterAbilityHolder, hasChar } from "./neutrals";
import { adjacent } from "./play";
import { announce, subterfugeBoard } from "./tactics";
import { characterById } from "./draft";
import type { Building, KinState, MoveState, ReactionState } from "./types";

// The Deep Ones: helpers for the Underwater Cult, Chosen Thrall, Whispered Gifts and the characters Iherat, Sha'shi'oq, Ogilgalog,
// Raheskah and Goahl'fiesj.

export const DEDICATIONS = ["gold", "lumber", "stone", "food"];
export const isDeepOnes = (state: KinState, player: string) => state.world?.kinPicks[player] === "deepones";

const name = (state: KinState, player: string) => state.players[player].username;
const isTileBuilding = (building: Building) => (building.def === "village" || building.def === "city") && building.tile >= 0;

// --- Sha'shi'oq, Shapeshifter: the dedicated villages and cities of the player. ---

export const dedicatedBuildings = (state: KinState, player: string): Building[] =>
  state.buildings.filter(building => building.owner === player && isTileBuilding(building) && !!building.dedication);

// --- Ogilgalog, Shadowmelder: move an army between villages, cities and Sleeping Cities of the player. ---

export function shadowOptions(state: KinState, player: string): { army: string; tiles: number[] }[] {
  const spots = state.buildings.filter(building => building.owner === player && building.tile >= 0 && (isTileBuilding(building) || building.def === "sleeping-city")).map(building => building.tile);
  const empty = spots.filter(tile => !state.armies.some(army => army.tile === tile));
  return state.armies
    .filter(army => army.owner === player && spots.includes(army.tile))
    .map(army => ({ army: army.id, tiles: empty }))
    .filter(option => option.tiles.length > 0);
}

// --- Whispered Gifts (event): the players and the subterfuge cards still in the deck. ---

export function whisperOptions(state: KinState, player: string): { players: string[]; cards: string[] } {
  const deck = [...new Set(subterfugeBoard(state).deck)];
  return { players: state.order.filter(other => other !== player), cards: deck };
}

export function whisperError(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const options = whisperOptions(state, player);
  if (options.cards.length === 0) return "There is no card left in the subterfuge deck.";
  if (!options.players.includes(String(action.to))) return "Choose another player.";
  return options.cards.includes(String(action.card)) ? null : "Choose a card that is left in the subterfuge deck.";
}

export function whisper(state: KinState, player: string, action: Record<string, unknown>) {
  const board = subterfugeBoard(state);
  board.deck.splice(board.deck.indexOf(String(action.card)), 1);
  (board.hands[String(action.to)] ??= []).push(String(action.card));
  announce(state, `${name(state, player)} gave ${name(state, String(action.to))} a subterfuge card with Whispered Gifts.`);
}

// --- Chosen Thrall (event) ---

// Characters in the courts of other players, that are not hostages.
export const thrallTargets = (state: KinState, player: string): string[] =>
  Object.values(state.cards).filter(card => card.owner && card.owner !== player && !card.hostageOf && characterById(card.def)).map(card => card.id);

export function thrallError(state: KinState, player: string, action: Record<string, unknown>): string | null {
  return thrallTargets(state, player).includes(String(action.character)) ? null : "Choose a character from the court of another player.";
}

// The character joins the court of the Deep Ones, and the card is gone from play.
function claimThrall(state: KinState, deep: string, id: string) {
  const card = state.cards[id];
  const from = card.owner!;
  card.owner = deep;
  card.zone = `court:${deep}`;
  card.tapped = true;
  delete card.hostageOf;
  delete state.thralls![deep];
  const item = state.items.find(candidate => candidate.def === "chosen-thrall" && candidate.zone === "board:phase");
  if (item) state.items.splice(state.items.indexOf(item), 1);
  announce(state, `${characterById(card.def)?.name ?? id} of ${name(state, from)} was the Chosen Thrall of ${name(state, deep)} and joined their court.`);
}

// A general used in combat against the Deep Ones: true when it was the Chosen Thrall; the Battle is then cancelled.
export function thrallInBattle(state: KinState, deep: string, general: string): boolean {
  if (state.thralls?.[deep] !== general || state.cards[general]?.owner === deep) return false;
  claimThrall(state, deep, general);
  return true;
}

// A Move that would bring an army next to an army of the Deep Ones with the Chosen Thrall tapped for it: true when the Move is cancelled.
export function thrallInMove(state: KinState, move: MoveState, tile: number): boolean {
  if (move.source.kind !== "character") return false;
  for (const deep of Object.keys(state.thralls ?? {})) {
    if (deep === move.player || state.thralls![deep] !== move.source.id) continue;
    if (!adjacent(state, deep, tile).some(next => state.armies.some(army => army.tile === next && army.owner === deep))) continue;
    claimThrall(state, deep, move.source.id);
    return true;
  }
  return false;
}

// --- Raheskah, Dominator: as a general he sets the opposing general's power to 0. ---

export const dominates = (state: KinState, player: string, general: string | null | undefined): boolean =>
  !!general && hasChar(state, player, "raheskah") && (general === "raheskah" || state.borrowed?.[general] === "raheskah");

// --- Iherat, Conversion: 5 mana adds 2 ambush dice to one side of a Battle, as a reaction before Resolve Dice (see battle.ts). ---

export const IHERAT_COST = 5;

// The reaction offered to Iherat's owner, who does not need to take part in the battle. Null when Iherat cannot be used.
export function iheratReaction(state: KinState): ReactionState | null {
  const owner = state.order.find(player => {
    const holder = characterAbilityHolder(state, player, "iherat");
    return !!holder && !state.cards[holder].tapped && (state.players[player].resources.mana ?? 0) >= IHERAT_COST;
  });
  if (!owner) return null;
  return {
    kind: "iherat", owner, title: "Conversion",
    text: `Iherat: pay ${IHERAT_COST} mana to add 2 ambush dice to the outcome of one side of this battle, or decline.`,
    options: [{ id: "attacker", label: "Attacker" }, { id: "defender", label: "Defender" }], min: 0, max: 1
  };
}

export function iheratPay(state: KinState, player: string) {
  state.players[player].resources.mana -= IHERAT_COST;
  const holder = characterAbilityHolder(state, player, "iherat");
  if (holder) state.cards[holder].tapped = true;
  announce(state, `${name(state, player)}'s Iherat added 2 ambush dice to a side of the battle.`);
}

// --- Goahl'fiesj, Courtdweller: Seasons Change sets his power to 1 with strictly more characters in court than any other player. ---

export function deepSeasons(state: KinState) {
  const card = state.cards["goahl-fiesj"];
  const power = (state.charPower ??= {});
  if (!card?.owner) return void delete power["goahl-fiesj"];
  const count = (player: string) => Object.values(state.cards).filter(other => other.owner === player).length;
  const mine = count(card.owner);
  power["goahl-fiesj"] = state.order.every(other => other === card.owner || count(other) < mine) ? 1 : 0;
}
