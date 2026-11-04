import type { GameModule } from "../types";
import { STARTER_CLOCKS, normalizeClock, validClock, type PassTimeClock, type PassTimeRule } from "./clocks";

type Phase = "lobby" | "deliberation" | "playing" | "results";
type GameStep = "cards" | "hand-move";
type Color = "black" | "white";

interface Card {
  id: string;
  value: number;
  color: Color;
}

interface Seat {
  id: string;
  username: string;
  order: number;
  handOwner: string;
}

interface HuddleMessage {
  id: string;
  userId: string;
  username: string;
  text: string;
  createdAt: number;
}

interface PassTimeState {
  phase: Phase;
  step: GameStep;
  nextOrder: number;
  seats: Record<string, Seat>;
  huddleMessages: Record<string, HuddleMessage[]>;
  clock: PassTimeClock | null;
  lobbyClock: PassTimeClock | null;
  originalClock: PassTimeClock | null;
  handBoundary: number;
  cards: Card[];
  dealtIds: string[];
  dealtHands: Record<string, string[]>;
  undealtIds: string[];
  hands: Record<string, string[]>;
  pendingHands: Record<string, string[]>;
  dealStage: number;
  board: string[][];
  faceUpIds: string[];
  placements: { cardId: string; segment: number; turnNumber: number; playerId: string | null }[];
  currentPlayerId: string | null;
  lastPlayerId: string | null;
  turnNumber: number;
  hintsRemaining: number;
  passedHandMove: string[];
  handMoveEndsAt: number | null;
  outcome: "won" | "lost" | null;
  outcomeReason: string | null;
  recorded?: boolean;
}

const MAX_PLAYERS = 12;
const HINTS_PER_ATTEMPT = 4;
const HAND_MOVE_MS = 20_000;

function randomInt(max: number) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer); while (buffer[0] >= limit);
  return buffer[0] % max;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getCard(state: PassTimeState, id: string) {
  return state.cards.find(card => card.id === id);
}

function cardTotal(state: PassTimeState, ids: string[]) {
  return ids.reduce((total, id) => total + (getCard(state, id)?.value ?? 0), 0);
}

function allRules(state: PassTimeState) {
  return [...(state.clock?.globalRules ?? []), ...(state.clock?.rules.flat() ?? [])];
}

function hasRotation(state: PassTimeState) {
  return allRules(state).some(rule => rule.type === "rotate");
}

function finish(state: PassTimeState, outcome: "won" | "lost", reason: string) {
  state.phase = "results";
  state.outcome = outcome;
  state.outcomeReason = reason;
  state.step = "cards";
  state.currentPlayerId = null;
  state.handMoveEndsAt = null;
  state.huddleMessages = {};
  state.recorded = false;
}

function rotateRules(state: PassTimeState, direction: "clockwise" | "counter-clockwise") {
  const rules = state.clock?.rules;
  if (!rules) return;
  const next = Array.from({ length: 6 }, () => [] as PassTimeRule[]);
  for (let index = 0; index < 6; index++) {
    const target = (index + (direction === "clockwise" ? 1 : 5)) % 6;
    next[target] = rules[index];
  }
  state.clock!.rules = next;
}

function resolvePlacement(state: PassTimeState, cardId: string, segment: number, playerId: string | null, turnNumber: number) {
  state.board[segment].push(cardId);
  state.placements.push({ cardId, segment, turnNumber, playerId });
  if (cardTotal(state, state.board[segment]) > 24) {
    finish(state, "lost", `Segment ${segment + 1} exceeded the maximum total of 24.`);
    return;
  }
  const rotation = state.clock!.rules[segment].find(item => item.type === "rotate");
  if (rotation?.type === "rotate") rotateRules(state, rotation.direction);
}

function resolveDraws(state: PassTimeState) {
  const processed = new Set<string>();
  while (state.phase !== "results") {
    let pending: { id: string; segment: number } | null = null;
    for (let segment = 0; segment < 6 && !pending; segment++) {
      const rule = state.clock!.rules[segment].find(item => item.type === "draw" && !processed.has(item.id));
      if (rule) pending = { id: rule.id, segment };
    }
    if (!pending) break;
    const cardId = state.undealtIds.pop();
    if (!cardId) {
      finish(state, "lost", "There were not enough undealt cards for all DRAW rules.");
      return;
    }
    processed.add(pending.id);
    resolvePlacement(state, cardId, pending.segment, null, 0);
  }
}

function nextPlayer(state: PassTimeState, fromId: string | null) {
  const seats = Object.values(state.seats).sort((a, b) => a.order - b.order);
  if (!seats.length) return null;
  const fromIndex = fromId ? seats.findIndex(seat => seat.id === fromId) : -1;
  for (let offset = 1; offset <= seats.length; offset++) {
    const seat = seats[(fromIndex + offset + seats.length) % seats.length];
    if ((state.hands[seat.handOwner] ?? []).length) return seat.id;
  }
  return null;
}

function startHandMove(state: PassTimeState) {
  state.step = "hand-move";
  state.currentPlayerId = null;
  state.passedHandMove = [];
  state.handMoveEndsAt = Date.now() + HAND_MOVE_MS;
}

function revealAndEvaluate(state: PassTimeState) {
  if (!state.clock || state.phase !== "playing") return;
  const totals = state.board.map(segment => cardTotal(state, segment));
  for (let segment = 0; segment < 6; segment++) {
    if (state.board[segment].length === 0) {
      finish(state, "lost", `Segment ${segment + 1} has no cards.`);
      return;
    }
  }
  const clockRules = state.clock.rules;
  if (state.clock.globalRules?.some(rule => rule.type === "clock-two-cards")
    && state.board.some(segment => segment.length !== 2)) {
    finish(state, "lost", "The CLOCK 2 CARDS rule was not satisfied.");
    return;
  }
  const start = state.handBoundary;
  for (let offset = 1; offset < 6; offset++) {
    const previous = (start + offset - 1) % 6;
    const current = (start + offset) % 6;
    if (totals[current] < totals[previous]) {
      finish(state, "lost", `The incremental-value rule fails between Segments ${previous + 1} and ${current + 1}.`);
      return;
    }
  }
  const playerCards = new Set(state.dealtIds);
  const cardById = new Map(state.cards.map(card => [card.id, card]));
  for (let segment = 0; segment < 6; segment++) {
    const ids = state.board[segment];
    const rules = clockRules[segment];
    const cards = ids.map(id => cardById.get(id)!).filter(Boolean);
    for (const rule of rules) {
      switch (rule.type) {
        case "no-number":
          if (cards.some(card => Math.abs(card.value - rule.value) <= 1)) {
            finish(state, "lost", `Segment ${segment + 1} violates NO ${rule.value}.`);
            return;
          }
          break;
        case "nothing":
          break;
        case "most":
          if (ids.length <= Math.max(...state.board.filter((_, index) => index !== segment).map(other => other.length))) {
            finish(state, "lost", `Segment ${segment + 1} does not contain strictly more cards than every other segment.`);
            return;
          }
          break;
        case "sum-near":
          if (Math.abs(totals[segment] - rule.value) > 1) {
            finish(state, "lost", `Segment ${segment + 1} must total ${rule.value - 1}, ${rule.value}, or ${rule.value + 1}.`);
            return;
          }
          break;
        case "composition": {
          const black = cards.filter(card => card.color === "black").length;
          const white = cards.filter(card => card.color === "white").length;
          if (black !== rule.black || white !== rule.white) {
            finish(state, "lost", `Segment ${segment + 1} does not match its required card colors.`);
            return;
          }
          break;
        }
        case "card-count":
          if (ids.length !== rule.count) {
            finish(state, "lost", `Segment ${segment + 1} must contain exactly ${rule.count} cards.`);
            return;
          }
          break;
        case "turn-number":
          for (const number of rule.numbers) {
            const placement = state.placements.find(item => item.turnNumber === number);
            if (!placement || placement.segment !== segment) {
              finish(state, "lost", `Player-played card #${number} was not placed in Segment ${segment + 1}.`);
              return;
            }
          }
          break;
        case "extreme-card": {
          const dealt = state.cards.filter(card => playerCards.has(card.id) && card.color === rule.color);
          if (!dealt.length) {
            finish(state, "lost", `There was no dealt ${rule.color} card for the rule in Segment ${segment + 1}.`);
            return;
          }
          const target = dealt.reduce((best, card) => rule.extreme === "highest"
            ? card.value > best.value ? card : best
            : card.value < best.value ? card : best);
          if (!ids.includes(target.id)) {
            finish(state, "lost", `The ${rule.extreme} ${rule.color} card is not in Segment ${segment + 1}.`);
            return;
          }
          break;
        }
      }
    }
  }
  finish(state, "won", "Every clock rule was satisfied.");
}

function deal(state: PassTimeState) {
  const cards: Card[] = [];
  for (const color of ["black", "white"] as const) {
    for (let value = 1; value <= 12; value++) cards.push({ id: `${color}-${value}`, color, value });
  }
  state.cards = shuffle(cards);
  const dealt = state.cards.slice(0, 12);
  state.dealtIds = dealt.map(card => card.id);
  state.dealtHands = {};
  state.undealtIds = state.cards.slice(12).map(card => card.id);
  state.hands = {};
  state.pendingHands = {};
  state.dealStage = 1;
  const seats = Object.values(state.seats).sort((a, b) => a.order - b.order);
  if (seats.length > 6) {
    const originals = seats.slice(0, 6);
    seats.forEach((seat, index) => {
      seat.handOwner = index < 6 ? seat.id : originals[(index - 6) % 6].id;
    });
  } else {
    seats.forEach(seat => { seat.handOwner = seat.id; });
  }
  const owners = [...new Set(seats.map(seat => seat.handOwner))];
  for (const owner of owners) {
    state.hands[owner] = [];
    state.dealtHands[owner] = [];
  }
  const assignCard = (owner: string, cardId: string, hand: string[]) => {
    hand.push(cardId);
    state.dealtHands[owner].push(cardId);
  };
  if (seats.length === 2) {
    state.dealStage = 0;
    dealt.forEach((card, index) => {
      const owner = seats[index % 2].handOwner;
      assignCard(owner, card.id, index < 6 ? state.hands[owner] : (state.pendingHands[owner] ??= []));
    });
  } else if (seats.length > 6) {
    const originalSeats = seats.slice(0, 6);
    dealt.forEach((card, index) => {
      const owner = originalSeats[index % 6].id;
      assignCard(owner, card.id, state.hands[owner]);
    });
  } else {
    dealt.forEach((card, index) => {
      const owner = seats[index % seats.length].handOwner;
      assignCard(owner, card.id, state.hands[owner]);
    });
  }
  state.board = Array.from({ length: 6 }, () => []);
  state.faceUpIds = [];
  state.placements = [];
  state.turnNumber = 0;
  state.lastPlayerId = null;
  state.hintsRemaining = HINTS_PER_ATTEMPT;
}

function startAttempt(state: PassTimeState, clock: PassTimeClock) {
  state.clock = normalizeClock(clock, clock.id);
  state.phase = "playing";
  state.step = "cards";
  state.outcome = null;
  state.outcomeReason = null;
  state.recorded = false;
  deal(state);
  resolveDraws(state);
}

function openHandMoveIfDone(state: PassTimeState) {
  if (Object.values(state.hands).some(hand => hand.length > 0)) return false;
  if (state.dealStage === 0) {
    for (const [owner, cards] of Object.entries(state.pendingHands)) state.hands[owner].push(...cards);
    state.dealStage = 1;
    state.currentPlayerId = nextPlayer(state, state.lastPlayerId);
    return true;
  }
  startHandMove(state);
  return true;
}

function canPlace(state: PassTimeState, card: Card, segment: number): string | null {
  const rules = state.clock!.rules[segment];
  if (rules.some(rule => rule.type === "nothing")) return "That segment is unavailable while NOTHING is there.";
  if (!hasRotation(state)) {
    const rule = rules.find(item => item.type === "no-number");
    if (rule?.type === "no-number" && Math.abs(card.value - rule.value) <= 1) return `That card cannot be placed in the NO ${rule.value} segment.`;
  }
  return null;
}

function requiredTurnSegment(state: PassTimeState, turnNumber: number) {
  const index = state.clock?.rules.findIndex(rules =>
    rules.some(rule => rule.type === "turn-number" && rule.numbers.includes(turnNumber))
  ) ?? -1;
  return index < 0 ? null : index;
}

export const passTime: GameModule<PassTimeState> = {
  info: {
    id: "pass-time",
    name: "Pass Time",
    description: "A cooperative hidden-card game of clockwork, quiet teamwork, and carefully balanced segments.",
    maxPlayers: MAX_PLAYERS
  },
  perViewer: true,

  create: () => ({
    phase: "lobby", step: "cards", nextOrder: 0, seats: {}, huddleMessages: {}, clock: null, lobbyClock: null, originalClock: null, handBoundary: 0,
    cards: [], dealtIds: [], dealtHands: {}, undealtIds: [], hands: {}, pendingHands: {}, dealStage: 1,
    board: Array.from({ length: 6 }, () => []), faceUpIds: [], placements: [], currentPlayerId: null,
    lastPlayerId: null, turnNumber: 0, hintsRemaining: HINTS_PER_ATTEMPT, passedHandMove: [],
    handMoveEndsAt: null, outcome: null, outcomeReason: null
  }),

  migrate(state) {
    state.step ??= "cards";
    state.lobbyClock ??= null;
    state.nextOrder ??= Object.keys(state.seats ?? {}).length;
    state.huddleMessages ??= {};
    state.pendingHands ??= {};
    state.dealtIds ??= [];
    state.dealStage ??= 1;
    state.faceUpIds ??= [];
    state.placements ??= [];
    state.lastPlayerId ??= null;
    state.hintsRemaining ??= HINTS_PER_ATTEMPT;
    state.passedHandMove ??= [];
    state.handMoveEndsAt ??= null;
    if (!state.dealtHands || (Object.keys(state.dealtHands).length === 0 && state.dealtIds.length > 0)) {
      const ownerByCard = new Map<string, string>();
      for (const placement of state.placements) {
        const owner = placement.playerId ? state.seats[placement.playerId]?.handOwner : undefined;
        if (owner && state.dealtIds.includes(placement.cardId)) ownerByCard.set(placement.cardId, owner);
      }
      for (const [owner, ids] of Object.entries(state.hands)) {
        for (const id of ids) ownerByCard.set(id, owner);
      }
      for (const [owner, ids] of Object.entries(state.pendingHands)) {
        for (const id of ids) ownerByCard.set(id, owner);
      }
      state.dealtHands = {};
      for (const id of state.dealtIds) {
        const owner = ownerByCard.get(id);
        if (owner) (state.dealtHands[owner] ??= []).push(id);
      }
    }
  },

  tickMs: state => state.phase === "playing" && state.step === "hand-move" && state.handMoveEndsAt
    ? Math.max(0, state.handMoveEndsAt - Date.now())
    : null,

  tick(state) {
    if (state.phase !== "playing" || state.step !== "hand-move" || !state.handMoveEndsAt || Date.now() < state.handMoveEndsAt) return "ignore";
    revealAndEvaluate(state);
    return "save";
  },

  handle(state, actor, message, context) {
    const seat = state.seats[actor.userId];
    switch (message.type) {
      case "join":
        if (state.phase !== "lobby" || seat) return "ignore";
        if (!context.connected.has(actor.userId) && !actor.userId.startsWith("bot-")) return "ignore";
        if (Object.keys(state.seats).length >= MAX_PLAYERS) return { error: "Pass Time supports at most 12 players." };
        state.seats[actor.userId] = { id: actor.userId, username: actor.username, order: state.nextOrder++, handOwner: actor.userId };
        return "save";
      case "leave":
      case "unseat":
        if (state.phase !== "lobby" || !seat) return "ignore";
        delete state.seats[actor.userId];
        return "save";
      case "kick": {
        const target = typeof message.userId === "string" ? state.seats[message.userId] : undefined;
        if (!actor.isHost || state.phase !== "lobby" || !target) return "ignore";
        delete state.seats[target.id];
        return "save";
      }
      case "huddle_send": {
        if (state.phase !== "playing" || !seat || typeof message.text !== "string") return "ignore";
        const text = message.text.trim();
        const paired = Object.values(state.seats).some(other => other.id !== seat.id && other.handOwner === seat.handOwner);
        if (!paired) return { error: "Huddle is only available to players who share a hand." };
        if (!text || text.length > 300) return { error: "Huddle messages must be 1-300 characters." };
        const messages = (state.huddleMessages[seat.handOwner] ??= []);
        messages.push({ id: crypto.randomUUID(), userId: seat.id, username: seat.username, text, createdAt: Date.now() });
        if (messages.length > 100) messages.splice(0, messages.length - 100);
        return "save";
      }
      case "set_order": {
        if (!actor.isAdmin || state.phase !== "lobby" || !Array.isArray(message.userIds)) return "ignore";
        const ids = Object.keys(state.seats);
        const ordered = message.userIds.map(String);
        if (ordered.length !== ids.length || new Set(ordered).size !== ids.length || ordered.some(id => !ids.includes(id))) return { error: "Provide every player exactly once in seating order." };
        ordered.forEach((id, order) => { state.seats[id].order = order; });
        state.nextOrder = ordered.length;
        return "save";
      }
      case "select_clock": {
        if (!actor.isHost || state.phase !== "lobby" || !validClock(message.clock)) return "ignore";
        if (message.handBoundary !== undefined
          && (!Number.isInteger(message.handBoundary) || Number(message.handBoundary) < 0 || Number(message.handBoundary) > 5)) {
          return { error: "Choose one of the six clock boundaries." };
        }
        state.lobbyClock = normalizeClock(message.clock, message.clock.id);
        if (message.handBoundary !== undefined) state.handBoundary = Number(message.handBoundary);
        return "save";
      }
      case "start": {
        if (!actor.isHost || state.phase !== "lobby") return "ignore";
        if (Object.keys(state.seats).length < 2) return { error: "At least two players must join before starting." };
        if (!validClock(message.clock)) return { error: "Choose a valid clock from the catalog." };
        if (message.handBoundary !== undefined && (!Number.isInteger(message.handBoundary) || Number(message.handBoundary) < 0 || Number(message.handBoundary) > 5)) return { error: "Choose one of the six clock boundaries." };
        state.clock = normalizeClock(message.clock, message.clock.id);
        state.lobbyClock = state.clock;
        state.originalClock = normalizeClock(message.clock, message.clock.id);
        state.handBoundary = Number(message.handBoundary ?? state.handBoundary);
        state.phase = "deliberation";
        return "save";
      }
      case "set_hand":
        if (!actor.isHost || state.phase !== "deliberation" || !Number.isInteger(message.boundary) || Number(message.boundary) < 0 || Number(message.boundary) > 5) return "ignore";
        state.handBoundary = Number(message.boundary);
        return "save";
      case "begin":
        if (!actor.isHost || state.phase !== "deliberation" || !state.clock) return "ignore";
        startAttempt(state, state.clock);
        return "save";
      case "play": {
        const firstCardCanBePlayedByAnyone = state.currentPlayerId === null && state.turnNumber === 0;
        if (state.phase !== "playing" || state.step !== "cards" || !seat
          || (!firstCardCanBePlayedByAnyone && state.currentPlayerId !== actor.userId)) return "ignore";
        if (!Number.isInteger(message.segment) || Number(message.segment) < 0 || Number(message.segment) > 5 || typeof message.cardId !== "string") return { error: "Choose a card and one of the six clock segments." };
        const owner = seat.handOwner;
        const hand = state.hands[owner] ?? [];
        const cardIndex = hand.indexOf(message.cardId);
        if (cardIndex < 0) return { error: "That card is not in your hand." };
        const card = getCard(state, message.cardId);
        if (!card) return { error: "That card is no longer available." };
        const segment = Number(message.segment);
        const requiredSegment = requiredTurnSegment(state, state.turnNumber + 1);
        if (requiredSegment !== null && segment !== requiredSegment) {
          return { error: `Player-played card #${state.turnNumber + 1} must be placed in Segment ${requiredSegment + 1}.` };
        }
        const problem = canPlace(state, card, segment);
        if (problem) return { error: problem };
        if (message.hint === true && (state.hintsRemaining <= 0 || state.clock?.globalRules?.some(rule => rule.type === "no-hint"))) return { error: "No hints are available for this clock." };
        hand.splice(cardIndex, 1);
        state.turnNumber++;
        if (message.hint === true) {
          state.hintsRemaining--;
          state.faceUpIds.push(card.id);
        }
        state.lastPlayerId = actor.userId;
        resolvePlacement(state, card.id, segment, actor.userId, state.turnNumber);
        if ((state.phase as Phase) === "results") return "save";
        if (openHandMoveIfDone(state)) return "save";
        state.currentPlayerId = nextPlayer(state, actor.userId);
        return "save";
      }
      case "hand_move":
        if (state.phase !== "playing" || state.step !== "hand-move" || !seat || !Number.isInteger(message.boundary) || Number(message.boundary) < 0 || Number(message.boundary) > 5) return "ignore";
        if (Number(message.boundary) !== state.handBoundary) {
          state.handBoundary = Number(message.boundary);
          revealAndEvaluate(state);
          return "save";
        }
        return { error: "Choose a different boundary to move the hand, or pass." };
      case "pass_hand_move":
        if (state.phase !== "playing" || state.step !== "hand-move" || !seat || state.passedHandMove.includes(actor.userId)) return "ignore";
        state.passedHandMove.push(actor.userId);
        if (state.passedHandMove.length >= Object.keys(state.seats).length) revealAndEvaluate(state);
        return "save";
      case "end_game":
        if (!actor.isHost || state.phase !== "playing") return "ignore";
        finish(state, "lost", "The host ended the game.");
        return "save";
      case "retry":
        if (!actor.isHost || state.phase !== "results" || !state.clock) return "ignore";
        state.phase = "deliberation";
        state.step = "cards";
        state.outcome = null;
        state.outcomeReason = null;
        state.hintsRemaining = HINTS_PER_ATTEMPT;
        state.handMoveEndsAt = null;
        state.passedHandMove = [];
        state.clock = normalizeClock(state.originalClock ?? state.clock, state.clock.id);
        return "save";
      case "back_to_lobby":
        if (!actor.isHost || state.phase !== "results") return "ignore";
        state.phase = "lobby";
        state.clock = null;
        state.originalClock = null;
        state.cards = [];
        state.dealtIds = [];
        state.dealtHands = {};
        state.undealtIds = [];
        state.hands = {};
        state.pendingHands = {};
        state.board = Array.from({ length: 6 }, () => []);
        state.faceUpIds = [];
        state.placements = [];
        state.outcome = null;
        state.outcomeReason = null;
        state.currentPlayerId = null;
        state.huddleMessages = {};
        for (const seat of Object.values(state.seats)) seat.handOwner = seat.id;
        return "save";
      default:
        return "ignore";
    }
  },

  disconnect: () => false,
  participants: state => new Set(Object.keys(state.seats)),

  takeResult(state) {
    if (state.phase !== "results" || state.recorded) return null;
    state.recorded = true;
    return { players: Object.values(state.seats).map(seat => ({ userId: seat.id, role: "player", won: state.outcome === "won" })) };
  },

  snapshot(state, viewerId, connected) {
    const seat = state.seats[viewerId];
    const cardById = new Map(state.cards.map(card => [card.id, card]));
    const revealAll = state.phase === "results";
    const visible = new Set([...state.faceUpIds, ...(revealAll ? state.cards.map(card => card.id) : [])]);
    const revealCard = (id: string) => {
      const card = cardById.get(id);
      if (!card) return { id, value: null, color: null, faceUp: false };
      return visible.has(id)
        ? { id, value: card.value, color: card.color, faceUp: true }
        : { id, value: null, color: card.color, faceUp: false };
    };
    const activeHand = seat && state.phase === "playing" && state.step === "cards"
      ? (state.hands[seat.handOwner] ?? []).map(id => cardById.get(id)).filter((card): card is Card => !!card)
      : [];
    const resultDealtHands = state.phase === "results"
      ? Object.entries(state.dealtHands).map(([ownerId, ids]) => ({
        ownerId,
        playerIds: Object.values(state.seats).filter(item => item.handOwner === ownerId).map(item => item.id),
        cards: ids.map(revealCard)
      }))
      : null;
    const dealtIdSet = new Set(state.dealtIds);
    return {
      game: "pass-time",
      phase: state.phase === "deliberation" ? "draft" : state.phase,
      gameStep: state.step,
      maxPlayers: MAX_PLAYERS,
      seats: Object.values(state.seats).sort((a, b) => a.order - b.order).map(item => ({
        id: item.id, username: item.username, order: item.order, connected: connected.has(item.id),
        pairedWith: Object.values(state.seats).find(other => other.id !== item.id && other.handOwner === item.handOwner)?.id ?? null
      })),
      huddleMessages: seat && Object.values(state.seats).some(other => other.id !== seat.id && other.handOwner === seat.handOwner)
        ? state.huddleMessages[seat.handOwner] ?? []
        : [],
      isPlayer: !!seat,
      currentPlayerId: state.currentPlayerId,
      clock: state.clock,
      lobbyClock: state.lobbyClock,
      starterClocks: STARTER_CLOCKS,
      handBoundary: state.handBoundary,
      hand: activeHand.map(card => ({ id: card.id, value: card.value, color: card.color })),
      board: state.board.map(ids => ids.map(revealCard)),
      totalPlaced: state.placements.length,
      turnNumber: state.turnNumber,
      hintsRemaining: state.hintsRemaining,
      hintAllowed: !!seat && state.phase === "playing" && state.step === "cards" && !state.clock?.globalRules?.some(rule => rule.type === "no-hint") && state.hintsRemaining > 0,
      passedHandMove: state.passedHandMove,
      handMoveEndsAt: state.handMoveEndsAt,
      outcome: state.phase === "results" ? state.outcome : null,
      outcomeReason: state.phase === "results" ? state.outcomeReason : null,
      results: state.phase === "results" ? {
        dealtHands: resultDealtHands ?? [],
        undealtCards: state.cards.filter(card => !dealtIdSet.has(card.id)).map(card => revealCard(card.id))
      } : null,
      options: {
        join: state.phase === "lobby" && !seat && Object.keys(state.seats).length < MAX_PLAYERS,
        leave: state.phase === "lobby" && !!seat,
        start: state.phase === "lobby" && Object.keys(state.seats).length >= 2,
        begin: state.phase === "deliberation",
        play: state.phase === "playing" && state.step === "cards" && !!seat
          && (state.currentPlayerId === viewerId
            || (state.currentPlayerId === null && state.turnNumber === 0 && (state.hands[seat.handOwner] ?? []).length > 0)),
        handMove: state.phase === "playing" && state.step === "hand-move" && !!seat && !state.passedHandMove.includes(viewerId),
        retry: state.phase === "results",
        backToLobby: state.phase === "results"
      }
    };
  }
};
