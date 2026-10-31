import type { GameModule } from "../types";

type Phase = "lobby" | "playing" | "results";
type Color = "blue" | "yellow" | "red" | "green";
type Cell = [number, number];

interface Player {
  id: string;
  username: string;
  color: Color;
  connected: boolean;
  out: boolean;
  remaining: string[];
  remainingSquares: number;
  lastPiece: string | null;
}

interface Result {
  id: string;
  username: string;
  color: Color;
  remainingSquares: number;
  piecesPlaced: number;
  lastPiece: string | null;
}

interface BlokusState {
  phase: Phase;
  round: number;
  players: Record<string, Player>;
  board: number[];
  turnIndex: number;
  results: Result[];
  recorded: boolean;
}

const BOARD_SIZE = 20;
const BOARD_CELLS = BOARD_SIZE * BOARD_SIZE;
const COLORS: Color[] = ["blue", "yellow", "red", "green"];
const COLOR_INDEX = new Map(COLORS.map((color, index) => [color, index + 1]));
const PIECE_ROWS: Record<string, string[]> = {
  I1: ["X"], I2: ["XX"], I3: ["XXX"], V3: ["X.", "XX"],
  I4: ["XXXX"], L4: ["XXX", "X.."], O4: ["XX", "XX"], T4: ["XXX", ".X."], Z4: ["XX.", ".XX"],
  F5: [".XX", "XX.", ".X."], I5: ["XXXXX"], L5: ["XXXX", "X..."], N5: ["XXX.", "..XX"],
  P5: ["XX", "XX", "X."], T5: ["XXX", ".X.", ".X."], U5: ["X.X", "XXX"],
  V5: ["X..", "X..", "XXX"], W5: ["X..", "XX.", ".XX"], X5: [".X.", "XXX", ".X."],
  Y5: ["XXXX", ".X.."], Z5: ["XX.", ".X.", ".XX"]
};
const PIECE_IDS = Object.keys(PIECE_ROWS);
const PIECES: Record<string, Cell[]> = Object.fromEntries(PIECE_IDS.map(id => [
  id,
  PIECE_ROWS[id].flatMap((row, y) => [...row].flatMap((cell, x) => cell === "X" ? [[x, y] as Cell] : []))
]));
const TOTAL_SQUARES = Object.values(PIECES).reduce((sum, cells) => sum + cells.length, 0);

function normalize(cells: Cell[]): Cell[] {
  const minX = Math.min(...cells.map(([x]) => x));
  const minY = Math.min(...cells.map(([, y]) => y));
  return cells.map(([x, y]) => [x - minX, y - minY] as Cell).sort(([ax, ay], [bx, by]) => ay - by || ax - bx);
}

function orientation(piece: Cell[], rotation: number, flipped: boolean): Cell[] {
  let cells = piece.map(([x, y]) => [flipped ? -x : x, y] as Cell);
  for (let turn = 0; turn < rotation; turn++) cells = cells.map(([x, y]) => [-y, x] as Cell);
  return normalize(cells);
}

function orientations(piece: Cell[]): Cell[][] {
  const unique = new Map<string, Cell[]>();
  for (const flipped of [false, true]) {
    for (let rotation = 0; rotation < 4; rotation++) {
      const cells = orientation(piece, rotation, flipped);
      unique.set(cells.map(([x, y]) => `${x},${y}`).join(";"), cells);
    }
  }
  return [...unique.values()];
}

const PIECE_ORIENTATIONS = Object.fromEntries(PIECE_IDS.map(id => [id, orientations(PIECES[id])]));
const playerOrder = (state: BlokusState) => COLORS.flatMap(color => Object.values(state.players).filter(player => player.color === color));
const boardIndex = (x: number, y: number) => y * BOARD_SIZE + x;
const colorValue = (player: Player) => COLOR_INDEX.get(player.color) ?? 0;
const corners: Cell[] = [[0, 0], [BOARD_SIZE - 1, 0], [0, BOARD_SIZE - 1], [BOARD_SIZE - 1, BOARD_SIZE - 1]];

function isLegalAt(state: BlokusState, player: Player, cells: Cell[], x: number, y: number): boolean {
  const own = colorValue(player);
  const firstMove = player.remaining.length === PIECE_IDS.length;
  let touchesCorner = false;
  for (const [dx, dy] of cells) {
    const px = x + dx;
    const py = y + dy;
    if (px < 0 || px >= BOARD_SIZE || py < 0 || py >= BOARD_SIZE) return false;
    if (state.board[boardIndex(px, py)] !== 0) return false;
    if (firstMove && corners.every(([cx, cy]) => cx !== px || cy !== py)) continue;
    if (firstMove) touchesCorner = true;
  }
  if (firstMove) return touchesCorner;

  for (const [dx, dy] of cells) {
    const px = x + dx;
    const py = y + dy;
    for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as Cell[]) {
      const nx = px + ox;
      const ny = py + oy;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && state.board[boardIndex(nx, ny)] === own) return false;
    }
    for (const [ox, oy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]] as Cell[]) {
      const nx = px + ox;
      const ny = py + oy;
      if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && state.board[boardIndex(nx, ny)] === own) touchesCorner = true;
    }
  }
  return touchesCorner;
}

function hasLegalMove(state: BlokusState, player: Player): boolean {
  if (player.remaining.length === 0) return false;
  const firstMove = player.remaining.length === PIECE_IDS.length;
  const ownCells: Cell[] = [];
  if (!firstMove) {
    for (let index = 0; index < state.board.length; index++) {
      if (state.board[index] === colorValue(player)) ownCells.push([index % BOARD_SIZE, Math.floor(index / BOARD_SIZE)]);
    }
  }

  for (const pieceId of player.remaining) {
    for (const cells of PIECE_ORIENTATIONS[pieceId]) {
      const origins = new Set<string>();
      const maxX = Math.max(...cells.map(([x]) => x));
      const maxY = Math.max(...cells.map(([, y]) => y));
      const addOrigin = (x: number, y: number) => {
        if (x >= 0 && y >= 0 && x + maxX < BOARD_SIZE && y + maxY < BOARD_SIZE) origins.add(`${x},${y}`);
      };
      if (firstMove) {
        for (const [cx, cy] of corners) for (const [dx, dy] of cells) addOrigin(cx - dx, cy - dy);
      } else {
        for (const [ownX, ownY] of ownCells) {
          for (const [dx, dy] of cells) {
            addOrigin(ownX - dx - 1, ownY - dy - 1);
            addOrigin(ownX - dx + 1, ownY - dy - 1);
            addOrigin(ownX - dx - 1, ownY - dy + 1);
            addOrigin(ownX - dx + 1, ownY - dy + 1);
          }
        }
      }
      for (const origin of origins) {
        const [x, y] = origin.split(",").map(Number);
        if (isLegalAt(state, player, cells, x, y)) return true;
      }
    }
  }
  return false;
}

function finish(state: BlokusState) {
  state.phase = "results";
  state.turnIndex = -1;
  state.results = playerOrder(state)
    .map(player => ({
      id: player.id,
      username: player.username,
      color: player.color,
      remainingSquares: player.remainingSquares,
      piecesPlaced: PIECE_IDS.length - player.remaining.length,
      lastPiece: player.lastPiece
    }))
    .sort((a, b) => a.remainingSquares - b.remainingSquares || b.piecesPlaced - a.piecesPlaced);
}

function advanceTurn(state: BlokusState, afterIndex: number) {
  const ordered = playerOrder(state);
  for (let offset = 1; offset <= ordered.length; offset++) {
    const index = (afterIndex + offset) % ordered.length;
    const player = ordered[index];
    if (player.out) continue;
    if (!hasLegalMove(state, player)) {
      player.out = true;
      continue;
    }
    state.turnIndex = index;
    return;
  }
  finish(state);
}

function resetRound(state: BlokusState) {
  state.phase = "lobby";
  state.board = Array<number>(BOARD_CELLS).fill(0);
  state.turnIndex = -1;
  state.results = [];
  state.recorded = false;
  for (const player of Object.values(state.players)) {
    player.out = false;
    player.remaining = [];
    player.remainingSquares = TOTAL_SQUARES;
    player.lastPiece = null;
  }
}

export const blokus: GameModule<BlokusState> = {
  info: {
    id: "blokus",
    name: "Blokus",
    description: "Place your 21 pieces on the board. Every new piece must touch your color at a corner, never along an edge.",
    maxPlayers: 4
  },
  perViewer: false,

  create: () => ({
    phase: "lobby", round: 0, players: {}, board: Array<number>(BOARD_CELLS).fill(0), turnIndex: -1, results: [], recorded: false
  }),

  handle(state, actor, message) {
    const player = state.players[actor.userId];
    switch (message.type) {
      case "join": {
        if (state.phase !== "lobby") return "ignore";
        const color = message.color;
        if (typeof color !== "string" || !COLORS.includes(color as Color)) return "ignore";
        if (player) {
          if (Object.values(state.players).some(other => other.id !== actor.userId && other.color === color)) return { error: "That color has already been chosen." };
          player.color = color as Color;
          return "save";
        }
        if (Object.keys(state.players).length >= blokus.info.maxPlayers) return { error: "All four colors are taken." };
        if (Object.values(state.players).some(other => other.color === color)) return { error: "That color has already been chosen." };
        state.players[actor.userId] = {
          id: actor.userId, username: actor.username, color: color as Color, connected: true, out: false,
          remaining: [], remainingSquares: TOTAL_SQUARES, lastPiece: null
        };
        return "save";
      }
      case "leave":
        if (state.phase !== "lobby" || !player) return "ignore";
        delete state.players[actor.userId];
        return "save";
      case "kick": {
        if (!actor.isHost || state.phase !== "lobby" || typeof message.userId !== "string" || !state.players[message.userId]) return "ignore";
        delete state.players[message.userId];
        return "save";
      }
      case "start": {
        if (!actor.isHost || state.phase !== "lobby") return "ignore";
        if (Object.keys(state.players).length !== COLORS.length || COLORS.some(color => !Object.values(state.players).some(item => item.color === color))) {
          return { error: "Four players, one for each color, are required to start." };
        }
        state.phase = "playing";
        state.round += 1;
        state.board = Array<number>(BOARD_CELLS).fill(0);
        state.results = [];
        state.recorded = false;
        for (const item of Object.values(state.players)) {
          item.out = false;
          item.remaining = [...PIECE_IDS];
          item.remainingSquares = TOTAL_SQUARES;
          item.lastPiece = null;
        }
        state.turnIndex = 0;
        return "save";
      }
      case "place": {
        if (state.phase !== "playing" || !player || player.out || playerOrder(state)[state.turnIndex]?.id !== actor.userId) return "ignore";
        if (typeof message.pieceId !== "string" || !player.remaining.includes(message.pieceId) || !PIECES[message.pieceId]) return { error: "Choose an unused piece." };
        if (!Number.isInteger(message.x) || !Number.isInteger(message.y) || typeof message.rotation !== "number" || !Number.isInteger(message.rotation) || message.rotation < 0 || message.rotation > 3 || typeof message.flipped !== "boolean") {
          return { error: "Choose a valid piece position and orientation." };
        }
        const cells = orientation(PIECES[message.pieceId], message.rotation, message.flipped);
        const x = message.x as number;
        const y = message.y as number;
        if (!isLegalAt(state, player, cells, x, y)) return { error: "That placement is not legal. Your pieces may touch only at corners." };
        const value = colorValue(player);
        for (const [dx, dy] of cells) state.board[boardIndex(x + dx, y + dy)] = value;
        player.remaining = player.remaining.filter(id => id !== message.pieceId);
        player.remainingSquares -= cells.length;
        player.lastPiece = message.pieceId;
        advanceTurn(state, state.turnIndex);
        return "save";
      }
      case "abort":
        if (!actor.isHost || state.phase !== "playing") return "ignore";
        resetRound(state);
        return "save";
      case "exit":
        if (!actor.isHost || state.phase !== "results") return "ignore";
        resetRound(state);
        return "save";
      default:
        return "ignore";
    }
  },

  disconnect(state, userId) {
    const player = state.players[userId];
    if (!player) return false;
    if (state.phase === "lobby") {
      delete state.players[userId];
      return true;
    }
    if (state.phase === "playing" && !player.out) {
      player.out = true;
      const index = playerOrder(state).findIndex(item => item.id === userId);
      if (index === state.turnIndex) advanceTurn(state, index);
      return true;
    }
    return false;
  },

  participants: state => new Set(Object.keys(state.players)),

  takeResult(state) {
    if (state.phase !== "results" || state.recorded) return null;
    state.recorded = true;
    const best = state.results[0]?.remainingSquares;
    return {
      players: state.results.map(result => ({
        userId: result.id, role: "player", won: result.remainingSquares === best,
        score: -result.remainingSquares, extra: result.piecesPlaced
      }))
    };
  },

  snapshot(state, _viewerId, connected) {
    const players = playerOrder(state).map(player => ({
      id: player.id,
      username: player.username,
      color: player.color,
      connected: connected.has(player.id),
      out: player.out,
      remaining: player.remaining,
      remainingSquares: player.remainingSquares,
      piecesPlaced: PIECE_IDS.length - player.remaining.length,
      lastPiece: player.lastPiece
    }));
    return {
      phase: state.phase,
      round: state.round,
      board: state.board,
      boardSize: BOARD_SIZE,
      colors: COLORS,
      pieces: PIECE_IDS.map(id => ({ id, cells: PIECES[id] })),
      players,
      turn: players[state.turnIndex]?.id ?? null,
      results: state.results
    };
  }
};
