import { addItem } from "./cards";
import { population } from "./buildings";
import { naturalOrder } from "./draft";
import { COMMONWEALTH_LAWS } from "./cards.data";
import { discardEnacted, enactedLaw, lawBoard } from "./laws";
import { activationError, endTurn, setTapped, type Source } from "./play";
import { shuffle } from "./rng";
import type { KinState } from "./types";

const gold = (state: KinState, player: string) => state.players[player].resources.gold ?? 0;
const partyLeader = (state: KinState, player: string) => state.commonwealth!.members.includes(player)
  ? state.commonwealth!.leader : state.commonwealth!.oppositionLeader;

export function startCommonwealth(state: KinState, leader: string) {
  discardEnacted(state);
  const regularLaws = structuredClone(lawBoard(state));
  state.commonwealth = { members: [...state.order], leader, oppositionLeader: null, step: 1, value: 1, regularLaws };
  state.laws = { deck: shuffle(state.rng, COMMONWEALTH_LAWS.map(law => law.id)), discard: [], enacted: null };
  for (const def of ["oppose", "overthrow", "commonwealth-donation"]) addItem(state, def, "board:phase");
  addItem(state, "cautious-schemer", `court:${leader}`, leader);
}

export function cleanupCommonwealth(state: KinState) {
  if (!state.commonwealth) return;
  state.items = state.items.filter(item => !["oppose", "overthrow", "commonwealth-donation", "cautious-schemer"].includes(item.def));
  state.laws = state.commonwealth.regularLaws;
  delete state.commonwealth;
}

export function rewardCommonwealthAction(state: KinState, player: string, action: string) {
  if (state.commonwealth?.members.includes(player) && enactedLaw(state)?.rewards?.includes(action))
    state.players[player].resources.gold = gold(state, player) + 1;
}

export function eventOrder(state: KinState, players: string[]): string[] {
  const last = state.play?.eventLast;
  return last && players.includes(last) ? [...players.filter(player => player !== last), last] : players;
}

export function donationOrder(state: KinState): string[] {
  const commonwealth = state.commonwealth;
  if (!commonwealth || commonwealth.members.length < state.order.length - commonwealth.members.length) return [];
  return eventOrder(state, naturalOrder(state).filter(player => commonwealth.members.includes(player)));
}

export function startDonation(state: KinState, activator: string) {
  const commonwealth = state.commonwealth!;
  const order = donationOrder(state);
  if (order.length === 0) {
    commonwealth.step = Math.max(1, commonwealth.step - 1);
    state.play!.turn = activator;
    return endTurn(state);
  }
  state.play!.donation = { activator, order, donations: {} };
  state.play!.turn = order[0];
}

export function validateDonation(state: KinState, player: string, action: Record<string, unknown>): string | null {
  if (!state.play?.donation) return "No Commonwealth donation is in progress.";
  if (state.play.turn !== player) return "It is not your turn to donate.";
  return Number.isSafeInteger(action.gold) && (action.gold as number) >= 0 && (action.gold as number) <= gold(state, player)
    ? null : "Choose a whole number of gold from your court, including zero.";
}

export function donate(state: KinState, player: string, action: Record<string, unknown>) {
  const play = state.play!;
  const donation = play.donation!;
  const amount = action.gold as number;
  state.players[player].resources.gold = gold(state, player) - amount;
  donation.donations[player] = amount;
  const next = donation.order.find(member => !(member in donation.donations));
  if (next) { play.turn = next; return; }
  const total = Object.values(donation.donations).reduce((sum, paid) => sum + paid, 0);
  const commonwealth = state.commonwealth!;
  if (total >= commonwealth.value) {
    commonwealth.step = Math.min(10, commonwealth.step + 1);
    commonwealth.value = Math.min(20, total);
  } else commonwealth.value = Math.max(1, total);
  state.players[commonwealth.leader].resources.gold = gold(state, commonwealth.leader) + Math.floor(total / 2);
  play.turn = donation.activator;
  play.donation = null;
  endTurn(state);
}

export function validatePartyAction(state: KinState, player: string, action: Record<string, unknown>, def: "oppose" | "overthrow"): string | null {
  const source = activationError(state, player, action, def, "control");
  if (typeof source === "string") return source;
  if (!state.commonwealth) return "The Commonwealth chapter is not being played.";
  const leader = partyLeader(state, player);
  if (!leader || leader === player) return "A party leader cannot Oppose or Overthrow themselves.";
  return def === "overthrow" && gold(state, player) <= gold(state, leader) ? "You need more gold than your party leader." : null;
}

function switchParty(state: KinState, player: string) {
  const commonwealth = state.commonwealth!;
  if (commonwealth.members.includes(player)) {
    commonwealth.members = commonwealth.members.filter(member => member !== player);
    commonwealth.oppositionLeader ??= player;
  } else commonwealth.members.push(player);
}

export function partyAction(state: KinState, player: string, action: Record<string, unknown>, def: "oppose" | "overthrow") {
  const source = activationError(state, player, action, def, "control") as Source;
  const commonwealth = state.commonwealth!;
  const leader = partyLeader(state, player)!;
  setTapped(state, source, true);
  state.play!.passes = 0;
  if (def === "overthrow") {
    if (commonwealth.members.includes(player)) commonwealth.leader = player;
    else commonwealth.oppositionLeader = player;
  } else if (population(state, player) <= population(state, leader)) {
    state.play!.oppose = { player, leader };
    state.play!.turn = leader;
    return;
  } else switchParty(state, player);
  endTurn(state);
}

export function validateOpposeResponse(state: KinState, player: string, action: Record<string, unknown>): string | null {
  if (!state.play?.oppose) return "No Oppose request is waiting.";
  if (state.play.oppose.leader !== player) return "Only that party's leader may answer.";
  return typeof action.accept === "boolean" ? null : "Choose whether to allow the player to Oppose.";
}

export function opposeRespond(state: KinState, accept: boolean) {
  const play = state.play!;
  const request = play.oppose!;
  if (accept) switchParty(state, request.player);
  play.oppose = null;
  play.turn = request.player;
  endTurn(state);
}
