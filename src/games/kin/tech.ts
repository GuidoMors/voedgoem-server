import { claimCard, addItem, hasCard } from "./cards";
import { cardById } from "./cards.data";
import { activationError, endTurn, setTapped } from "./play";
import type { Item, KinState } from "./types";

// A technology is unknown (research track), claimed (in a court) or public (public track).
export const RESEARCH_ZONE = "board:research";
export const PUBLIC_ZONE = "board:public";

const gears = (state: KinState, player: string) => state.players[player].resources.gear ?? 0;
const techs = (state: KinState, zone: string) => state.items.filter(item => item.zone === zone && cardById(item.def)?.kind === "technology");

export interface TechOption {
  item: string;
  cost: number;
  // Publicize only: whose court the technology is in.
  owner?: string;
}

// Steampower can only be researched once every other technology is researched: none is left on the research track
// and none lies in another player's court.
function steampowerReady(state: KinState, player: string): boolean {
  const others = state.items.filter(item => cardById(item.def)?.kind === "technology" && item.def !== "steampower");
  return others.every(item => item.zone === PUBLIC_ZONE || item.zone === `court:${player}`);
}

export function researchOptions(state: KinState, player: string): TechOption[] {
  return techs(state, RESEARCH_ZONE)
    .filter(item => item.def !== "steampower" || steampowerReady(state, player))
    .map(item => ({ item: item.id, cost: cardById(item.def)?.gearCost ?? 0 }))
    .filter(option => option.cost <= gears(state, player));
}

// Any technology in a court. Your own costs no gears; another player's costs its gear cost.
export function publicizeOptions(state: KinState, player: string): TechOption[] {
  return state.order.flatMap(owner => techs(state, `court:${owner}`).map(item => ({ item: item.id, owner, cost: owner === player ? 0 : cardById(item.def)?.gearCost ?? 0 })))
    .filter(option => option.cost <= gears(state, player));
}

export function validateResearch(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "research");
  if (typeof source === "string") return source;
  const item = state.items.find(candidate => candidate.id === action.tech);
  if (!item || item.zone !== RESEARCH_ZONE || cardById(item.def)?.kind !== "technology") return "Choose a technology on the research track.";
  if (item.def === "steampower" && !steampowerReady(state, player)) return "Steampower can only be researched after all other technologies.";
  const cost = cardById(item.def)?.gearCost ?? 0;
  return cost <= gears(state, player) ? null : `You need ${cost} gears to research ${cardById(item.def)?.name}.`;
}

// Claim the technology and the cards it tells you to claim (event cards go on the phase board).
export function research(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "research") as Exclude<ReturnType<typeof activationError>, string>;
  const item = state.items.find(candidate => candidate.id === action.tech)!;
  const def = cardById(item.def)!;
  setTapped(state, source, true);
  state.players[player].resources.gear = gears(state, player) - (def.gearCost ?? 0);
  item.zone = `court:${player}`;
  item.owner = player;
  for (const grant of def.grants ?? []) claimCard(state, player, grant);
  state.play!.passes = 0;
  endTurn(state);
}

export function validatePublicize(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "publicize");
  if (typeof source === "string") return source;
  const option = publicizeOptions(state, player).find(candidate => candidate.item === action.tech);
  if (option) return null;
  const item = state.items.find(candidate => candidate.id === action.tech);
  if (!item || !item.zone.startsWith("court:") || cardById(item.def)?.kind !== "technology") return "Choose a technology in a court.";
  return `You need ${cardById(item.def)?.gearCost} gears to publicize ${cardById(item.def)?.name}.`;
}

// The technology moves to the public track. Its blueprints go on the building board and its action cards on the phase board.
// Active technologies give everyone but the owner an activation card of their own.
export function publicize(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "publicize") as Exclude<ReturnType<typeof activationError>, string>;
  const item = state.items.find(candidate => candidate.id === action.tech)!;
  const def = cardById(item.def)!;
  setTapped(state, source, true);
  if (item.owner !== player) state.players[player].resources.gear = gears(state, player) - (def.gearCost ?? 0);
  const former = item.owner;
  makePublic(state, item);
  // Technomancers (Archive Ark): when somebody else publicizes one of your technologies, gain 1 gear.
  if (former && former !== player && hasCard(state, former, "technomancers")) state.players[former].resources.gear = gears(state, former) + 1;
  // Open Source (the Ethereal's core faction effect): gain 1 gear after the Publicize resolves.
  if (hasCard(state, player, "open-source")) state.players[player].resources.gear = gears(state, player) + 1;
    state.play!.passes = 0;
    endTurn(state);
  }

  // The technology moves to the public track; what it grants moves along.
  export function makePublic(state: KinState, item: Item) {
  const def = cardById(item.def)!;
  const owner = item.owner!;
  item.zone = PUBLIC_ZONE;
  item.owner = null;
  for (const grant of def.grants ?? []) {
    const card = cardById(grant);
    const held: Item | undefined = state.items.find(candidate => candidate.def === grant && candidate.zone === `court:${owner}`);
    if (card?.kind === "blueprint" && held) { held.zone = "board:building"; held.owner = null; }
    else if (card?.kind === "action" && held) { held.zone = "board:phase"; held.owner = null; }
    else if (card?.kind === "activation" && item.def.startsWith("active-")) {
      for (const other of state.order) if (other !== owner) addItem(state, grant, `court:${other}`, other);
    }
  }
}
