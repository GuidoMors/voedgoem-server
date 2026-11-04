import type { GameModule } from "../types";
import { WORDLE_WORDS } from "./words.generated";

type TeamId = "red" | "blue";
type Phase = "lobby" | "playing" | "ending" | "results";

interface Seat {
  id: string;
  username: string;
  team: TeamId;
  order: number;
}

interface GuessRecord {
  guess: string;
  result: ("correct" | "present" | "absent")[];
}

interface Feedback {
  puzzleId: number;
  guess: string;
  result: GuessRecord["result"];
  solved: boolean;
  resolveAt: number;
}

interface TeamState {
  remainingMs: number;
  lastTickAt: number;
  locked: boolean;
  timeAtStopMs: number | null;
  solved: number[];
  guesses: number;
  queues: Record<string, number[]>;
  current: Record<string, number | null>;
  history: Record<string, GuessRecord[]>;
  feedback: Record<string, Feedback | null>;
}

interface WordleState {
  phase: Phase;
  nextOrder: number;
  seats: Record<string, Seat>;
  words: string[];
  teams: Record<TeamId, TeamState>;
  resultAt: number | null;
  winner: TeamId | "draw" | null;
  resultRecorded: boolean;
}

const TEAM_IDS: TeamId[] = ["red", "blue"];
const ROUND_MS = 15 * 60_000;
const PENALTY_MS = 60_000;
const FEEDBACK_MS = 1_500;
const END_REVEAL_MS = 5_000;
const TICK_MS = 250;

function emptyTeam(now: number): TeamState {
  return {
    remainingMs: ROUND_MS,
    lastTickAt: now,
    locked: false,
    timeAtStopMs: null,
    solved: [],
    guesses: 0,
    queues: {},
    current: {},
    history: {},
    feedback: {}
  };
}

function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function teamMembers(state: WordleState, team: TeamId): Seat[] {
  return Object.values(state.seats).filter(seat => seat.team === team).sort((a, b) => a.order - b.order);
}

function lockTeam(team: TeamState, remainingMs: number) {
  team.remainingMs = Math.max(0, remainingMs);
  team.locked = true;
  team.timeAtStopMs = team.remainingMs;
}

function remainingAt(team: TeamState, now: number): number {
  if (team.locked) return team.remainingMs;
  return Math.max(0, team.remainingMs - Math.max(0, now - team.lastTickAt));
}

function evaluateGuess(answer: string, guess: string): GuessRecord["result"] {
  const result: GuessRecord["result"] = Array(5).fill("absent");
  const remaining = new Map<string, number>();
  for (let index = 0; index < 5; index++) {
    if (guess[index] === answer[index]) result[index] = "correct";
    else remaining.set(answer[index], (remaining.get(answer[index]) ?? 0) + 1);
  }
  for (let index = 0; index < 5; index++) {
    if (result[index] === "correct") continue;
    const count = remaining.get(guess[index]) ?? 0;
    if (count > 0) {
      result[index] = "present";
      remaining.set(guess[index], count - 1);
    }
  }
  return result;
}

function dealTeam(state: WordleState, teamId: TeamId) {
  const team = state.teams[teamId];
  const members = teamMembers(state, teamId);
  const puzzleIds = shuffled(state.words.map((_, index) => index));
  members.forEach(member => {
    team.queues[member.id] = [];
    team.current[member.id] = null;
    team.feedback[member.id] = null;
  });
  puzzleIds.forEach((puzzleId, index) => {
    const member = members[index % members.length];
    team.queues[member.id].push(puzzleId);
  });
  for (const member of members) {
    team.current[member.id] = team.queues[member.id].shift() ?? null;
  }
}

function activateNext(team: TeamState, userId: string) {
  if (team.locked || team.feedback[userId] || team.current[userId] !== null) return;
  team.current[userId] = team.queues[userId]?.shift() ?? null;
}

function circulateFeedback(state: WordleState, teamId: TeamId, userId: string, feedback: Feedback) {
  const team = state.teams[teamId];
  team.feedback[userId] = null;
  team.current[userId] = null;
  if (!feedback.solved && !team.solved.includes(feedback.puzzleId)) {
    const members = teamMembers(state, teamId);
    const currentIndex = members.findIndex(member => member.id === userId);
    const next = members[(currentIndex + 1) % members.length];
    team.queues[next.id].push(feedback.puzzleId);
  }
  activateNext(team, userId);
  for (const member of teamMembers(state, teamId)) activateNext(team, member.id);
}

function finishMatch(state: WordleState, now: number) {
  if (state.phase !== "playing" || TEAM_IDS.some(id => !state.teams[id].locked)) return;
  const [red, blue] = TEAM_IDS.map(id => state.teams[id]);
  state.winner = red.solved.length !== blue.solved.length
    ? red.solved.length > blue.solved.length ? "red" : "blue"
    : red.guesses !== blue.guesses
      ? red.guesses < blue.guesses ? "red" : "blue"
      : (red.timeAtStopMs ?? 0) !== (blue.timeAtStopMs ?? 0)
        ? (red.timeAtStopMs ?? 0) > (blue.timeAtStopMs ?? 0) ? "red" : "blue"
        : "draw";
  state.phase = "ending";
  state.resultAt = now + END_REVEAL_MS;
}

function advance(state: WordleState, now: number): boolean {
  let changed = false;
  if (state.phase === "playing") {
    for (const id of TEAM_IDS) {
      const team = state.teams[id];
      if (team.locked) continue;
      const remaining = remainingAt(team, now);
      team.lastTickAt = now;
      if (remaining === 0) {
        lockTeam(team, 0);
        changed = true;
      } else {
        team.remainingMs = remaining;
      }
    }
    for (const id of TEAM_IDS) {
      const team = state.teams[id];
      for (const [userId, feedback] of Object.entries(team.feedback)) {
        if (feedback && feedback.resolveAt <= now) {
          circulateFeedback(state, id, userId, feedback);
          changed = true;
        }
      }
    }
    finishMatch(state, now);
  } else if (state.phase === "ending" && state.resultAt !== null && state.resultAt <= now) {
    state.phase = "results";
    changed = true;
  }
  return changed;
}

function startError(state: WordleState): string | null {
  for (const team of TEAM_IDS) {
    const size = teamMembers(state, team).length;
    if (size === 0) return `The ${team} team needs at least one player.`;
    if (size > 10) return `The ${team} team may have at most 10 players.`;
  }
  return null;
}

export function wordleResult(answer: string, guess: string) {
  return evaluateGuess(answer, guess);
}

export const wordlePvp: GameModule<WordleState> = {
  info: {
    id: "wordle-pvp",
    name: "Wordle PvP",
    description: "Race as a team to solve the same ten Wordle puzzles before your timer runs out.",
    maxPlayers: 20,
    maxUsers: 20
  },
  perViewer: true,

  create: () => ({
    phase: "lobby",
    nextOrder: 0,
    seats: {},
    words: [],
    teams: { red: emptyTeam(Date.now()), blue: emptyTeam(Date.now()) },
    resultAt: null,
    winner: null,
    resultRecorded: false
  }),

  migrate(state) {
    state.seats ??= {};
    state.words ??= [];
    state.teams ??= { red: emptyTeam(Date.now()), blue: emptyTeam(Date.now()) };
    for (const id of TEAM_IDS) {
      state.teams[id] ??= emptyTeam(Date.now());
      const team = state.teams[id];
      team.solved ??= [];
      team.queues ??= {};
      team.current ??= {};
      team.history ??= {};
      team.feedback ??= {};
      team.lastTickAt ??= Date.now();
      team.locked ??= false;
      team.timeAtStopMs ??= team.locked ? team.remainingMs : null;
    }
    state.resultAt ??= null;
    state.resultRecorded ??= false;
  },

  tickMs(state) {
    if (state.phase === "playing") return TICK_MS;
    if (state.phase === "ending" && state.resultAt !== null) return Math.max(1, state.resultAt - Date.now());
    return null;
  },

  tick(state) {
    return advance(state, Date.now()) ? "save" : "volatile";
  },

  handle(state, actor, message, context) {
    const now = Date.now();
    advance(state, now);
    const seat = state.seats[actor.userId];

    switch (message.type) {
      case "join": {
        if (state.phase !== "lobby" || !context.connected.has(actor.userId)) return "ignore";
        const team = message.team;
        if (team !== "red" && team !== "blue") return { error: "Choose the red or blue team." };
        const teamSize = teamMembers(state, team).filter(member => member.id !== actor.userId).length;
        if (teamSize >= 10) return { error: `The ${team} team is full.` };
        const order = seat?.order ?? state.nextOrder++;
        state.seats[actor.userId] = { id: actor.userId, username: actor.username, team, order };
        return "save";
      }
      case "leave": {
        if (state.phase !== "lobby" || !seat) return "ignore";
        delete state.seats[actor.userId];
        return "save";
      }
      case "start": {
        if (!actor.isHost || state.phase !== "lobby") return "ignore";
        const error = startError(state);
        if (error) return { error };
        const words = shuffled(WORDLE_WORDS).slice(0, 10);
        if (words.length !== 10) return { error: "The Wordle word list needs at least 10 valid words." };
        state.words = words;
        for (const id of TEAM_IDS) {
          state.teams[id] = emptyTeam(now);
          dealTeam(state, id);
        }
        state.resultAt = null;
        state.winner = null;
        state.resultRecorded = false;
        state.phase = "playing";
        return "save";
      }
      case "guess": {
        if (state.phase !== "playing" || !seat) return "ignore";
        const team = state.teams[seat.team];
        const puzzleId = team.current[actor.userId];
        const guess = typeof message.word === "string" ? message.word.trim().toLowerCase() : "";
        if (team.locked || remainingAt(team, now) <= 0 || team.feedback[actor.userId] || puzzleId === null || puzzleId === undefined) return "ignore";
        if (!/^[a-z]{5}$/.test(guess) || !WORDLE_WORDS.includes(guess)) return { error: "That guess is not in the Wordle word list." };
        const answer = state.words[puzzleId];
        const result = evaluateGuess(answer, guess);
        const solved = guess === answer;
        team.guesses++;
        team.history[puzzleId] ??= [];
        team.history[puzzleId].push({ guess, result });
        team.feedback[actor.userId] = { puzzleId, guess, result, solved, resolveAt: now + FEEDBACK_MS };
        if (solved) {
          team.solved.push(puzzleId);
          for (const playerId of Object.keys(team.queues)) {
            team.queues[playerId] = team.queues[playerId].filter(item => item !== puzzleId);
          }
          if (team.solved.length === 10) lockTeam(team, remainingAt(team, now));
          const opponent = state.teams[seat.team === "red" ? "blue" : "red"];
          if (!opponent.locked) {
            const remaining = remainingAt(opponent, now) - PENALTY_MS;
            opponent.lastTickAt = now;
            if (remaining <= 0) lockTeam(opponent, 0);
            else opponent.remainingMs = remaining;
          }
          finishMatch(state, now);
        }
        return "save";
      }
      case "close_results": {
        if (!actor.isHost || state.phase !== "results") return "ignore";
        state.phase = "lobby";
        state.seats = {};
        state.words = [];
        state.teams = { red: emptyTeam(now), blue: emptyTeam(now) };
        state.resultAt = null;
        state.winner = null;
        state.resultRecorded = false;
        state.nextOrder = 0;
        return "save";
      }
      default:
        return "ignore";
    }
  },

  disconnect(state, userId) {
    return state.phase === "lobby" && !!state.seats[userId]
      ? (delete state.seats[userId], true)
      : false;
  },

  participants: state => new Set(Object.keys(state.seats)),

  takeResult(state) {
    if (state.phase !== "results" || state.resultRecorded || !state.winner) return null;
    state.resultRecorded = true;
    return {
      players: Object.values(state.seats).map(player => ({
        userId: player.id,
        role: player.team,
        won: state.winner === player.team,
        score: state.teams[player.team].solved.length,
        extra: state.teams[player.team].guesses
      }))
    };
  },

  snapshot(state, viewerId, connected) {
    const viewer = state.seats[viewerId];
    const now = Date.now();
    const teams = Object.fromEntries(TEAM_IDS.map(id => {
      const team = state.teams[id];
      return [id, {
        solved: team.solved.length,
        total: 10,
        guesses: team.guesses,
        remainingMs: remainingAt(team, now),
        locked: team.locked,
        players: teamMembers(state, id).map(player => ({
          id: player.id,
          username: player.username,
          connected: connected.has(player.id),
          queueCount: team.queues[player.id]?.length ?? 0,
          active: team.current[player.id] !== null && team.current[player.id] !== undefined,
          isYou: player.id === viewerId
        }))
      }];
    })) as Record<TeamId, {
      solved: number; total: number; guesses: number; remainingMs: number; locked: boolean;
      players: { id: string; username: string; connected: boolean; queueCount: number; active: boolean; isYou: boolean }[];
    }>;
    const team = viewer ? state.teams[viewer.team] : null;
    const puzzleId = viewer ? team?.current[viewerId] : null;
    const feedback = viewer && team ? team.feedback[viewerId] : null;
    const activePuzzleId = feedback?.puzzleId ?? puzzleId;
    return {
      phase: state.phase === "ending" ? "playing" : state.phase,
      matchOver: state.phase === "ending",
      seats: Object.values(state.seats).sort((a, b) => a.order - b.order).map(player => ({
        ...player,
        connected: connected.has(player.id)
      })),
      viewer: viewer ? { id: viewer.id, team: viewer.team } : null,
      teams,
      current: viewer && team && activePuzzleId !== null && activePuzzleId !== undefined
        ? {
            puzzleId: activePuzzleId,
            history: team.history[activePuzzleId] ?? [],
            queueCount: team.queues[viewerId]?.length ?? 0,
            feedback: feedback ? {
              guess: feedback.guess,
              result: feedback.result,
              solved: feedback.solved,
              remainingMs: Math.max(0, feedback.resolveAt - now)
            } : null
          }
        : null,
      now,
      winner: state.phase === "results" ? state.winner : null,
      resultsAt: state.phase === "ending" ? state.resultAt : null,
      options: {
        join: state.phase === "lobby" && !viewer,
        leave: state.phase === "lobby" && !!viewer,
        start: state.phase === "lobby" && TEAM_IDS.every(id => teamMembers(state, id).length > 0),
        guess: state.phase === "playing" && !!viewer && !!team && !team.locked && !feedback && puzzleId !== null && puzzleId !== undefined && remainingAt(team, now) > 0,
        closeResults: state.phase === "results"
      }
    };
  }
};
