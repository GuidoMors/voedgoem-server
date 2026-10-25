// Shared-board Tetris for teams. Every member controls their own falling piece on one wide board
// (10 columns per member) and the server runs the simulation.

export const COLS = 10;
export const ROWS = 20;

const BASE_SHAPES: Record<number, number[][]> = {
  1: [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
  2: [[1, 1], [1, 1]],
  3: [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
  4: [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
  5: [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
  6: [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
  7: [[0, 0, 1], [1, 1, 1], [0, 0, 0]]
};

const rotateMatrix = (matrix: number[][]) => matrix[0].map((_, x) => matrix.map(row => row[x]).reverse());

const SHAPES: Record<number, number[][][]> = {};
for (const [type, base] of Object.entries(BASE_SHAPES)) {
  const rotations = [base];
  for (let i = 1; i < 4; i++) rotations.push(rotateMatrix(rotations[i - 1]));
  SHAPES[Number(type)] = rotations;
}

const LINE_SCORES = [0, 100, 300, 500, 800];
const KICKS: [number, number][] = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]];
const START_DELAY_MS = 1500;

export type Action = "left" | "right" | "down" | "rotate" | "rotateBack" | "hard";
export const ACTIONS: Action[] = ["left", "right", "down", "rotate", "rotateBack", "hard"];

export interface Piece {
  type: number;
  rotation: number;
  x: number;
  y: number;
}

export interface Team {
  index: number;
  memberIds: string[];
  width: number;
  // Locked cells, row by row (0 = empty, 1..7 = piece type).
  board: number[];
  pieces: Record<string, Piece | null>;
  queues: Record<string, number[]>;
  out: string[];
  score: number;
  lines: number;
  alive: boolean;
  nextDropAt: number;
}

export type Change = "none" | "moved" | "locked";

export const teamLevel = (team: Team) => Math.floor(team.lines / 10) + 1;
const gravityMs = (team: Team) => Math.max(70, 800 - (teamLevel(team) - 1) * 65);

export function pieceCells(piece: Piece): [number, number][] {
  const result: [number, number][] = [];
  SHAPES[piece.type][piece.rotation].forEach((row, dy) => row.forEach((filled, dx) => {
    if (filled) result.push([piece.x + dx, piece.y + dy]);
  }));
  return result;
}

function blockedByBoard(team: Team, piece: Piece) {
  return pieceCells(piece).some(([x, y]) => x < 0 || x >= team.width || y >= ROWS || (y >= 0 && team.board[y * team.width + x] !== 0));
}

function blockedByPieces(team: Team, piece: Piece, selfId: string) {
  const taken = new Set<number>();
  for (const [id, other] of Object.entries(team.pieces)) {
    if (!other || id === selfId) continue;
    for (const [x, y] of pieceCells(other)) if (y >= 0) taken.add(y * team.width + x);
  }
  return pieceCells(piece).some(([x, y]) => y >= 0 && taken.has(y * team.width + x));
}

const isFree = (team: Team, id: string, piece: Piece) => !blockedByBoard(team, piece) && !blockedByPieces(team, piece, id);

export function ghostOf(team: Team, id: string, piece: Piece): Piece {
  let ghost = piece;
  while (isFree(team, id, { ...ghost, y: ghost.y + 1 })) ghost = { ...ghost, y: ghost.y + 1 };
  return ghost;
}

function refill(queue: number[]) {
  while (queue.length < 7) {
    const bag = [1, 2, 3, 4, 5, 6, 7];
    for (let i = bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bag[i], bag[j]] = [bag[j], bag[i]];
    }
    queue.push(...bag);
  }
}

export const upcoming = (team: Team, id: string) => team.queues[id]?.[0] ?? null;

// Each member's pieces enter at their own lane, e.g. the usual column 3 becomes 3, 13, 23, ...
function spawn(team: Team, id: string) {
  const queue = (team.queues[id] ??= []);
  refill(queue);
  const type = queue[0];
  const lane = team.memberIds.indexOf(id);
  const piece: Piece = { type, rotation: 0, x: lane * COLS + Math.floor((COLS - SHAPES[type][0].length) / 2), y: type === 1 ? -1 : 0 };
  if (blockedByBoard(team, piece)) {
    team.alive = false;
    return;
  }
  // Another member's piece is still in the way; try again on the next tick.
  if (blockedByPieces(team, piece, id)) return;
  queue.shift();
  refill(queue);
  team.pieces[id] = piece;
}

export function createTeam(index: number, memberIds: string[], now: number): Team {
  const width = COLS * memberIds.length;
  const team: Team = {
    index, memberIds: [...memberIds], width,
    board: Array<number>(ROWS * width).fill(0),
    pieces: {}, queues: {}, out: [], score: 0, lines: 0, alive: true,
    nextDropAt: now + START_DELAY_MS
  };
  for (const id of memberIds) {
    team.pieces[id] = null;
    team.queues[id] = [];
  }
  for (const id of memberIds) spawn(team, id);
  return team;
}

function clearLines(team: Team) {
  const width = team.width;
  const rows: number[][] = [];
  const full: number[] = [];
  for (let y = 0; y < ROWS; y++) {
    const row = team.board.slice(y * width, (y + 1) * width);
    if (row.every(cell => cell !== 0)) full.push(y);
    else rows.push(row);
  }
  if (full.length === 0) return;
  const level = teamLevel(team);
  team.board = [...Array.from({ length: full.length }, () => Array<number>(width).fill(0)), ...rows].flat();
  team.score += LINE_SCORES[Math.min(full.length, 4)] * level;
  team.lines += full.length;
  // Pieces still falling sit above the cleared rows they have passed, so the rows below them
  // pushed everything above down: move them the same amount to stay clear of the shifted blocks.
  for (const piece of Object.values(team.pieces)) {
    if (!piece) continue;
    const lowest = Math.max(...pieceCells(piece).map(([, y]) => y));
    piece.y += full.filter(row => row > lowest).length;
  }
}

function lock(team: Team, id: string) {
  const piece = team.pieces[id];
  if (!piece) return;
  team.pieces[id] = null;
  for (const [x, y] of pieceCells(piece)) {
    if (y < 0) {
      team.alive = false;
      return;
    }
    team.board[y * team.width + x] = piece.type;
  }
  clearLines(team);
  if (team.alive && !team.out.includes(id)) spawn(team, id);
}

export function act(team: Team, id: string, action: Action): Change {
  const piece = team.pieces[id];
  if (!piece || !team.alive) return "none";
  const place = (candidate: Piece) => {
    if (!isFree(team, id, candidate)) return false;
    team.pieces[id] = candidate;
    return true;
  };
  switch (action) {
    case "left": return place({ ...piece, x: piece.x - 1 }) ? "moved" : "none";
    case "right": return place({ ...piece, x: piece.x + 1 }) ? "moved" : "none";
    case "down":
      if (!place({ ...piece, y: piece.y + 1 })) return "none";
      team.score += 1;
      return "moved";
    case "rotate":
    case "rotateBack": {
      const rotation = (piece.rotation + (action === "rotate" ? 1 : 3)) % 4;
      for (const [kx, ky] of KICKS) if (place({ ...piece, rotation, x: piece.x + kx, y: piece.y + ky })) return "moved";
      return "none";
    }
    case "hard": {
      let current = piece;
      let distance = 0;
      while (isFree(team, id, { ...current, y: current.y + 1 })) {
        current = { ...current, y: current.y + 1 };
        distance++;
      }
      team.pieces[id] = current;
      team.score += distance * 2;
      // Resting on another falling piece isn't a landing; it only locks on the stack or floor.
      if (blockedByBoard(team, { ...current, y: current.y + 1 })) {
        lock(team, id);
        return "locked";
      }
      return distance > 0 ? "moved" : "none";
    }
  }
}

export function tickTeam(team: Team, now: number): Change {
  if (!team.alive) return "none";
  let change: Change = "none";
  if (now >= team.nextDropAt) {
    team.nextDropAt = now + gravityMs(team);
    for (const id of team.memberIds) {
      const piece = team.pieces[id];
      if (!piece) continue;
      const down = { ...piece, y: piece.y + 1 };
      if (isFree(team, id, down)) {
        team.pieces[id] = down;
        if (change === "none") change = "moved";
      } else if (blockedByBoard(team, down)) {
        lock(team, id);
        change = "locked";
        if (!team.alive) return change;
      }
    }
  }
  for (const id of team.memberIds) {
    if (!team.pieces[id] && !team.out.includes(id) && team.alive) {
      spawn(team, id);
      if (team.pieces[id] && change === "none") change = "moved";
      if (!team.alive) change = "locked";
    }
  }
  return change;
}

export function removeMember(team: Team, id: string) {
  if (!team.memberIds.includes(id) || team.out.includes(id)) return;
  team.out.push(id);
  team.pieces[id] = null;
  if (team.out.length >= team.memberIds.length) team.alive = false;
}
