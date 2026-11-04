import { shuffle } from "./rng";
import type { KinState } from "./types";

// The law cards of 25-laws.md. A law is active from the Council event that enacts it until the next Council event or a Revoke,
// and forbids the action cards it names.
export interface Law {
  id: string;
  name: string;
  forbids: string[];
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
  { id: "peace-resolution", name: "Peace Resolution", forbids: ["battle"] },
  { id: "quarantine", name: "Quarantine", forbids: ["reinforce"] },
  { id: "stockpiles", name: "Stockpiles", forbids: ["harvest"] },
  { id: "naval-blockade", name: "Naval Blockade", forbids: ["embark"] }
];

export const lawById = (id: string | null | undefined) => LAWS.find(law => law.id === id);

// The law deck, its discard pile and the enacted law; created when the first Council event is held.
export interface LawBoard {
  deck: string[];
  discard: string[];
  enacted: string | null;
}

export function lawBoard(state: KinState): LawBoard {
  return state.laws ??= { deck: shuffle(state.rng, LAWS.map(law => law.id)), discard: [], enacted: null };
}

export const enactedLaw = (state: KinState) => lawById(state.laws?.enacted);

// The enacted law that forbids this action card, if any.
export function forbiddenBy(state: KinState, def: string): Law | undefined {
  const law = enactedLaw(state);
  return law?.forbids.includes(def) ? law : undefined;
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
