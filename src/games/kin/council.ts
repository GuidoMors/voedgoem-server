import { naturalOrder } from "./draft";
import { hasCard } from "./cards";
import { gainInfluence, influence, spendInfluence } from "./hanshu";
import { hasChar } from "./neutrals";
import { subterfugeBoard } from "./tactics";
import { population } from "./buildings";
import { discardEnacted, drawLaws, lawBoard } from "./laws";
import { endTurn } from "./play";
import { eventOrder } from "./commonwealth";
import type { KinState } from "./types";

// The Council event: the enacted law is discarded, three laws are drawn and the voters vote for one each, in natural order.
// A law gets votes equal to the voter's population. The strict highest law is enacted; on a tie nothing is enacted.

export const LAWS_DRAWN = 3;
export const GRAND_WORKS = 3;

// With Council Science in a player's court only they vote; when it is public everybody votes.
export function councilVoters(state: KinState): string[] {
  const tech = state.items.find(item => item.def === "council-science");
  const owner = tech?.zone.startsWith("court:") ? tech.zone.slice("court:".length) : null;
  return naturalOrder(state).filter(player => !owner || player === owner);
}

export function startCouncil(state: KinState, activator: string) {
  const play = state.play!;
  discardEnacted(state);
  play.passes = 0;
  // Quantum Collapse: its holder chooses which laws are drawn.
  const chooser = state.order.find(player => hasCard(state, player, "quantum-collapse"));
  const board = lawBoard(state);
  const options = [...board.deck, ...board.discard];
  if (chooser && options.length > LAWS_DRAWN) {
    play.quantum = { player: chooser, kind: "laws", options, pick: LAWS_DRAWN, activator };
    play.turn = chooser;
    return;
  }
  beginVote(state, activator, drawLaws(state, LAWS_DRAWN));
}

function beginVote(state: KinState, activator: string, laws: string[]) {
  const play = state.play!;
  if (state.kingdom) {
    const king = state.kingdom.king;
    play.council = { activator, laws, voters: [], votes: {}, king };
    if (!laws.length) {
      play.council = null;
      play.turn = activator;
      return endTurn(state);
    }
    play.turn = king;
    return;
  }
  const voters = eventOrder(state, councilVoters(state));
  play.council = { activator, laws, voters, votes: {} };
  if (laws.length === 0 || voters.length === 0) return resolveCouncil(state);
  play.turn = voters[0];
}

export function validateQuantum(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const quantum = state.play?.quantum;
  if (!quantum) return "Quantum Collapse is not being used.";
  if (quantum.player !== player) return "Only the Ethereal chooses.";
  const cards = action.cards;
  if (!Array.isArray(cards) || cards.length !== quantum.pick || new Set(cards).size !== cards.length) return `Choose ${quantum.pick} different card${quantum.pick === 1 ? "" : "s"}.`;
  return cards.every(card => quantum.options.includes(String(card))) ? null : "Choose from the offered cards.";
}

export function quantum(state: KinState, player: string, action: Record<string, unknown>) {
  const play = state.play!;
  const choice = play.quantum!;
  const cards = action.cards as string[];
  play.quantum = null;
  if (choice.kind === "laws") {
    const board = lawBoard(state);
    for (const card of cards) {
      const pile = board.deck.includes(card) ? board.deck : board.discard;
      pile.splice(pile.indexOf(card), 1);
    }
    return beginVote(state, choice.activator, cards);
  }
  const board = subterfugeBoard(state);
  const pile = board.deck.includes(cards[0]) ? board.deck : board.discard;
  pile.splice(pile.indexOf(cards[0]), 1);
  (board.hands[player] ??= []).push(cards[0]);
  play.turn = choice.activator;
  endTurn(state);
}

export function validateVote(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const council = state.play?.council;
  if (!council) return "No council is being held.";
  if (council.king) return "The King chooses a law instead of holding a vote.";
  if (state.play!.turn !== player) return "It is not your turn to vote.";
  if (action.grand === true) {
    if (!hasChar(state, player, "yamanano")) return "Grand Works needs Yamanano in your court.";
    if (influence(state, player) < 1) return "Grand Works costs 1 influence.";
  }
  return council.laws.includes(String(action.law)) ? null : "Vote for one of the three laws that were drawn.";
}

export function validateRoyalEnact(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const council = state.play?.council;
  if (!state.kingdom || !council?.king) return "No royal Council decision is in progress.";
  if (council.king !== player) return "Only the King chooses the law and track.";
  if (!council.laws.includes(String(action.law))) return "Choose one of the drawn laws.";
  return action.track === "rebel" || action.track === "kingdom" ? null : "Choose the rebel or kingdom track.";
}

export function royalEnact(state: KinState, action: Record<string, unknown>) {
  const play = state.play!;
  const council = play.council!;
  const law = String(action.law);
  const track = action.track as "rebel" | "kingdom";
  state.kingdom![track].push(law);
  lawBoard(state).discard.push(...council.laws.filter(id => id !== law));
  play.councilResult = { id: (play.councilResult?.id ?? 0) + 1, laws: council.laws, tally: {}, enacted: law, track };
  play.council = null;
  play.turn = council.activator;
  endTurn(state);
}

export function vote(state: KinState, player: string, action: Record<string, unknown>) {
  const council = state.play!.council!;
  council.votes[player] = String(action.law);
  // Yamanano, Grand Works: pay 1 influence to add 3 to your votes.
  if (action.grand === true) {
    spendInfluence(state, player, 1);
    (council.grand ??= []).push(player);
  }
  const next = council.voters.find(voter => !(voter in council.votes));
  if (next) state.play!.turn = next;
  else resolveCouncil(state);
}

function resolveCouncil(state: KinState) {
  const play = state.play!;
  const council = play.council!;
  const tally: Record<string, number> = Object.fromEntries(council.laws.map(law => [law, 0]));
  for (const [voter, law] of Object.entries(council.votes)) tally[law] += population(state, voter) + (council.grand?.includes(voter) ? GRAND_WORKS : 0);
  const best = Math.max(0, ...Object.values(tally));
  const leaders = council.laws.filter(law => tally[law] === best);
  const board = lawBoard(state);
  const enacted = leaders.length === 1 && best > 0 ? leaders[0] : null;
  board.enacted = enacted;
  board.discard.push(...council.laws.filter(law => law !== enacted));
  // Influential: voters of the enacted law gain 1 influence.
  if (enacted) for (const [voter, law] of Object.entries(council.votes)) if (law === enacted && hasCard(state, voter, "influential")) gainInfluence(state, voter);
  play.councilResult = { id: (play.councilResult?.id ?? 0) + 1, laws: council.laws, tally, enacted };
  play.council = null;
  play.turn = council.activator;
  endTurn(state);
}
