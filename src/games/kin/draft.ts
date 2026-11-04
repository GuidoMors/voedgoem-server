import { CHARACTERS, type Archetype, type CharacterDef } from "./characters.data";
import { KINS } from "./kins";
import type { KinState } from "./types";

// Each round follows natural Kin order: two own-Kin picks, then one per archetype.
export const CHARACTER_ROUNDS = ["kin", "kin", "discovery", "expansion", "control"] as const;

// Some Kin must start with a specific character.
const FORCED: Record<string, string> = { ethereal: "ethereal", lumon: "lumon" };

export const characterById = (id: string): CharacterDef | undefined => CHARACTERS.find(c => c.id === id);

// Players sorted by the position of their Kin in the natural order.
export function naturalOrder(state: KinState): string[] {
  const picks = state.world?.kinPicks ?? {};
  const place = (id: string) => KINS.findIndex(kin => kin.id === picks[id]);
  return [...state.order].sort((a, b) => place(a) - place(b));
}

export const draftOrder = (state: KinState) => state.world?.redraftPlayer ? [state.world.redraftPlayer] : naturalOrder(state);

// The neutral characters and the characters of every picked Kin go on the stack.
export function dealCharacters(state: KinState) {
  const picked = new Set(Object.values(state.world!.kinPicks));
  for (const def of CHARACTERS) {
    if (def.kin !== null && !picked.has(def.kin)) continue;
    if (state.world!.redraftPlayer && state.cards[def.id]) {
      if (state.cards[def.id].zone === "deck:character") state.cards[def.id].zone = "pool";
      continue;
    }
    state.cards[def.id] = { id: def.id, def: def.id, zone: "pool", owner: null, tapped: false };
  }
}

export const unclaimed = (state: KinState): CharacterDef[] =>
  Object.values(state.cards).filter(card => card.zone === "pool").map(card => characterById(card.def)!);

export function eligibleCharacters(state: KinState, playerId: string, round: number): CharacterDef[] {
  const kin = state.world!.kinPicks[playerId];
  const pool = unclaimed(state);
  if (round === 0) return pool.filter(c => (FORCED[kin] ? c.id === FORCED[kin] : c.kin === kin));
  if (CHARACTER_ROUNDS[round] === "kin") return pool.filter(c => c.kin === kin);
  const wanted = CHARACTER_ROUNDS[round] as Archetype;
  return pool.filter(c => c.archetypes.includes(wanted) || c.archetypes.includes("universal"));
}

export const draftDone = (state: KinState) => state.world!.charPicks.length >= CHARACTER_ROUNDS.length * draftOrder(state).length;

export function characterPicker(state: KinState): string | null {
  const world = state.world;
  if (!world || world.step !== "characters" || draftDone(state)) return null;
  const order = draftOrder(state);
  return order[world.charPicks.length % order.length];
}

export const characterRound = (state: KinState) => Math.floor(state.world!.charPicks.length / draftOrder(state).length);

// A turn with nothing to pick is skipped; when every turn is over the leftovers form the character deck.
export function settleCharacters(state: KinState) {
  const world = state.world!;
  while (world.step === "characters" && !draftDone(state)) {
    const picker = characterPicker(state)!;
    if (eligibleCharacters(state, picker, characterRound(state)).length > 0) return;
    world.charPicks.push("");
  }
  if (world.step !== "characters") return;
  for (const card of Object.values(state.cards)) if (card.zone === "pool") card.zone = "deck:character";
  world.step = "done";
}
