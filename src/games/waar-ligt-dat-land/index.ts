import type { GameModule } from "../types";
import { COUNTRIES } from "./countries";
import { COUNTRY_NAMES_EN } from "./country-names-en";
import { QUESTIONS_EN } from "./questions-en";
import { QUESTIONS } from "./questions";

type Step = "draw" | "guess" | "trivia" | "answer" | "turnComplete";

interface Player {
  id: string;
  username: string;
  order: number;
  connected: boolean;
  score: number;
  countriesFound: number;
  correctTrivia: number;
  guesses: number;
}

interface Trivia {
  category: number;
  question: string;
  questionEn: string | null;
  answer: string;
  answerEn: string | null;
  trueFalse: boolean;
}

interface WorldState {
  phase: "lobby" | "playing" | "results";
  step: Step;
  roundsPerPlayer: number;
  nextOrder: number;
  players: Record<string, Player>;
  turnIndex: number;
  deck: string[];
  targetId: string | null;
  wrongGuesses: string[];
  distanceFeedback: { countryId: string; countryName: string; distanceKm: number }[];
  trivia: Trivia | null;
  triviaAnswerRevealed: boolean;
  triviaResponse: boolean | null;
  triviaCorrect: boolean | null;
  turnMessage: string;
  recorded: boolean;
}

const COUNTRY_IDS = Object.keys(COUNTRIES);
const MAX_PLAYERS = 8;
const MAX_ROUNDS = 50;
const CATEGORY_NAMES = [
  "Taal & Schrift",
  "Muziek & Dans",
  "Eten & Drinken",
  "Cultuur & Tradities",
  "Natuur & Dieren",
  "Geografie & Weetjes"
];

function shuffled<T>(items: readonly T[]): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function orderedPlayers(state: WorldState): Player[] {
  return Object.values(state.players).sort((a, b) => a.order - b.order);
}

function activePlayer(state: WorldState): Player | undefined {
  const players = orderedPlayers(state);
  return players.length ? players[state.turnIndex % players.length] : undefined;
}

function reviewerPlayer(state: WorldState): Player | undefined {
  const players = orderedPlayers(state);
  if (!players.length) return undefined;
  const active = activePlayer(state);
  if (!active) return undefined;
  const activeIndex = players.findIndex(player => player.id === active.id);
  for (let offset = 1; offset < players.length; offset++) {
    const player = players[(activeIndex + offset) % players.length];
    if (player?.connected) return player;
  }
  return active;
}

function resetTurn(state: WorldState) {
  state.step = "draw";
  state.targetId = null;
  state.wrongGuesses = [];
  state.distanceFeedback = [];
  state.trivia = null;
  state.triviaAnswerRevealed = false;
  state.triviaResponse = null;
  state.triviaCorrect = null;
  state.turnMessage = "";
}

function greatCircleDistance(fromId: string, toId: string): number {
  const from = COUNTRIES[fromId as keyof typeof COUNTRIES];
  const to = COUNTRIES[toId as keyof typeof COUNTRIES];
  const radians = Math.PI / 180;
  const latitude1 = from.lat * radians;
  const latitude2 = to.lat * radians;
  const latitudeDelta = (to.lat - from.lat) * radians;
  const longitudeDelta = (to.lon - from.lon) * radians;
  const rawHaversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(latitude1) * Math.cos(latitude2) * Math.sin(longitudeDelta / 2) ** 2;
  const haversine = Math.min(1, Math.max(0, rawHaversine));
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)));
}

function finish(state: WorldState) {
  state.phase = "results";
  state.step = "turnComplete";
}

function advanceTurn(state: WorldState) {
  const players = orderedPlayers(state);
  state.turnIndex++;
  while (state.turnIndex < state.roundsPerPlayer * players.length) {
    if (players[state.turnIndex % players.length].connected) {
      resetTurn(state);
      return;
    }
    state.turnIndex++;
  }
  finish(state);
}

function makeQuestion(countryId: string): Trivia {
  const questions = QUESTIONS[countryId as keyof typeof QUESTIONS].q;
  const isTrueFalse = ([question, answer]: readonly [string, string]) =>
    /^Klopt het/.test(question) && /^(Niet waar|Waar)/.test(answer);
  const desiredType = Math.random() < 0.5;
  const candidates = questions
    .map((item, category) => ({ item, category }))
    .filter(({ item }) => isTrueFalse(item) === desiredType);
  const generated = candidates.length === 0;
  const country = COUNTRIES[countryId as keyof typeof COUNTRIES];
  const countryNameEn = COUNTRY_NAMES_EN[countryId] ?? country.name;
  const latitude = Math.abs(country.lat).toFixed(1);
  const hemisphere = country.lat >= 0 ? "N" : "S";
  const fallbackQuestion: readonly [string, string] = desiredType
    ? [
      `Klopt het dat het middelpunt van ${country.name} op het noordelijk halfrond ligt?`,
      country.lat >= 0 ? "Waar" : "Niet waar"
    ]
    : [
      `Op welke breedtegraad ligt het middelpunt van ${country.name} ongeveer?`,
      `${latitude}° ${hemisphere}`
    ];
  const questionPool = candidates.length
    ? candidates
    : [{ item: fallbackQuestion, category: 5 }];
  const selected = questionPool[Math.floor(Math.random() * questionPool.length)];
  if (!selected) throw new Error(`No trivia questions available for ${countryId}.`);
  const [question, answer] = selected.item;
  const translatedQuestion = QUESTIONS_EN[countryId]?.[selected.category];
  const trueFalse = isTrueFalse(selected.item);
  const category = selected.category;
  const fallbackQuestionEn = desiredType
    ? [
      `Is the geographic centre of ${countryNameEn} in the Northern Hemisphere?`,
      country.lat >= 0 ? "True" : "False"
    ]
    : [
      `At approximately what latitude is the centre of ${countryNameEn}?`,
      `${latitude}° ${hemisphere}`
    ];
  return {
    category,
    question,
    questionEn: generated ? fallbackQuestionEn[0] : translatedQuestion?.[0] ?? null,
    answer,
    answerEn: generated ? fallbackQuestionEn[1] : translatedQuestion?.[1] ?? null,
    trueFalse
  };
}

function resolveLegacyTrueFalseAnswer(state: WorldState): boolean {
  const current = activePlayer(state);
  if (
    state.phase !== "playing"
    || state.step !== "answer"
    || !state.trivia?.trueFalse
    || typeof state.triviaResponse !== "boolean"
    || !current
  ) return false;

  const correct = state.triviaResponse === state.trivia.answer.startsWith("Waar");
  if (correct) {
    current.score++;
    current.correctTrivia++;
  }
  state.triviaCorrect = correct;
  state.step = "turnComplete";
  state.turnMessage = correct ? "Correct! +1 point." : `Not quite. ${state.trivia.answer}.`;
  return true;
}

export const waarLigtDatLand: GameModule<WorldState> = {
  info: {
    id: "waar-ligt-dat-land",
  name: "Plenet",
    description: "Vind landen op de wereldkaart en beantwoord weetjesvragen.",
    maxPlayers: MAX_PLAYERS
  },
  perViewer: false,

  create: () => ({
    phase: "lobby",
    step: "draw",
    roundsPerPlayer: 5,
    nextOrder: 0,
    players: {},
    turnIndex: 0,
    deck: [],
    targetId: null,
    wrongGuesses: [],
    distanceFeedback: [],
    trivia: null,
    triviaAnswerRevealed: false,
    triviaResponse: null,
    triviaCorrect: null,
    turnMessage: "",
    recorded: false
  }),

  handle(state, actor, message) {
    if (resolveLegacyTrueFalseAnswer(state)) return "save";
    const player = state.players[actor.userId];
    switch (message.type) {
      case "join": {
        if (state.phase !== "lobby") return "ignore";
        if (player) return "ignore";
        if (Object.keys(state.players).length >= MAX_PLAYERS) return { error: "All player seats are taken." };
        state.players[actor.userId] = {
          id: actor.userId,
          username: actor.username,
          order: state.nextOrder++,
          connected: true,
          score: 0,
          countriesFound: 0,
          correctTrivia: 0,
          guesses: 0
        };
        return "save";
      }
      case "leave":
        if (state.phase !== "lobby" || !player) return "ignore";
        delete state.players[actor.userId];
        return "save";
      case "kick":
        if (!actor.isHost || state.phase !== "lobby" || typeof message.userId !== "string" || !state.players[message.userId]) return "ignore";
        delete state.players[message.userId];
        return "save";
      case "setOptions": {
        if (!actor.isHost || state.phase !== "lobby") return "ignore";
        const roundsPerPlayer = message.roundsPerPlayer;
        if (typeof roundsPerPlayer !== "number" || !Number.isInteger(roundsPerPlayer) || roundsPerPlayer < 1 || roundsPerPlayer > MAX_ROUNDS) {
          return { error: "Rounds per player must be between 1 and 50." };
        }
        state.roundsPerPlayer = roundsPerPlayer;
        return "save";
      }
      case "start":
        if (!actor.isHost || state.phase !== "lobby") return "ignore";
        if (!orderedPlayers(state).length) return { error: "At least one player must join before starting." };
        state.phase = "playing";
        state.step = "draw";
        state.turnIndex = 0;
        state.deck = shuffled(COUNTRY_IDS);
        state.recorded = false;
        for (const item of Object.values(state.players)) {
          item.score = 0;
          item.countriesFound = 0;
          item.correctTrivia = 0;
          item.guesses = 0;
        }
        resetTurn(state);
        return "save";
      case "draw": {
        const current = activePlayer(state);
        if (state.phase !== "playing" || state.step !== "draw" || current?.id !== actor.userId) return "ignore";
        if (!state.deck.length) state.deck = shuffled(COUNTRY_IDS);
        state.targetId = state.deck.pop() ?? null;
        if (!state.targetId) return { error: "There are no countries available to draw." };
        current.guesses++;
        state.step = "guess";
        return "save";
      }
      case "guess": {
        const current = activePlayer(state);
        if (state.phase !== "playing" || state.step !== "guess" || current?.id !== actor.userId) return "ignore";
        if (typeof message.countryId !== "string" || !Object.hasOwn(COUNTRIES, message.countryId)) return { error: "Choose a country on the map." };
        const countryId = message.countryId;
        if (state.wrongGuesses.includes(countryId)) return { error: "You already guessed that country." };
        if (countryId === state.targetId) {
          current.score += 3 - state.wrongGuesses.length;
          current.countriesFound++;
          state.trivia = makeQuestion(countryId);
          state.step = "trivia";
          state.turnMessage = `Correct! +${3 - state.wrongGuesses.length} points.`;
        } else {
          state.wrongGuesses.push(countryId);
          state.distanceFeedback.push({
            countryId,
            countryName: COUNTRIES[countryId as keyof typeof COUNTRIES].name,
            distanceKm: greatCircleDistance(countryId, state.targetId!)
          });
          if (state.wrongGuesses.length === 3) {
            state.step = "turnComplete";
            state.turnMessage = `Out of guesses. The country was ${COUNTRIES[state.targetId as keyof typeof COUNTRIES].name}.`;
          } else {
            state.turnMessage = `${COUNTRIES[countryId as keyof typeof COUNTRIES].name} is about ${state.distanceFeedback.at(-1)?.distanceKm} km away.`;
          }
        }
        return "save";
      }
      case "answer": {
        const current = activePlayer(state);
        if (state.phase !== "playing" || state.step !== "trivia" || current?.id !== actor.userId || !state.trivia?.trueFalse) return "ignore";
        if (typeof message.correct !== "boolean") return { error: "Choose True or False." };
        const correct = message.correct === state.trivia.answer.startsWith("Waar");
        if (correct) {
          current.score++;
          current.correctTrivia++;
        }
        state.triviaResponse = message.correct;
        state.triviaCorrect = correct;
        state.triviaAnswerRevealed = true;
        state.step = "turnComplete";
        state.turnMessage = correct ? "Correct! +1 point." : `Not quite. ${state.trivia.answer}.`;
        return "save";
      }
      case "revealAnswer":
        if (state.phase !== "playing" || state.step !== "trivia" || activePlayer(state)?.id !== actor.userId || !state.trivia || state.trivia.trueFalse) return "ignore";
        state.triviaAnswerRevealed = true;
        state.step = "answer";
        return "save";
      case "grade": {
        const reviewer = reviewerPlayer(state);
        if (state.phase !== "playing" || state.step !== "answer" || reviewer?.id !== actor.userId || !state.trivia) return "ignore";
        if (typeof message.correct !== "boolean") return { error: "Choose whether your answer was correct." };
        if (message.correct) {
          const current = activePlayer(state);
          if (!current) return "ignore";
          current.score++;
          current.correctTrivia++;
        }
        state.triviaCorrect = message.correct;
        state.step = "turnComplete";
        state.turnMessage = message.correct ? "Approved! +1 point." : "The answer was not approved.";
        return "save";
      }
      case "next": {
        if (state.phase !== "playing" || state.step !== "turnComplete" || activePlayer(state)?.id !== actor.userId) return "ignore";
        advanceTurn(state);
        return "save";
      }
      case "exit":
        if (!actor.isHost || state.phase !== "results") return "ignore";
        state.phase = "lobby";
        state.step = "draw";
        state.turnIndex = 0;
        state.deck = [];
        state.recorded = false;
        resetTurn(state);
        return "save";
      default:
        return "ignore";
    }
  },

  openSpots(state, userId) {
    if (state.phase !== "lobby" || state.players[userId] || Object.keys(state.players).length >= MAX_PLAYERS) return [];
    return [{ type: "join" }];
  },

  botMove() {
    return null;
  },

  connect(state, userId) {
    const player = state.players[userId];
    if (!player || player.connected) return false;
    player.connected = true;
    return true;
  },

  disconnect(state, userId) {
    const player = state.players[userId];
    if (!player) return false;
    if (state.phase === "lobby") {
      delete state.players[userId];
      return true;
    }
    if (state.phase !== "playing" || !player.connected) return false;
    player.connected = false;
    if (activePlayer(state)?.id === userId) advanceTurn(state);
    return true;
  },

  participants: state => new Set(Object.keys(state.players)),

  takeResult(state) {
    if (state.phase !== "results" || state.recorded) return null;
    state.recorded = true;
    const bestScore = Math.max(...Object.values(state.players).map(player => player.score));
    return {
      players: Object.values(state.players).map(player => ({
        userId: player.id,
        role: "player",
        won: player.score === bestScore,
        score: player.score,
        extra: player.countriesFound,
        guesses: player.guesses
      }))
    };
  },

  snapshot(state, _viewerId, connected) {
    const players = orderedPlayers(state).map(player => ({
      ...player,
      connected: connected.has(player.id)
    }));
    const currentPlayer = players.length ? players[state.turnIndex % players.length] : null;
    const targetRevealed = state.step === "trivia" || state.step === "answer" || state.step === "turnComplete";
    return {
      phase: state.phase,
      step: state.step,
      roundsPerPlayer: state.roundsPerPlayer,
      round: state.phase === "playing" && players.length ? Math.floor(state.turnIndex / players.length) + 1 : 0,
      turn: state.turnIndex,
      activePlayerId: state.phase === "playing" ? currentPlayer?.id ?? null : null,
      reviewerId: state.step === "answer" && state.trivia && !state.trivia.trueFalse
        ? reviewerPlayer(state)?.id ?? null
        : null,
      players,
      countries: Object.entries(COUNTRIES).map(([id, country]) => ({
        id,
        name: country.name,
        nameEn: COUNTRY_NAMES_EN[id] ?? country.name
      })),
      targetName: state.targetId ? COUNTRIES[state.targetId as keyof typeof COUNTRIES].name : null,
      targetNameEn: state.targetId ? COUNTRY_NAMES_EN[state.targetId] ?? COUNTRIES[state.targetId as keyof typeof COUNTRIES].name : null,
      revealedCountryId: targetRevealed ? state.targetId : null,
      wrongGuesses: state.wrongGuesses,
      distanceFeedback: state.distanceFeedback,
      trivia: state.trivia ? {
        category: CATEGORY_NAMES[state.trivia.category],
        question: state.trivia.question,
        questionEn: state.trivia.questionEn ?? null,
        trueFalse: state.trivia.trueFalse,
        answer: state.triviaAnswerRevealed ? state.trivia.answer : null,
        answerEn: state.triviaAnswerRevealed ? state.trivia.answerEn ?? null : null,
        response: state.triviaResponse ?? null,
        correct: state.triviaCorrect
      } : null,
      turnMessage: state.turnMessage,
      results: state.phase === "results"
        ? players.map(player => ({ id: player.id, username: player.username, score: player.score, won: player.score === Math.max(...players.map(item => item.score)) }))
          .sort((a, b) => b.score - a.score)
        : []
    };
  }
};
