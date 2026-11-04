import { CARDS, START_SETUPS, START_TECHS, cardById } from "./cards.data";
import type { Item, KinState } from "./types";

export function addItem(state: KinState, def: string, zone: string, owner: string | null = null, giver?: string): Item {
  const next = Math.max(0, ...state.items.map(item => Number(item.id.slice(1)) || 0)) + 1;
  const item: Item = { id: `i${next}`, def, zone, owner, tapped: false, ...(giver ? { giver } : {}) };
  state.items.push(item);
  return item;
}

const hasOnPhaseBoard = (state: KinState, def: string) => state.items.some(item => item.def === def && item.zone === "board:phase");

// A player has a card when it is in their court, or when it is public: public cards are usable by everyone.
export const hasCard = (state: KinState, player: string, def: string) =>
  state.items.some(item => item.def === def && (item.zone === `court:${player}` || item.zone === "board:public")) || knownViaFactionTreaty(state, player, def);

// The Faction Treaty gives its receiver the core faction effect of the Kin of its giver. A giver "kin:<id>" is a Kin that is not in
// the game (the Grand Observatory hands those out).
export const factionKinOf = (state: KinState, giver: string): string | undefined => giver.startsWith("kin:") ? giver.slice(4) : state.world?.kinPicks[giver];

function knownViaFactionTreaty(state: KinState, player: string, def: string): boolean {
  const card = cardById(def);
  if (!card || card.kind !== "faction" || !card.core || !card.kin) return false;
  return state.items.some(item => item.def === "faction-treaty" && item.zone === `court:${player}` && !!item.giver && factionKinOf(state, item.giver) === card.kin);
}

// The maximum strength of an army is 3, or 8 with Greater Army Strength.
export const maxArmyStrength = (state: KinState, player: string) => hasCard(state, player, "greater-army-strength") ? 8 : 3;

// The public cards at the start of the game: the building blueprints anyone can build, the action and event cards that need no
// technology, and every technology on the research track.
export function dealBoardCards(state: KinState) {
  for (const card of CARDS) {
    if (card.kind === "blueprint" && card.start) addItem(state, card.id, "board:building");
    else if ((card.kind === "action" || card.kind === "event") && card.start) addItem(state, card.id, "board:phase");
    else if (card.kind === "technology") addItem(state, card.id, "board:research");
  }
}

// A card that comes with a technology or faction effect. Event cards go straight to the event track of the phase board; the others
// are claimed into the court.
export function claimCard(state: KinState, player: string, def: string) {
  const card = cardById(def);
  if (!card) return;
  if (card.kind === "event" || (card.kind === "faction" && card.form === "event")) {
    if (!hasOnPhaseBoard(state, def)) addItem(state, def, "board:phase");
  } else addItem(state, def, `court:${player}`, player);
}

// Starting setup of a Kin, the part that claims cards: faction effects, the faction building blueprint and the starting technologies.
export function claimStartingCards(state: KinState, player: string) {
  const kin = state.world!.kinPicks[player];
  for (const card of CARDS) {
    if (card.kind === "faction" && card.kin === kin) claimCard(state, player, card.id);
    else if (card.kind === "blueprint" && card.kin === kin) claimCard(state, player, card.id);
  }
  for (const tech of START_TECHS[kin] ?? []) {
    const onTrack = state.items.find(item => item.def === tech && item.zone === "board:research");
    if (!onTrack) continue;
    onTrack.zone = `court:${player}`;
    onTrack.owner = player;
    for (const grant of cardById(tech)?.grants ?? []) claimCard(state, player, grant);
  }
  if (START_SETUPS[kin].otherFactionTreaties) {
    for (const other of state.order) if (other !== player) addItem(state, "faction-treaty", `court:${player}`, player, other);
  }
}
