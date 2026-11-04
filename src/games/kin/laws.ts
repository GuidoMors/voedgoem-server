import { shuffle } from "./rng";
import { hasCard } from "./cards";
import { COMMONWEALTH_LAWS } from "./cards.data";
import type { KinState } from "./types";

// The law cards of 25-laws.md. A law is active from the Council event that enacts it until the next Council event or a Revoke,
// and forbids the action cards it names.
export interface Law {
  id: string;
  name: string;
  forbids: string[];
  rewards?: string[];
  text?: string;
}

export const LAWS: readonly Law[] = [
  { id: "general-blockade", name: "General Blockade", forbids: ["move"] },
  { id: "block-inquiry", name: "Block Inquiry", forbids: ["research"] },
  { id: "enforce-copyright", name: "Enforce Copyright", forbids: ["publicize"] },
  { id: "blockade-trade", name: "Blockade Trade", forbids: ["barter"] },
  { id: "enforce-treaties", name: "Enforce Treaties", forbids: ["dissolve"] },
  { id: "zone-districts", name: "Zone Districts", forbids: ["build"] },
  { id: "disarmements", name: "Disarmements", forbids: ["deploy", "recruit"] },
  { id: "cultural-sites", name: "Cultural Sites", forbids: ["demolish"] },
  { id: "cargo-enforcement", name: "Cargo Enforcement", forbids: ["reclaim"] },
  { id: "protect-ancestry", name: "Protect Ancestry", forbids: ["explore"] },
  { id: "peace-resolution", name: "Peace Resolution", forbids: ["battle"] },
  { id: "quarantine", name: "Quarantine", forbids: ["reinforce"] },
  { id: "stockpiles", name: "Stockpiles", forbids: ["harvest"] },
  { id: "naval-blockade", name: "Naval Blockade", forbids: ["embark"] }
];

export const lawById = (id: string | null | undefined): Law | undefined => [...LAWS, ...COMMONWEALTH_LAWS].find(law => law.id === id);
const LAW_TECH: Record<string, string> = {
  "naval-blockade": "harbor-construction",
  "cargo-enforcement": "archeology-science",
  "protect-ancestry": "archeology-science"
};
export const availableLaws = (state: KinState): readonly Law[] => state.commonwealth ? COMMONWEALTH_LAWS : LAWS.filter(law =>
  !LAW_TECH[law.id] || state.order.some(player => hasCard(state, player, LAW_TECH[law.id])));

// The law deck, its discard pile and the enacted law; created when the first Council event is held.
export interface LawBoard {
  deck: string[];
  discard: string[];
  enacted: string | null;
}

export function lawBoard(state: KinState): LawBoard {
  const eligible = availableLaws(state).map(law => law.id);
  if (!state.laws) return state.laws = { deck: shuffle(state.rng, eligible), discard: [], enacted: null };
  const board = state.laws;
  if (state.commonwealth) return board;
  board.deck = board.deck.filter(id => !LAW_TECH[id] || eligible.includes(id));
  board.discard = board.discard.filter(id => !LAW_TECH[id] || eligible.includes(id));
  const present = new Set([...board.deck, ...board.discard, ...(state.play?.council?.laws ?? []), ...activeLaws(state)]);
  const added = eligible.filter(id => LAW_TECH[id] && !present.has(id));
  if (added.length) board.deck = shuffle(state.rng, [...board.deck, ...added]);
  return board;
}

export const enactedLaw = (state: KinState) => lawById(state.laws?.enacted);

export const activeLaws = (state: KinState): string[] => state.kingdom
  ? [...state.kingdom.rebel, ...state.kingdom.kingdom]
  : state.laws?.enacted ? [state.laws.enacted] : [];

export function lawsFor(state: KinState, player: string): Law[] {
  const kingdom = state.kingdom;
  const immune = kingdom && (player === kingdom.king || state.items.some(item =>
    item.def === "vassal-treaty" && item.giver === player && item.zone === `court:${kingdom.king}`));
  const ids = kingdom && immune ? kingdom.kingdom : activeLaws(state);
  return ids.flatMap(id => { const law = lawById(id); return law ? [law] : []; });
}

// The enacted law that forbids this action card, if any.
export function forbiddenBy(state: KinState, def: string, player = state.play?.turn ?? ""): Law | undefined {
  return lawsFor(state, player).find(law => law.forbids.includes(def));
}

export function discardLaw(state: KinState, id: string) {
  const board = lawBoard(state);
  if (state.kingdom) {
    state.kingdom.rebel = state.kingdom.rebel.filter(law => law !== id);
    state.kingdom.kingdom = state.kingdom.kingdom.filter(law => law !== id);
  } else board.enacted = null;
  board.discard.push(id);
}

// Draws from the law deck; when it is empty the discard pile is shuffled into it.
export function drawLaws(state: KinState, count: number): string[] {
  const board = lawBoard(state);
  const drawn: string[] = [];
  while (drawn.length < count) {
    if (board.deck.length === 0) {
      if (board.discard.length === 0) break;
      board.deck = shuffle(state.rng, board.discard);
      board.discard = [];
    }
    drawn.push(board.deck.pop()!);
  }
  return drawn;
}

export const discardEnacted = (state: KinState) => {
  const board = lawBoard(state);
  if (board.enacted) board.discard.push(board.enacted);
  board.enacted = null;
};
