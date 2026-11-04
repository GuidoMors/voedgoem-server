import { addItem, hasCard } from "./cards";
import { cardById } from "./cards.data";
import { characterAbilityHolder } from "./neutrals";
import { characterById, naturalOrder } from "./draft";
import { endTurn } from "./play";
import { eventOrder } from "./commonwealth";
import { nextInt, shuffle } from "./rng";
import { SUBTERFUGE_CARDS, TACTICS_CARDS } from "./tactics.data";
import { PUBLIC_ZONE, RESEARCH_ZONE, makePublic } from "./tech";
import { removeItem, treatyType } from "./treaties";
import type { Army, BarterGoods, BarterOffer, Item, KinState, ReactionState, SubterfugeBoard, TacticsBoard } from "./types";

// Tactics and Subterfuge (24-tactics-subterfuge.md). The Tactician event auctions a card of the tactics deck. Tactics cards are
// held open in a court and played for a one-time effect. A secret tactics card gives a hidden subterfuge card that triggers by itself.

export interface TacticsCard {
  id: string;
  name: string;
  text: string;
}

export const TACTICS: readonly TacticsCard[] = TACTICS_CARDS;

export const SUBTERFUGE: readonly TacticsCard[] = SUBTERFUGE_CARDS;

const SECRET = "secret";

export const cardName = (id: string) => id === SECRET ? "Secret tactics card" : [...TACTICS, ...SUBTERFUGE].find(card => card.id === id)?.name ?? id;

export const tacticsBoard = (state: KinState): TacticsBoard =>
  state.tactics ??= { deck: [], discard: [], hands: {}, shuffled: { tactics: false, secret: false }, archeologists: [] };

export const subterfugeBoard = (state: KinState): SubterfugeBoard =>
  state.subterfuge ??= { deck: shuffle(state.rng, SUBTERFUGE.map(card => card.id)), discard: [], hands: {} };

const gold = (state: KinState, player: string) => state.players[player].resources.gold ?? 0;
const name = (state: KinState, player: string) => state.players[player].username;

export function announce(state: KinState, text: string) {
  const play = state.play!;
  play.notice = { id: (play.notice?.id ?? 0) + 1, text };
}

// The players who know a Science: only the owner when it is in a court, everybody when it is public.
export function knowers(state: KinState, tech: string): string[] {
  const item = state.items.find(candidate => candidate.def === tech);
  if (!item || item.zone === RESEARCH_ZONE) return [];
  if (item.zone === PUBLIC_ZONE) return naturalOrder(state);
  return item.zone.startsWith("court:") ? [item.zone.slice("court:".length)] : [];
}

// Researching a Science shuffles its cards into the tactics deck.
function syncDeck(state: KinState) {
  const board = tacticsBoard(state);
  const add: string[] = [];
  if (!board.shuffled.tactics && knowers(state, "tactician-science").length > 0) {
    board.shuffled.tactics = true;
    add.push(...TACTICS.map(card => card.id));
  }
  if (!board.shuffled.secret && knowers(state, "subterfuge-science").length > 0) {
    board.shuffled.secret = true;
    add.push(...SUBTERFUGE.map(() => SECRET));
  }
  if (add.length > 0) board.deck = shuffle(state.rng, [...board.deck, ...add]);
}

// Draws from a deck; when it is empty the discard pile is shuffled into it. Nothing is drawn when both are empty.
function draw(state: KinState, pile: { deck: string[]; discard: string[] }): string | null {
  if (pile.deck.length === 0 && pile.discard.length > 0) {
    pile.deck = shuffle(state.rng, pile.discard);
    pile.discard = [];
  }
  return pile.deck.pop() ?? null;
}

export function drawSubterfuge(state: KinState, player: string) {
  const board = subterfugeBoard(state);
  const card = draw(state, board);
  if (card) (board.hands[player] ??= []).push(card);
}

export const tacticsOf = (state: KinState, player: string): string[] => state.tactics?.hands[player] ?? [];
export const subterfugeOf = (state: KinState, player: string): string[] => state.subterfuge?.hands[player] ?? [];

// --- The Tactician event and its auction ---

// The players who may bid on a card, in bidding order. With Finders Keepers you bid first for a regular tactics card.
export function bidders(state: KinState, card: string): string[] {
  const know = knowers(state, card === SECRET ? "subterfuge-science" : "tactician-science");
  const order = naturalOrder(state).filter(player => know.includes(player));
  if (card === SECRET) return order;
  const first = order.filter(player => hasCard(state, player, "finders-keepers"));
  return [...first, ...order.filter(player => !first.includes(player))];
}

export function canAuction(state: KinState): boolean {
  syncDeck(state);
  const board = tacticsBoard(state);
  if (board.deck.length + board.discard.length === 0) return false;
  const eligible = [...knowers(state, "tactician-science"), ...knowers(state, "subterfuge-science")];
  return eligible.some(player => gold(state, player) >= 1);
}

// Claims the top card of the tactics deck. A secret tactics card is discarded and gives a subterfuge card. Null when no card is left.
export function claimTactic(state: KinState, player: string): string | null {
  syncDeck(state);
  const board = tacticsBoard(state);
  const card = draw(state, board);
  if (!card) return null;
  if (card === SECRET) {
    board.discard.push(card);
    drawSubterfuge(state, player);
  } else (board.hands[player] ??= []).push(card);
  return card;
}

export function tacticsDeckSize(state: KinState): number {
  syncDeck(state);
  const board = tacticsBoard(state);
  return board.deck.length + board.discard.length;
}

// Rohdrimbral, Counterfuge: the owner (untapped) who may discard a secret tactics card that was drawn for an auction.
const counterfugeOwner = (state: KinState, card: string): string | null => {
  if (card !== SECRET) return null;
  return state.order.find(player => {
    const holder = characterAbilityHolder(state, player, "rohdrimbral");
    return !!holder && !state.cards[holder].tapped;
  }) ?? null;
};

export function startAuction(state: KinState, activator: string) {
  const card = draw(state, tacticsBoard(state))!;
  const owner = counterfugeOwner(state, card);
  // The owner is asked first; the auction goes on when they answered (see counterfuge).
  if (owner) state.play!.consent = { player: activator, owner, building: "", counterfuge: card };
  else beginAuction(state, activator, card);
}

export function counterfuge(state: KinState, accept: boolean) {
  const play = state.play!;
  const consent = play.consent!;
  let card = consent.counterfuge!;
  play.consent = null;
  if (accept) {
    const holder = characterAbilityHolder(state, consent.owner, "rohdrimbral");
    if (holder) state.cards[holder].tapped = true;
    tacticsBoard(state).discard.push(card);
    card = draw(state, tacticsBoard(state))!;
    announce(state, `${name(state, consent.owner)}'s Rohdrimbral discarded the secret tactics card with Counterfuge; a new card was drawn.`);
  }
  beginAuction(state, consent.player, card);
}

function beginAuction(state: KinState, activator: string, card: string) {
  const owner = bidders(state, card).find(player => gold(state, player) >= 1 && hasCard(state, player, "cautious-schemer"));
  if (owner) {
    state.play!.schemer = { player: owner, activator, event: "tactician", card };
    state.play!.turn = owner;
    return;
  }
  resumeAuction(state, activator, card);
}

export function resumeAuction(state: KinState, activator: string, card: string) {
  const play = state.play!;
  const board = tacticsBoard(state);
  const order = eventOrder(state, bidders(state, card).filter(player => gold(state, player) >= 1));
  if (order.length === 0) {
    board.discard.push(card);
    play.auctionResult = { id: (play.auctionResult?.id ?? 0) + 1, card, winner: null, bid: 0 };
    return endTurn(state);
  }
  play.auction = { activator, card, order, active: [...order], bid: 0, leader: null };
  play.passes = 0;
  play.turn = order[0];
}

export function validateBid(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const auction = state.play?.auction;
  if (!auction) return "No auction is being held.";
  if (state.play!.turn !== player) return "It is not your turn to bid.";
  const amount = action.amount;
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 1) return "Bid a whole number of gold; bidding starts at 1.";
  if (amount <= auction.bid) return `Bid more than ${auction.bid} gold.`;
  return amount <= gold(state, player) ? null : "You do not have that much gold.";
}

export function bid(state: KinState, player: string, action: Record<string, unknown>) {
  const auction = state.play!.auction!;
  auction.bid = action.amount as number;
  auction.leader = player;
  advance(state, player);
}

export function validateFold(state: KinState, player: string): string | null {
  if (!state.play?.auction) return "No auction is being held.";
  return state.play.turn === player ? null : "It is not your turn to bid.";
}

export function fold(state: KinState, player: string) {
  const auction = state.play!.auction!;
  auction.active = auction.active.filter(other => other !== player);
  advance(state, player);
}

// Those who cannot outbid the highest bid drop out. The next rival bids; when no rival is left the auction is won.
function advance(state: KinState, from: string) {
  const auction = state.play!.auction!;
  auction.active = auction.active.filter(player => player === auction.leader || gold(state, player) > auction.bid);
  const rivals = auction.active.filter(player => player !== auction.leader);
  if (rivals.length === 0) return finishAuction(state);
  const start = auction.order.indexOf(from);
  for (let step = 1; step <= auction.order.length; step++) {
    const next = auction.order[(start + step) % auction.order.length];
    if (rivals.includes(next)) {
      state.play!.turn = next;
      return;
    }
  }
}

function finishAuction(state: KinState) {
  const play = state.play!;
  const auction = play.auction!;
  const board = tacticsBoard(state);
  play.auction = null;
  const quantum = auction.leader && auction.card === SECRET && hasCard(state, auction.leader, "quantum-collapse") ? quantumOptions(state) : [];
  if (auction.leader) {
    state.players[auction.leader].resources.gold = gold(state, auction.leader) - auction.bid;
    if (auction.card === SECRET) {
      board.discard.push(auction.card);
      if (quantum.length < 2) drawSubterfuge(state, auction.leader);
    } else (board.hands[auction.leader] ??= []).push(auction.card);
  } else board.discard.push(auction.card);
  play.auctionResult = { id: (play.auctionResult?.id ?? 0) + 1, card: auction.card, winner: auction.leader, bid: auction.bid };
  // Quantum Collapse: the winner of a secret bid chooses which subterfuge card to draw.
  if (quantum.length >= 2) {
    play.quantum = { player: auction.leader!, kind: "subterfuge", options: quantum, pick: 1, activator: auction.activator };
    play.turn = auction.leader!;
    return;
  }
  play.turn = auction.activator;
  endTurn(state);
}

const quantumOptions = (state: KinState): string[] => {
  const board = subterfugeBoard(state);
  return [...new Set([...board.deck, ...board.discard])];
};

// --- Playing tactics cards ---

export interface TargetChoice {
  id: string;
  label: string;
}

const courtOf = (item: Item) => item.zone.startsWith("court:") ? item.zone.slice("court:".length) : null;

// The targets a tactics card could take now; null for a card without a target.
export function tacticTargets(state: KinState, player: string, card: string): TargetChoice[] | null {
  switch (card) {
    case "diplomatic-maneuvering":
      return state.items.filter(item => treatyType(item.def) && courtOf(item)).map(item => ({
        id: item.id,
        label: `${cardById(item.def)?.name} in ${name(state, courtOf(item)!)}'s court${item.giver ? `, given by ${name(state, item.giver)}` : ""}`
      }));
    case "alchemical-plague":
      return Object.values(state.cards).filter(character => character.owner && !character.tapped).map(character => ({
        id: character.id,
        label: `${characterById(character.def)?.name ?? character.def} in ${name(state, character.owner!)}'s court`
      }));
    case "blackmail":
      return state.armies.filter(army => army.strength <= 3).map(army => ({ id: army.id, label: `Army ${army.id} of ${name(state, army.owner)} (strength ${army.strength})` }));
    case "shoulders-of-giants":
      return state.items.filter(item => cardById(item.def)?.kind === "technology" && courtOf(item) && item.def !== "steampower").map(item => ({
        id: item.id,
        label: `${cardById(item.def)?.name} in ${name(state, courtOf(item)!)}'s court`
      }));
    default:
      return null;
  }
}

const PLAYABLE_PHASES = ["discovery", "expansion", "control"];

export function tacticOptions(state: KinState, player: string): { card: string; targets: TargetChoice[] | null; playable: boolean }[] {
  const board = tacticsBoard(state);
  return tacticsOf(state, player).filter(card => card !== "graphiscope").map(card => {
    const targets = tacticTargets(state, player, card);
    const playable = card === "great-archeologist" ? !board.archeologists.includes(player) : (targets?.length ?? 0) > 0;
    return { card, targets, playable };
  });
}

export const hasPlayableTactic = (state: KinState, player: string) => tacticOptions(state, player).some(option => option.playable);

export function validatePlayTactic(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const play = state.play;
  if (!play) return "The game is not being played yet.";
  if (play.turn !== player) return "It is not your turn.";
  if (play.move || play.barter || play.battle || play.council || play.auction || play.quantum || play.consent) return "Finish what is in progress first.";
  if (!PLAYABLE_PHASES.includes(play.phase)) return "Tactics cards can be played in the Discovery, Expansion and Control phases.";
  const option = tacticOptions(state, player).find(candidate => candidate.card === action.card);
  if (!option) return "You do not hold that tactics card.";
  if (!option.playable) return "That card has no target right now.";
  if (option.targets && !option.targets.some(target => target.id === action.target)) return "Choose a valid target.";
  return null;
}

export function discardTactic(state: KinState, player: string, card: string) {
  const board = tacticsBoard(state);
  const hand = board.hands[player] ?? [];
  const index = hand.indexOf(card);
  if (index >= 0) hand.splice(index, 1);
  board.discard.push(card);
}

// Who the effect of a tactics card falls on.
function victimOf(state: KinState, card: string, target: string): string | null {
  if (card === "diplomatic-maneuvering") return state.items.find(item => item.id === target)?.owner ?? null;
  if (card === "alchemical-plague") return state.cards[target]?.owner ?? null;
  if (card === "blackmail") return state.armies.find(army => army.id === target)?.owner ?? null;
  return null;
}

// The same kind of target, in the court of the player who played the card; used when Retaliation turns an effect around.
function retaliationTarget(state: KinState, player: string, card: string): string | null {
  return tacticTargets(state, player, card)?.find(choice => {
    if (card === "diplomatic-maneuvering") return state.items.find(item => item.id === choice.id)?.owner === player;
    if (card === "alchemical-plague") return state.cards[choice.id]?.owner === player;
    return state.armies.find(army => army.id === choice.id)?.owner === player;
  })?.id ?? null;
}

// Retaliation in a player's hand: the card is spent and true is returned.
function retaliates(state: KinState, player: string): boolean {
  const board = subterfugeBoard(state);
  const hand = board.hands[player] ?? [];
  const index = hand.indexOf("retaliation");
  if (index < 0) return false;
  hand.splice(index, 1);
  board.discard.push("retaliation");
  return true;
}

function disband(state: KinState, army: Army) {
  state.armies = state.armies.filter(other => other !== army);
}

function applyTactic(state: KinState, card: string, target: string) {
  if (card === "diplomatic-maneuvering") removeItem(state, state.items.find(item => item.id === target)!);
  else if (card === "alchemical-plague") state.cards[target].tapped = true;
  else if (card === "blackmail") disband(state, state.armies.find(army => army.id === target)!);
  else if (card === "shoulders-of-giants") makePublic(state, state.items.find(item => item.id === target)!);
}

// The card goes to the discard pile; the turn is not used. Retaliation turns an effect against another player around.
export function playTactic(state: KinState, player: string, action: Record<string, unknown>) {
  const card = String(action.card);
  let target = String(action.target ?? "");
  const label = tacticTargets(state, player, card)?.find(choice => choice.id === target)?.label;
  discardTactic(state, player, card);
  if (card === "great-archeologist") {
    tacticsBoard(state).archeologists.push(player);
    return announce(state, `${name(state, player)} played ${cardName(card)}: their Explore this round has the outcome they choose.`);
  }
  const victim = victimOf(state, card, target);
  if (victim && victim !== player && retaliates(state, victim)) {
    const own = retaliationTarget(state, player, card);
    if (own) applyTactic(state, card, own);
    return announce(state, `${name(state, player)} played ${cardName(card)} on ${label}, but ${name(state, victim)} played Retaliation: ${own ? "it hit them instead" : "it had no effect"}.`);
  }
  applyTactic(state, card, target);
  announce(state, `${name(state, player)} played ${cardName(card)}: ${label}.`);
}

// --- Subterfuge ---

const VEIL = "veil-of-the-deep";

const nonEmpty = (goods: BarterGoods) => Object.values(goods.resources).some(amount => amount > 0) || goods.characters.length > 0 || goods.treaties.length > 0;

function spend(state: KinState, player: string, card: string) {
  const board = subterfugeBoard(state);
  board.hands[player].splice(board.hands[player].indexOf(card), 1);
  board.discard.push(card);
}

// Effect of a barter card, from `by` against `other`.
function barterEffect(state: KinState, card: string, by: string, other: string) {
  if (card === "reconnaissance") {
    for (const item of state.items.filter(candidate => cardById(candidate.def)?.kind === "technology" && candidate.zone === `court:${other}` && candidate.def !== "steampower")) makePublic(state, item);
    const board = tacticsBoard(state);
    board.hands[by] = [...(board.hands[by] ?? []), ...(board.hands[other] ?? [])];
    board.hands[other] = [];
  } else if (card === "bank-heist") {
    const loot = gold(state, other);
    state.players[other].resources.gold = 0;
    state.players[by].resources.gold = gold(state, by) + loot;
  } else if (card === "feigned-allegiance") {
    for (const item of state.items.filter(candidate => candidate.def === "faction-treaty" && candidate.zone === `court:${other}` && candidate.giver === by)) removeItem(state, item);
    addItem(state, "faction-treaty", `court:${by}`, by, other);
  } else if (card === "trojan-trade") {
    for (const character of Object.values(state.cards)) if (character.owner === other) character.tapped = true;
  }
}

// After a successful Barter the subterfuge cards of the two players trigger when their condition holds.
export function onBarter(state: KinState, offer: BarterOffer) {
  const defs = [...offer.give.treaties, ...offer.take.treaties].map(id => state.items.find(item => item.id === id)?.def).concat(offer.mint.map(entry => entry.def));
  for (const holder of [offer.from, offer.to]) {
    const other = holder === offer.from ? offer.to : offer.from;
    const gives = holder === offer.from ? offer.give : offer.take;
    const gets = holder === offer.from ? offer.take : offer.give;
    const mintGives = offer.mint.some(entry => (entry.giver === "from") === (holder === offer.from));
    const mintGets = offer.mint.some(entry => (entry.giver === "from") !== (holder === offer.from));
    const conditions: Record<string, boolean> = {
      reconnaissance: defs.includes("access-treaty") || defs.includes("promise-treaty"),
      "bank-heist": (gives.resources.gold ?? 0) > 0,
      "feigned-allegiance": defs.includes("faction-treaty") && !state.items.some(item => item.def === "faction-treaty" && item.zone === `court:${holder}` && item.giver === other)
        && state.items.some(item => item.def === "faction-treaty" && item.zone === `court:${other}` && item.giver === holder),
      "trojan-trade": (nonEmpty(gives) || mintGives) && !nonEmpty(gets) && !mintGets
    };
    for (const card of [...subterfugeOf(state, holder)]) {
      if (!conditions[card] || !subterfugeOf(state, holder).includes(card)) continue;
      if (hasCard(state, other, VEIL)) continue;
      spend(state, holder, card);
      const turned = retaliates(state, other);
      barterEffect(state, card, turned ? other : holder, turned ? holder : other);
      announce(state, `${name(state, holder)} played ${cardName(card)} against ${name(state, other)}${turned ? ", but " + name(state, other) + " played Retaliation: it hit them instead" : ""}.`);
    }
  }
}

// Counterattack: when the defender is attacked, the attacking army loses up to 3 strength. Returns true when that disbands it,
// which skips the effects of the Battle.
export function counterattack(state: KinState, defender: string, attacker: string, army: Army): boolean {
  if (!subterfugeOf(state, defender).includes("counterattack") || hasCard(state, attacker, VEIL)) return false;
  spend(state, defender, "counterattack");
  army.strength = Math.max(0, army.strength - 3);
  const gone = army.strength === 0;
  if (gone) disband(state, army);
  announce(state, `${name(state, defender)} played Counterattack against ${name(state, attacker)}: the attacking army loses 3 strength.`);
  return gone;
}

// Dolomor Darkeye (Deep Ones): after winning a Battle as the attacking general, `by` selects a subterfuge card the opponent holds (they do
// not see which one it is) and activates its effect against them, whatever its condition. The Veil blocks it.
export function dolomorReaction(state: KinState, by: string, other: string): ReactionState | null {
  const held = subterfugeOf(state, other);
  if (held.length === 0 || hasCard(state, other, VEIL)) return null;
  return {
    kind: "dolomor", owner: by, title: "Cunning Deception",
    text: `Dolomor Darkeye: activate one of ${name(state, other)}'s ${held.length} hidden subterfuge card${held.length === 1 ? "" : "s"} against them, or decline.`,
    options: held.map((_, index) => ({ id: String(index), label: `Hidden card ${index + 1}` })), min: 0, max: 1
  };
}

// Activates the selected card. The barter cards work on their own; Counterattack lets `by` pick an army of the opponent that loses
// 3 strength (a follow-up reaction); Retaliation has nothing to turn around and is only discarded.
export function dolomorActivate(state: KinState, by: string, other: string, index: number): ReactionState | null {
  const card = subterfugeOf(state, other)[index];
  if (!card || hasCard(state, other, VEIL)) return null;
  spend(state, other, card);
  announce(state, `${name(state, by)}'s Dolomor Darkeye activated ${cardName(card)} against ${name(state, other)}.`);
  if (card === "counterattack") {
    const armies = state.armies.filter(army => army.owner === other);
    if (armies.length === 0) return null;
    return {
      kind: "dolomor-army", owner: by, title: "Counterattack", text: `Choose the army of ${name(state, other)} that loses up to 3 strength.`,
      options: armies.map(army => ({ id: army.id, label: `Army of strength ${army.strength}${army.tile >= 0 ? ` on tile ${army.tile}` : ""}` })), min: 1, max: 1
    };
  }
  if (card !== "retaliation") barterEffect(state, card, by, other);
  return null;
}

export function dolomorStrike(state: KinState, armyId: string) {
  const army = state.armies.find(candidate => candidate.id === armyId);
  if (!army) return;
  army.strength = Math.max(0, army.strength - 3);
  if (army.strength === 0) disband(state, army);
}