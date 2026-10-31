import type { GameModule } from "../types";
import { WORD_CATEGORIES, WORDS } from "./words.generated";

type Team = "red" | "blue";
type Color = Team | "neutral" | "assassin";
type Role = "spymaster" | "operative";
type Phase = "lobby" | "draft" | "playing" | "results";

interface Seat {
  id: string;
  username: string;
  team: Team;
  role: Role;
  order: number;
}

interface Card {
  word: string;
  color: Color;
  revealed: boolean;
}

interface Clue {
  word: string;
  number: number | null; // null = unlimited
  max: number | null; // maximum guesses this turn, null = unlimited
  guesses: number;
}

interface HistoryEntry {
  team: Team;
  clue: string;
  number: number | null;
  guesses: { word: string; color: Color }[];
}

export interface CodenamesState {
  phase: Phase;
  round: number;
  nextOrder: number;
  seats: Record<string, Seat>;
  wordCount: number;
  hintLimit: number;
  // A hint tints one card for a single operative; hintsUsed counts per spymaster.
  hints: { index: number; spymasterId: string; targetId: string }[];
  hintsUsed: Record<string, number>;
  // Operatives flag words they want to guess; visible to their own team, cleared each turn.
  tags?: { index: number; userId: string }[];
  draftTurn: Team;
  board: Card[];
  startTeam: Team;
  turn: Team;
  clue: Clue | null;
  history: HistoryEntry[];
  winner: Team | null;
  endReason: "agents" | "assassin" | null;
  // Statistics bookkeeping: who revealed the assassin, and whether the result was already stored.
  assassinBy?: string | null;
  recorded?: boolean;
  // Team turn timer (spymaster + operatives). Time left when a turn ends early is banked for that team's next turn.
  turnEndsAt: number | null;
  timeBank: Record<Team, number>;
  turnsStarted: Record<Team, number>;
}

export const TURN_MS = 120_000;
export const FIRST_RED_BONUS_MS = 60_000;

export const DEFAULT_WORD_COUNT = 25;
export const DEFAULT_HINT_LIMIT = 3;
export const MAX_HINT_LIMIT = 10;
export const MIN_WORD_COUNT = 9;
export const MAX_WORD_COUNT = 60;
const CLUE_PATTERN = /^[\p{L}][\p{L}'-]{0,29}$/u;

const other = (team: Team): Team => (team === "red" ? "blue" : "red");

function randomInt(max: number) {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer); while (buffer[0] >= limit);
  return buffer[0] % max;
}

function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function pickWordsByCategory(count: number): string[] {
  const categories = shuffle(Object.values(WORD_CATEGORIES)
    .filter(words => words.length > 0)
    .map(words => shuffle([...words])));
  const selected: string[] = [];

  while (selected.length < count) {
    let progressed = false;
    for (const words of categories) {
      if (selected.length >= count) break;
      if (words.length === 0) continue;

      const remaining = count - selected.length;
      const available = Math.min(words.length, remaining, 6);
      const amount = available < 3 ? available : 3 + randomInt(available - 2);
      selected.push(...words.splice(0, amount));
      progressed = true;
    }
    if (!progressed) break;
  }

  return shuffle(selected);
}

// 25 words: 9 + 8 agents, 7 bystanders, 1 assassin. Other sizes keep the same proportions.
function distribution(count: number) {
  const second = Math.round(count * 0.32);
  return { first: second + 1, second, assassin: 1, neutral: count - 2 * second - 2 };
}

const remaining = (state: CodenamesState, team: Team) => state.board.filter(card => card.color === team && !card.revealed).length;

function resetToLobby(state: CodenamesState) {
  state.phase = "lobby";
  state.seats = {};
  state.board = [];
  state.clue = null;
  state.history = [];
  state.winner = null;
  state.endReason = null;
}

function startGame(state: CodenamesState) {
  const wordCount = state.wordCount;
  const words = pickWordsByCategory(wordCount);
  const startTeam: Team = "red";
  const { first, second, assassin, neutral } = distribution(wordCount);
  const colors: Color[] = shuffle([
    ...Array<Color>(first).fill(startTeam),
    ...Array<Color>(second).fill(other(startTeam)),
    ...Array<Color>(neutral).fill("neutral"),
    ...Array<Color>(assassin).fill("assassin")
  ]);
  state.board = words.map((word, index) => ({ word, color: colors[index], revealed: false }));
  state.wordCount = wordCount;
  state.hints = [];
  state.hintsUsed = {};
  state.startTeam = startTeam;
  state.turn = startTeam;
  state.clue = null;
  state.history = [];
  state.winner = null;
  state.endReason = null;
  state.recorded = false;
  state.assassinBy = null;
  state.timeBank = { red: 0, blue: 0 };
  state.turnsStarted = { red: 0, blue: 0 };
  state.phase = "playing";
  state.round += 1;
  startTurnTimer(state);
}

function startTurnTimer(state: CodenamesState, now = Date.now()) {
  const team = state.turn;
  const bonus = team === state.startTeam && !state.turnsStarted[team] ? FIRST_RED_BONUS_MS : 0;
  state.turnEndsAt = now + TURN_MS + bonus + (state.timeBank[team] ?? 0);
  state.timeBank[team] = 0;
  state.turnsStarted[team] = (state.turnsStarted[team] ?? 0) + 1;
}

function endTurn(state: CodenamesState, now = Date.now()) {
  // Only half of the unused time is carried over.
  if (state.turnEndsAt) state.timeBank[state.turn] = Math.floor(Math.max(0, state.turnEndsAt - now) / 2);
  state.turn = other(state.turn);
  state.clue = null;
  state.tags = [];
  startTurnTimer(state, now);
}

function finish(state: CodenamesState, winner: Team, reason: "agents" | "assassin") {
  state.phase = "results";
  state.winner = winner;
  state.endReason = reason;
  state.clue = null;
}

function validateDraftStart(state: CodenamesState, wordCount: unknown): string | null {
  for (const team of ["red", "blue"] as Team[]) {
    if (!Object.values(state.seats).some(seat => seat.team === team && seat.role === "spymaster")) return `The ${team} team needs a spymaster.`;
  }
  if (typeof wordCount !== "number" || !Number.isInteger(wordCount) || wordCount < MIN_WORD_COUNT || wordCount > MAX_WORD_COUNT) {
    return `Choose between ${MIN_WORD_COUNT} and ${MAX_WORD_COUNT} words.`;
  }
  if (wordCount > WORDS.length) return `Only ${WORDS.length} words are available.`;
  return null;
}

function validateGameStart(state: CodenamesState): string | null {
  for (const team of ["red", "blue"] as Team[]) {
    if (!Object.values(state.seats).some(seat => seat.team === team && seat.role === "operative")) return `The ${team} team needs at least one operative.`;
  }
  return null;
}

function clueConflicts(state: CodenamesState, clue: string) {
  const lower = clue.toLowerCase();
  return state.board.some(card => !card.revealed && (card.word.toLowerCase() === lower || card.word.toLowerCase().split(" ").includes(lower)));
}

export const codenames: GameModule<CodenamesState> = {
  info: {
    id: "codenames",
    name: "Woerdgoem",
    description: "The spymaster gives one-word clues; operatives guess the words belonging to the clue. Avoid the black card.",
    maxPlayers: 20
  },
  perViewer: true,

  create: () => ({
    phase: "lobby", round: 0, nextOrder: 0, seats: {}, wordCount: DEFAULT_WORD_COUNT, hintLimit: DEFAULT_HINT_LIMIT, hints: [], hintsUsed: {}, draftTurn: "red", board: [], startTeam: "red", turn: "red",
    clue: null, history: [], winner: null, endReason: null,
    turnEndsAt: null, timeBank: { red: 0, blue: 0 }, turnsStarted: { red: 0, blue: 0 }
  }),

  migrate(state) {
    const fresh = codenames.create();
    for (const key of Object.keys(fresh) as (keyof CodenamesState)[]) {
      if (state[key] === undefined) (state as any)[key] = fresh[key];
    }
    if (state.phase === "playing" && !state.turnEndsAt) startTurnTimer(state);
  },

  tickMs: state => (state.phase === "playing" && state.turnEndsAt ? Math.max(0, state.turnEndsAt - Date.now()) + 50 : null),

  tick(state) {
    if (state.phase !== "playing" || !state.turnEndsAt || Date.now() < state.turnEndsAt) return "ignore";
    state.timeBank[state.turn] = 0;
    endTurn(state);
    return "save";
  },

  handle(state, actor, message, context) {
    const seat = state.seats[actor.userId];

    switch (message.type) {
      case "seat": {
        if (state.phase !== "lobby") return "ignore";
        const { team, role } = message;
        if ((team !== "red" && team !== "blue") || (role !== "spymaster" && role !== "operative")) return "ignore";
        if (role === "spymaster" && Object.values(state.seats).some(other => other.id !== actor.userId && other.team === team && other.role === "spymaster")) {
          return { error: `The ${team} team already has a spymaster.` };
        }
        if (!seat && Object.keys(state.seats).length >= codenames.info.maxPlayers) return { error: "The game is full." };
        state.seats[actor.userId] = { id: actor.userId, username: actor.username, team, role, order: seat?.order ?? state.nextOrder++ };
        return "save";
      }
      case "assign": {
        if (!actor.isHost || state.phase !== "playing") return "ignore";
        const { team, userId } = message;
        if ((team !== "red" && team !== "blue") || typeof userId !== "string") return "ignore";
        const username = context.connected.get(userId);
        if (!username || state.seats[userId]) return { error: "That spectator is no longer available." };
        if (Object.keys(state.seats).length >= codenames.info.maxPlayers) return { error: "The game is full." };
        state.seats[userId] = { id: userId, username, team, role: "operative", order: state.nextOrder++ };
        return "save";
      }
      case "unseat":
        if (state.phase !== "lobby" || !seat) return "ignore";
        delete state.seats[actor.userId];
        return "save";
      case "kick": {
        // The host can remove anyone from their position. During the draft the spymasters stay, since the draft depends on them.
        const target = typeof message.userId === "string" ? state.seats[message.userId] : undefined;
        if (!actor.isHost || !target || (state.phase !== "lobby" && !(state.phase === "draft" && target.role === "operative"))) return "ignore";
        delete state.seats[target.id];
        return "save";
      }
      case "scramble": {
        if (!actor.isHost || state.phase !== "lobby") return "ignore";
        const candidates = [...context.connected].filter(([id]) => !state.seats[id] || state.seats[id].role === "spymaster");
        if (candidates.length < 2) return { error: "At least two connected people must be available to scramble spymasters." };
        for (const old of Object.values(state.seats)) if (old.role === "spymaster") delete state.seats[old.id];
        const picked = shuffle(candidates).slice(0, 2);
        const teams = shuffle<Team>(["red", "blue"]);
        picked.forEach(([id, username], index) => {
          state.seats[id] = { id, username, team: teams[index], role: "spymaster", order: state.nextOrder++ };
        });
        return "save";
      }
      case "scramble_teams": {
        if (!actor.isHost || state.phase !== "lobby") return "ignore";
        const players = shuffle([...context.connected]);
        if (players.length < 4) return { error: "At least four people must be connected to scramble teams." };
        if (players.length > codenames.info.maxPlayers) return { error: `At most ${codenames.info.maxPlayers} people can be assigned to teams.` };
        const teams = shuffle<Team>(["red", "blue"]);
        state.seats = {};
        const counts: Record<Team, number> = { red: 1, blue: 1 };
        players.forEach(([id, username], index) => {
          const team = index < 2 ? teams[index] : counts[teams[0]] === counts[teams[1]]
            ? teams[randomInt(2)]
            : counts.red < counts.blue ? "red" : "blue";
          const role = index < 2 ? "spymaster" : "operative";
          state.seats[id] = { id, username, team, role, order: state.nextOrder++ };
          counts[team]++;
        });
        return "save";
      }
      case "start": {
        if (!actor.isHost || state.phase !== "lobby") return "ignore";
        const problem = validateDraftStart(state, message.wordCount);
        if (problem) return { error: problem };
        const limit = message.hintLimit;
        if (typeof limit !== "number" || !Number.isInteger(limit) || limit < 0 || limit > MAX_HINT_LIMIT) return { error: `Hints per spymaster must be between 0 and ${MAX_HINT_LIMIT}.` };
        state.wordCount = message.wordCount as number;
        state.hintLimit = limit;
        state.draftTurn = randomInt(2) === 0 ? "red" : "blue";
        state.phase = "draft";
        return "save";
      }
      case "draft": {
        if (state.phase !== "draft" || !seat || seat.role !== "spymaster" || seat.team !== state.draftTurn) return "ignore";
        const id = message.userId;
        if (typeof id !== "string") return "ignore";
        const username = context.connected.get(id);
        if (!username || state.seats[id]) return { error: "That player is no longer available." };
        if (Object.keys(state.seats).length >= codenames.info.maxPlayers) return { error: "The game is full." };
        state.seats[id] = { id, username, team: seat.team, role: "operative", order: state.nextOrder++ };
        state.draftTurn = other(state.draftTurn);
        return "save";
      }
      case "begin": {
        if (!actor.isHost || state.phase !== "draft") return "ignore";
        const problem = validateGameStart(state);
        if (problem) return { error: problem };
        startGame(state);
        return "save";
      }
      case "hint": {
        if (state.phase !== "playing" || !seat || seat.role !== "spymaster" || seat.team !== state.turn) return "ignore";
        const { index } = message;
        if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index >= state.board.length) return "ignore";
        const card = state.board[index];
        if (card.revealed) return "ignore";
        if (card.color !== other(seat.team)) return { error: "You can only hint at one of the other team's agents." };
        if (state.hints.some(hint => hint.index === index && state.seats[hint.targetId]?.team === seat.team)) return { error: "That word already has a hint." };
        const used = state.hintsUsed[seat.id] ?? 0;
        if (used >= state.hintLimit) return { error: "You have no hints left." };
        const operatives = Object.values(state.seats).filter(item => item.team === seat.team && item.role === "operative" && context.connected.has(item.id));
        if (operatives.length === 0) return { error: "No operative on your team is connected." };
        const target = operatives[randomInt(operatives.length)];
        state.hints.push({ index, spymasterId: seat.id, targetId: target.id });
        state.hintsUsed[seat.id] = used + 1;
        return "save";
      }
      case "tag": {
        if (state.phase !== "playing" || !seat || seat.role !== "operative" || seat.team !== state.turn) return "ignore";
        const { index } = message;
        if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index >= state.board.length || state.board[index].revealed) return "ignore";
        const tags = state.tags ?? (state.tags = []);
        const existing = tags.findIndex(tag => tag.index === index && tag.userId === seat.id);
        if (existing >= 0) tags.splice(existing, 1);
        else tags.push({ index, userId: seat.id });
        return "save";
      }
      case "clue": {
        if (state.phase !== "playing" || state.clue || !seat || seat.role !== "spymaster" || seat.team !== state.turn) return "ignore";
        const word = typeof message.word === "string" ? message.word.trim() : "";
        if (!CLUE_PATTERN.test(word)) return { error: "A clue must be a single word." };
        const { number } = message;
        if (number !== null && !(typeof number === "number" && Number.isInteger(number) && number >= 0 && number <= 9)) return { error: "The number must be 0-9 or unlimited." };
        if (clueConflicts(state, word)) return { error: "A clue cannot be a word that is on the board." };
        state.clue = { word, number, max: number !== null && number >= 1 ? number + 1 : null, guesses: 0 };
        state.history.push({ team: state.turn, clue: word, number, guesses: [] });
        return "save";
      }
      case "guess": {
        if (state.phase !== "playing" || !state.clue || !seat || seat.role !== "operative" || seat.team !== state.turn) return "ignore";
        const { index } = message;
        if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index >= state.board.length) return "ignore";
        const card = state.board[index];
        if (card.revealed) return "ignore";
        card.revealed = true;
        state.history[state.history.length - 1].guesses.push({ word: card.word, color: card.color });

        if (card.color === "assassin") {
          state.assassinBy = actor.userId;
          finish(state, other(state.turn), "assassin");
        } else if ((card.color === "red" || card.color === "blue") && remaining(state, card.color) === 0) {
          finish(state, card.color, "agents");
        } else if (card.color === state.turn) {
          state.clue.guesses += 1;
          if (state.clue.max !== null && state.clue.guesses >= state.clue.max) endTurn(state);
        } else {
          endTurn(state);
        }
        return "save";
      }
      case "endturn":
        if (state.phase !== "playing" || !state.clue || !seat || seat.role !== "operative" || seat.team !== state.turn) return "ignore";
        endTurn(state);
        return "save";
      case "exit":
        if (!actor.isHost || state.phase !== "results") return "ignore";
        resetToLobby(state);
        return "save";
      case "abort":
        if (!actor.isHost || (state.phase !== "playing" && state.phase !== "draft")) return "ignore";
        resetToLobby(state);
        return "save";
      default:
        return "ignore";
    }
  },

  disconnect(state, userId) {
    const seat = state.seats[userId];
    if (!seat) return false;
    // During the draft a spymaster keeps their seat so the draft can continue after a reconnect.
    const droppable = state.phase === "lobby" || (state.phase === "draft" && seat.role === "operative");
    if (!droppable) return false;
    delete state.seats[userId];
    return true;
  },

  participants: state => new Set(Object.keys(state.seats)),

  takeResult(state) {
    if (state.phase !== "results" || state.recorded || !state.winner) return null;
    state.recorded = true;
    return {
      players: Object.values(state.seats).map(seat => ({
        userId: seat.id,
        role: seat.role,
        won: seat.team === state.winner,
        flag: state.assassinBy === seat.id
      }))
    };
  },

  snapshot(state, viewerId, connected) {
    const viewer = state.seats[viewerId];
    const seeKey = state.phase === "results" || viewer?.role === "spymaster";
    return {
      phase: state.phase,
      round: state.round,
      wordCount: state.wordCount,
      draftTurn: state.draftTurn,
      seats: Object.values(state.seats).sort((a, b) => a.order - b.order).map(({ id, username, team, role }) => ({ id, username, team, role, connected: connected.has(id) })),
      hintLimit: state.hintLimit,
      hintsLeft: viewer?.role === "spymaster" ? Math.max(0, state.hintLimit - (state.hintsUsed?.[viewerId] ?? 0)) : null,
      // "received" is only ever sent to the one operative who was hinted; "given" only to the spymaster who gave it.
      board: state.board.map((card, index) => {
        const hint = card.revealed ? undefined : state.hints.find(item => item.index === index && (item.targetId === viewerId || item.spymasterId === viewerId));
        return {
          word: card.word,
          revealed: card.revealed,
          color: card.revealed || seeKey ? card.color : null,
          hint: hint ? (hint.targetId === viewerId ? "received" : "given") : null,
          tags: card.revealed ? [] : (state.tags ?? []).filter(tag => tag.index === index && state.seats[tag.userId]).map(tag => state.seats[tag.userId].username),
          hintTeam: hint && state.seats[viewerId] ? other(state.seats[viewerId].team) : null,
          // Only the spymaster who gave the hint learns who received it.
          hintTo: hint && hint.targetId !== viewerId ? state.seats[hint.targetId]?.username ?? null : null
        };
      }),
      turn: state.turn,
      startTeam: state.startTeam,
      clue: state.clue && { word: state.clue.word, number: state.clue.number, max: state.clue.max, guesses: state.clue.guesses },
      history: state.history,
      winner: state.winner,
      endReason: state.endReason,
      remaining: state.phase === "lobby" || state.phase === "draft" ? null : { red: remaining(state, "red"), blue: remaining(state, "blue") },
      turnEndsAt: state.phase === "playing" ? state.turnEndsAt : null,
      timeBank: state.phase === "playing" ? state.timeBank : null,
      now: Date.now(),
      wordPoolSize: WORDS.length
    };
  }
};
