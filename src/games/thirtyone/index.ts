import type { GameModule } from "../types";
import { WORDS } from "./words.generated";
import { DISPLAY_VIEWER } from "../../viewer";

type Team = "red" | "blue";
type Role = "captain" | "player";
type Phase = "lobby" | "draft" | "playing" | "results";
// ready: the describer has not opened the card yet. running: card open (timer and grace happen here).
type TurnPhase = "ready" | "running";

interface Seat {
  id: string;
  username: string;
  team: Team;
  role: Role;
  order: number;
}

interface HistoryEntry {
  team: Team;
  describer: string;
  words: { word: string; correct: boolean }[];
}

export interface ThirtyOneState {
  phase: Phase;
  round: number;
  nextOrder: number;
  seats: Record<string, Seat>;
  pointsToWin: number;
  graceSeconds: number;
  draftTurn: Team;
  scores: Record<Team, number>;
  turn: Team;
  turnPhase: TurnPhase;
  describerId: string | null;
  // Indices into WORDS that have not been dealt yet.
  deck: number[];
  card: string[];
  marks: boolean[];
  endsAt: number;
  judgeAt: number;
  // How many times each team has handed the card to someone, so describing rotates through the team.
  rotation: Record<Team, number>;
  history: HistoryEntry[];
  winner: Team | null;
  recorded?: boolean;
}

export const WORDS_PER_CARD = 7;
export const TURN_SECONDS = 31;
export const DEFAULT_POINTS_TO_WIN = 31;
export const MAX_POINTS_TO_WIN = 200;
export const DEFAULT_GRACE_SECONDS = 3;
export const MAX_GRACE_SECONDS = 15;
const HISTORY_LIMIT = 30;
// Clocks of server and clients differ a little; this keeps the captain from being rejected right at the end of the grace period.
const JUDGE_TOLERANCE_MS = 300;

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

const members = (state: ThirtyOneState, team: Team) => Object.values(state.seats).filter(seat => seat.team === team).sort((a, b) => a.order - b.order);
const captainOf = (state: ThirtyOneState, team: Team) => members(state, team).find(seat => seat.role === "captain");

// The captain of the team that is not describing checks the answers. If that captain is offline, a teammate steps in so the game cannot stall.
function judgeId(state: ThirtyOneState, connected: Set<string>): string | null {
  const team = members(state, other(state.turn));
  const judge = team.find(seat => seat.role === "captain" && connected.has(seat.id)) ?? team.find(seat => connected.has(seat.id));
  return judge?.id ?? null;
}

function drawCard(state: ThirtyOneState) {
  if (state.deck.length < WORDS_PER_CARD) state.deck = shuffle(WORDS.map((_, index) => index));
  state.card = state.deck.splice(0, WORDS_PER_CARD).map(index => WORDS[index]);
  state.marks = state.card.map(() => false);
}

function nextDescriberSeat(state: ThirtyOneState): { seat: Seat; index: number } | null {
  const team = members(state, state.turn);
  const start = state.rotation[state.turn] % team.length;
  for (let step = 0; step < team.length; step++) {
    const index = (start + step) % team.length;
    if (team[index].id !== state.describerId) return { seat: team[index], index };
  }
  return null;
}

// Hands the card to the next member in team order, whether or not they are connected.
function nextDescriber(state: ThirtyOneState) {
  const next = nextDescriberSeat(state);
  if (!next) return;
  state.rotation[state.turn] = next.index + 1;
  state.describerId = next.seat.id;
  state.turnPhase = "ready";
  state.endsAt = 0;
  state.judgeAt = 0;
  drawCard(state);
}

function resetToLobby(state: ThirtyOneState) {
  state.phase = "lobby";
  state.seats = {};
  state.scores = { red: 0, blue: 0 };
  state.describerId = null;
  state.card = [];
  state.marks = [];
  state.turnPhase = "ready";
  state.endsAt = 0;
  state.judgeAt = 0;
  state.history = [];
  state.winner = null;
}

function startGame(state: ThirtyOneState) {
  state.scores = { red: 0, blue: 0 };
  state.rotation = { red: 0, blue: 0 };
  state.history = [];
  state.winner = null;
  state.recorded = false;
  state.turn = "red";
  state.phase = "playing";
  state.round += 1;
  nextDescriber(state);
}

function validateDraftStart(state: ThirtyOneState, pointsToWin: unknown, graceSeconds: unknown): string | null {
  for (const team of ["red", "blue"] as Team[]) {
    if (!captainOf(state, team)) return `The ${team} team needs a captain.`;
  }
  if (typeof pointsToWin !== "number" || !Number.isInteger(pointsToWin) || pointsToWin < 1 || pointsToWin > MAX_POINTS_TO_WIN) {
    return `Points to win must be between 1 and ${MAX_POINTS_TO_WIN}.`;
  }
  if (typeof graceSeconds !== "number" || !Number.isInteger(graceSeconds) || graceSeconds < 0 || graceSeconds > MAX_GRACE_SECONDS) {
    return `The grace period must be between 0 and ${MAX_GRACE_SECONDS} seconds.`;
  }
  return null;
}

function validateGameStart(state: ThirtyOneState): string | null {
  for (const team of ["red", "blue"] as Team[]) {
    if (members(state, team).length < 2) return `The ${team} team needs at least two players: someone to describe and someone to guess.`;
  }
  return null;
}

export const thirtyone: GameModule<ThirtyOneState> = {
  info: {
    id: "thirtyone",
    name: "31 Seconds",
    description: "Two teams describe words to each other against the clock. You are not allowed to use the word itself, or parts of it, even in other language. This game requires the players to be able to hear eachother.",
    maxPlayers: 20
  },
  perViewer: true,

  create: () => ({
    phase: "lobby", round: 0, nextOrder: 0, seats: {}, pointsToWin: DEFAULT_POINTS_TO_WIN, graceSeconds: DEFAULT_GRACE_SECONDS, draftTurn: "red",
    scores: { red: 0, blue: 0 }, turn: "red", turnPhase: "ready", describerId: null, deck: [], card: [], marks: [], endsAt: 0, judgeAt: 0,
    rotation: { red: 0, blue: 0 }, history: [], winner: null
  }),

  migrate(state) {
    const fresh = thirtyone.create();
    for (const key of Object.keys(fresh) as (keyof ThirtyOneState)[]) {
      if (state[key] === undefined) (state as any)[key] = fresh[key];
    }
  },

  handle(state, actor, message, context) {
    const seat = state.seats[actor.userId];
    const now = Date.now();
    const timeIsUp = () => state.turnPhase === "running" && now >= state.judgeAt - JUDGE_TOLERANCE_MS;
    const canJudge = () => judgeId(state, new Set(context.connected.keys())) === actor.userId;

    switch (message.type) {
      case "seat": {
        if (state.phase !== "lobby") return "ignore";
        const { team, role } = message;
        if ((team !== "red" && team !== "blue") || (role !== "captain" && role !== "player")) return "ignore";
        if (role === "captain" && Object.values(state.seats).some(item => item.id !== actor.userId && item.team === team && item.role === "captain")) {
          return { error: `The ${team} team already has a captain.` };
        }
        if (!seat && Object.keys(state.seats).length >= thirtyone.info.maxPlayers) return { error: "The game is full." };
        state.seats[actor.userId] = { id: actor.userId, username: actor.username, team, role, order: seat?.order ?? state.nextOrder++ };
        return "save";
      }
      case "assign": {
        if ((!actor.isHost && !actor.isAdmin) || state.phase !== "playing") return "ignore";
        const { team, userId } = message;
        if ((team !== "red" && team !== "blue") || typeof userId !== "string") return "ignore";
        const username = context.connected.get(userId);
        if (!username || state.seats[userId]) return { error: "That spectator is no longer available." };
        if (Object.keys(state.seats).length >= thirtyone.info.maxPlayers) return { error: "The game is full." };
        state.seats[userId] = { id: userId, username, team, role: "player", order: state.nextOrder++ };
        return "save";
      }
      case "unseat":
        if (state.phase !== "lobby" || !seat) return "ignore";
        delete state.seats[actor.userId];
        return "save";
      case "kick": {
        // The host can remove anyone from their position. During the draft the captains stay, since the draft depends on them.
        const target = typeof message.userId === "string" ? state.seats[message.userId] : undefined;
        if (!actor.isHost || !target || (state.phase !== "lobby" && !(state.phase === "draft" && target.role === "player"))) return "ignore";
        delete state.seats[target.id];
        return "save";
      }
      case "scramble": {
        if (!actor.isHost || state.phase !== "lobby") return "ignore";
        const candidates = [...context.connected].filter(([id]) => !state.seats[id] || state.seats[id].role === "captain");
        if (candidates.length < 2) return { error: "At least two connected people must be available to scramble captains." };
        for (const old of Object.values(state.seats)) if (old.role === "captain") delete state.seats[old.id];
        const picked = shuffle(candidates).slice(0, 2);
        const teams = shuffle<Team>(["red", "blue"]);
        picked.forEach(([id, username], index) => {
          state.seats[id] = { id, username, team: teams[index], role: "captain", order: state.nextOrder++ };
        });
        return "save";
      }
      case "scramble_teams": {
        if (!actor.isHost || state.phase !== "lobby") return "ignore";
        const players = shuffle([...context.connected]);
        if (players.length < 4) return { error: "At least four people must be connected to scramble teams." };
        if (players.length > thirtyone.info.maxPlayers) return { error: `At most ${thirtyone.info.maxPlayers} people can be assigned to teams.` };
        const teams = shuffle<Team>(["red", "blue"]);
        state.seats = {};
        const counts: Record<Team, number> = { red: 1, blue: 1 };
        players.forEach(([id, username], index) => {
          const team = index < 2 ? teams[index] : counts[teams[0]] === counts[teams[1]]
            ? teams[randomInt(2)]
            : counts.red < counts.blue ? "red" : "blue";
          const role = index < 2 ? "captain" : "player";
          state.seats[id] = { id, username, team, role, order: state.nextOrder++ };
          counts[team]++;
        });
        return "save";
      }
      case "start": {
        if (!actor.isHost || state.phase !== "lobby") return "ignore";
        const problem = validateDraftStart(state, message.pointsToWin, message.graceSeconds);
        if (problem) return { error: problem };
        state.pointsToWin = message.pointsToWin as number;
        state.graceSeconds = message.graceSeconds as number;
        state.draftTurn = randomInt(2) === 0 ? "red" : "blue";
        state.phase = "draft";
        return "save";
      }
      case "draft": {
        if (state.phase !== "draft" || !seat || seat.role !== "captain" || seat.team !== state.draftTurn) return "ignore";
        const id = message.userId;
        if (typeof id !== "string") return "ignore";
        const username = context.connected.get(id);
        if (!username || state.seats[id]) return { error: "That player is no longer available." };
        if (Object.keys(state.seats).length >= thirtyone.info.maxPlayers) return { error: "The game is full." };
        state.seats[id] = { id, username, team: seat.team, role: "player", order: state.nextOrder++ };
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
      case "open":
        if (state.phase !== "playing" || state.turnPhase !== "ready" || actor.userId !== state.describerId) return "ignore";
        state.turnPhase = "running";
        state.endsAt = now + TURN_SECONDS * 1000;
        state.judgeAt = state.endsAt + state.graceSeconds * 1000;
        return "save";
      case "stop":
        // The describer can end the clock early, e.g. when all seven words are done.
        if (state.phase !== "playing" || state.turnPhase !== "running" || actor.userId !== state.describerId || now >= state.endsAt) return "ignore";
        state.endsAt = now;
        state.judgeAt = now;
        return "save";
      case "pass_card": {
        if ((!actor.isHost && !actor.isAdmin) || state.phase !== "playing" || state.turnPhase !== "ready") return "ignore";
        if (typeof message.userId !== "string") return { error: "Select a player to receive the card." };
        const team = members(state, state.turn);
        const recipientIndex = team.findIndex(seat => seat.id === message.userId);
        if (recipientIndex < 0 || message.userId === state.describerId) {
          return { error: "That player cannot receive the current card." };
        }
        state.rotation[state.turn] = recipientIndex + 1;
        state.describerId = team[recipientIndex].id;
        return "save";
      }
      case "mark": {
        if (state.phase !== "playing" || !timeIsUp() || !canJudge()) return "ignore";
        const { index } = message;
        if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index >= state.marks.length) return "ignore";
        state.marks[index] = !state.marks[index];
        return "save";
      }
      case "confirm": {
        if (state.phase !== "playing" || !timeIsUp() || !canJudge()) return "ignore";
        const correct = state.marks.filter(Boolean).length;
        const describer = state.seats[state.describerId ?? ""];
        state.scores[state.turn] += correct;
        state.history.push({ team: state.turn, describer: describer?.username ?? "?", words: state.card.map((word, index) => ({ word, correct: state.marks[index] })) });
        if (state.history.length > HISTORY_LIMIT) state.history.shift();
        const { scores, pointsToWin } = state;
        // Red always plays first, so a round is complete after blue's turn. Ties at or above the target go to sudden death.
        let winner: Team | null = null;
        if (state.turn === "blue") {
          if (Math.max(scores.red, scores.blue) >= pointsToWin && scores.red !== scores.blue) winner = scores.red > scores.blue ? "red" : "blue";
        } else if (scores.red >= pointsToWin && scores.blue + WORDS_PER_CARD < scores.red) {
          winner = "red";
        }
        if (winner) {
          state.phase = "results";
          state.winner = winner;
          state.describerId = null;
          return "save";
        }
        state.turn = other(state.turn);
        nextDescriber(state);
        return "save";
      }
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
    // During the draft a captain keeps their seat so the draft can continue after a reconnect.
    const droppable = state.phase === "lobby" || (state.phase === "draft" && seat.role === "player");
    if (!droppable) return false;
    delete state.seats[userId];
    return true;
  },

  participants: state => new Set(Object.keys(state.seats)),

  // Wake up when scoring starts so displays receive the card.
  tickMs: state => (state.phase === "playing" && state.turnPhase === "running" && Date.now() < state.judgeAt ? state.judgeAt - Date.now() + 50 : null),

  tick: state => (state.phase === "playing" && state.turnPhase === "running" && Date.now() >= state.judgeAt ? "volatile" : "ignore"),

  takeResult(state) {
    if (state.phase !== "results" || state.recorded || !state.winner) return null;
    state.recorded = true;
    return {
      players: Object.values(state.seats).map(seat => ({
        userId: seat.id, role: seat.role, won: seat.team === state.winner, score: state.scores[seat.team]
      }))
    };
  },

  snapshot(state, viewerId, connected) {
    const judge = state.seats[judgeId(state, connected) ?? ""];
    // The card is secret: only the describer and the judge may read it, and only once it is open.
    const seesCard = state.phase === "playing" && state.turnPhase === "running" && (viewerId === state.describerId || viewerId === judge?.id
      // Displays only get to see the words once the other team's captain is scoring.
      || (viewerId === DISPLAY_VIEWER && Date.now() >= state.judgeAt));
    const describer = state.seats[state.describerId ?? ""];
    return {
      phase: state.phase,
      round: state.round,
      pointsToWin: state.pointsToWin,
      graceSeconds: state.graceSeconds,
      turnSeconds: TURN_SECONDS,
      wordsPerCard: WORDS_PER_CARD,
      draftTurn: state.draftTurn,
      wordPoolSize: WORDS.length,
      seats: Object.values(state.seats).sort((a, b) => a.order - b.order).map(({ id, username, team, role }) => ({ id, username, team, role, connected: connected.has(id) })),
      scores: state.scores,
      overtime: state.phase === "playing" && Math.max(state.scores.red, state.scores.blue) >= state.pointsToWin,
      turn: state.turn,
      turnPhase: state.turnPhase,
      describer: describer ? { id: describer.id, username: describer.username } : null,
      judge: state.phase === "playing" && judge ? { id: judge.id, username: judge.username } : null,
      card: seesCard ? state.card : null,
      marks: seesCard ? state.marks : null,
      endsAt: state.turnPhase === "running" ? state.endsAt : null,
      judgeAt: state.turnPhase === "running" ? state.judgeAt : null,
      now: Date.now(),
      history: state.history,
      winner: state.winner
    };
  }
};
