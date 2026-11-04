import { hasCard } from "./cards";
import { cardById } from "./cards.data";
import { placeRuins, ruinsSpots, isUnbuiltTile } from "./archeology";
import { endTurn } from "./play";
import { councilVoters, startCouncil } from "./council";
import { canAuction, resumeAuction, startAuction } from "./tactics";
import { donationOrder, startDonation } from "./commonwealth";
import { taxation } from "./kingdom";
import { calculatorError, calculatorOptions, isArkPlayer, massHarvest, massHarvestYield, predict } from "./ark";
import { canLapse, lapsedTreaties } from "./treaties";
import { isDeepOnes, thrallError, thrallTargets, whisper, whisperError, whisperOptions } from "./deepones";
import type { Army, KinState } from "./types";

// The Event Phase: Seasons Change happens by itself at its start (see play.ts); the other event cards on the phase board are
// activated for free, one per turn, and tap.

// Armies on unbuilt snow lose 1 strength, unless they have the Arctic core faction effect.
export const attritionTargets = (state: KinState): Army[] =>
  state.armies.filter(army => army.tile >= 0 && state.tiles[army.tile].terrain === "snow" && isUnbuiltTile(state, army.tile) && !hasCard(state, army.owner, "arctic"));

// Vault: armies of other players take 1 extra damage from Attrition.
export function applyAttrition(state: KinState) {
  for (const army of attritionTargets(state)) {
    const vaulted = state.buildings.some(building => building.def === "vault" && building.owner !== null && building.owner !== army.owner);
    army.strength -= vaulted ? 2 : 1;
  }
  state.armies = state.armies.filter(army => army.strength > 0);
}

const CONDITIONS: Record<string, (state: KinState, player: string) => boolean> = {
  attrition: state => attritionTargets(state).length > 0,
  "lapsed-treaties": state => canLapse(state),
  archeology: state => ruinsSpots(state).length > 0,
  council: state => !state.kingdom || state.order.some(player => hasCard(state, player, "council-science")),
  tactician: state => canAuction(state),
  "commonwealth-donation": state => !!state.commonwealth,
  taxation: state => !!state.kingdom,
  // Archive Ark: only the Ark's player can use these.
  calculators: (state, player) => isArkPlayer(state, player) && calculatorOptions(state, player).players.length > 0,
  "mass-harvest": (state, player) => massHarvestYield(state, player) !== null,
  // Deep Ones: Chosen Thrall once at a time, Whispered Gifts while the subterfuge deck has a card.
  "chosen-thrall": (state, player) => isDeepOnes(state, player) && !state.thralls?.[player] && thrallTargets(state, player).length > 0,
  "whispered-gifts": (state, player) => isDeepOnes(state, player) && whisperOptions(state, player).cards.length > 0 && whisperOptions(state, player).players.length > 0
};

const isEventCard = (def: string) => cardById(def)?.kind === "event" || (cardById(def)?.kind === "faction" && cardById(def)?.form === "event");

// The event cards that can be activated now: untapped, on the phase board, and their condition holds.
export const eventOptions = (state: KinState, player = ""): string[] =>
  state.items
    .filter(item => item.zone === "board:phase" && !item.tapped && isEventCard(item.def) && CONDITIONS[item.def]?.(state, player))
    .map(item => item.def);

export function validateEvent(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const play = state.play;
  if (!play) return "The game is not being played yet.";
  if (play.turn !== player) return "It is not your turn.";
  if (play.move || play.barter || play.battle || play.council || play.auction || play.quantum || play.consent) return "Finish what is in progress first.";
  if (play.phase !== "event") return "Event cards can only be activated in the Event phase.";
  if (!eventOptions(state, player).includes(String(action.def))) return "That event card cannot be activated now.";
  return action.def === "calculators" ? calculatorError(state, player, action) : action.def === "chosen-thrall" ? thrallError(state, player, action) : action.def === "whispered-gifts" ? whisperError(state, player, action) : null;
}

export function activateEvent(state: KinState, action: Record<string, unknown>) {
  const def = String(action.def);
  const player = (action.actor as { id: string }).id;
  if (def === "attrition") applyAttrition(state);
  else if (def === "archeology") placeRuins(state);
  else if (def === "lapsed-treaties") lapsedTreaties(state);
  else if (def === "mass-harvest") massHarvest(state, player);
  else if (def === "calculators") predict(state, player, action);
  else if (def === "chosen-thrall") (state.thralls ??= {})[player] = String(action.character);
  else if (def === "whispered-gifts") whisper(state, player, action);
  else if (def === "taxation") taxation(state);
  const card = state.items.find(item => item.def === def && item.zone === "board:phase")!;
  card.tapped = true;
  state.play!.passes = 0;
  const participants = def === "council" ? councilVoters(state) : def === "commonwealth-donation" ? donationOrder(state) : [];
  const schemer = participants.find(participant => hasCard(state, participant, "cautious-schemer"));
  if (schemer) {
    state.play!.schemer = { player: schemer, activator: player, event: def };
    state.play!.turn = schemer;
    return;
  }
  resolveOrderedEvent(state, def, player);
}

function resolveOrderedEvent(state: KinState, def: string, player: string) {
  if (def === "commonwealth-donation") return startDonation(state, player);
  if (def === "council") return startCouncil(state, state.play!.turn);
  if (def === "tactician") return startAuction(state, state.play!.turn);
  endTurn(state);
}

export function validateSchemer(state: KinState, player: string, action: Record<string, unknown>): string | null {
  if (!state.play?.schemer) return "Cautious Schemer is not waiting for a choice.";
  if (state.play.schemer.player !== player) return "Only the owner of Cautious Schemer chooses.";
  return typeof action.last === "boolean" ? null : "Choose whether to act last.";
}

export function schemerRespond(state: KinState, last: boolean) {
  const play = state.play!;
  const choice = play.schemer!;
  play.schemer = null;
  if (last) play.eventLast = choice.player;
  play.turn = choice.activator;
  if (choice.card) return resumeAuction(state, choice.activator, choice.card);
  resolveOrderedEvent(state, choice.event, choice.activator);
}
