import type { GameModule } from "../types";

type Phase = "lobby" | "playing" | "results";
type Role = "saboteur" | "explorer";
type Step = "turn" | "gift" | "monster";
type GoalType = "gold" | "monster";
export type AbilityType = "lookGoal" | "lookDwarf" | "destroyTunnel" | "destroyPickaxe" | "fixPickaxe" | "destroyLantern" | "fixLantern";
type Side = "N" | "E" | "S" | "W";

interface Seat {
  id: string;
  username: string;
  order: number;
}

interface Player {
  id: string;
  username: string;
  role: Role;
  tunnels: string[]; // open sides of each tunnel card in hand, e.g. "NS"
  abilities: AbilityType[];
  pickaxeBroken: boolean;
  lanternBroken: boolean;
  knownGoals: Partial<Record<number, GoalType>>;
  knownDwarves: Record<string, Role>;
}

interface Goal {
  cell: number;
  type: GoalType;
  revealed: boolean;
}

export interface SaboteurState {
  phase: Phase;
  round: number;
  nextOrder: number;
  seats: Record<string, Seat>;
  players: Player[];
  turn: number;
  step: Step;
  deck: string[];
  row: AbilityType[];
  tunnels: Record<number, string>; // cell -> open sides
  goals: Goal[];
  gems: number[];
  monsters: number[]; // cells
  monsterQueue: number[]; // indices into monsters still to move this turn
  monsterOptions: number[];
  turnLog?: string[]; // log lines of the turn in progress
  lastTurn?: string[]; // log lines of the turn before
  log: string[];
  winner: Role | null;
  endReason: "gold" | "monster" | "tunnels" | null;
  recorded?: boolean;
}

export const ROWS = 7;
export const COLS = 13;
export const LADDER = 3 * COLS + 3;
export const MIN_PLAYERS = 4;
export const MAX_PLAYERS = 14;
const HAND_SIZE = 3;
const LOG_LIMIT = 40;

const GOAL_CELLS = [1 * COLS + 11, 3 * COLS + 11, 5 * COLS + 11];
const GEM_CELLS = [1, 3, 5].flatMap(row => [row * COLS + 1, row * COLS + 7]);

// Players -> [saboteurs, explorers], and how many ability cards each dwarf is dealt. The rest go in The Shop beside the board.
const ROLES: Record<number, [number, number]> = {
  4: [1, 3], 5: [2, 3], 6: [2, 4], 7: [2, 5], 8: [3, 5], 9: [3, 6], 10: [3, 7], 11: [4, 7], 12: [4, 8], 13: [4, 9], 14: [5, 9]
};
const ABILITIES_DEALT: Record<number, number> = { 4: 3, 5: 2, 6: 2, 7: 2, 8: 2, 9: 1, 10: 1, 11: 1, 12: 1, 13: 1, 14: 1 };

const ABILITY_COUNTS: Record<AbilityType, number> = {
  lookGoal: 4, lookDwarf: 2, destroyTunnel: 4, destroyPickaxe: 3, fixPickaxe: 2, destroyLantern: 3, fixLantern: 2
};

// 45 tunnel cards. Cards can be turned 180 degrees but not 90.
const TUNNEL_CARDS: [string, number][] = [["NESW", 6], ["NES", 7], ["ESW", 7], ["NS", 7], ["EW", 6], ["NE", 6], ["SE", 6]];

const ABILITY_NAMES: Record<AbilityType, string> = {
  lookGoal: "Look at goal", lookDwarf: "Look at dwarf", destroyTunnel: "Destroy tunnel", destroyPickaxe: "Destroy pickaxe",
  fixPickaxe: "Fix pickaxe", destroyLantern: "Destroy lantern", fixLantern: "Fix lantern"
};

const SIDES: Side[] = ["N", "E", "S", "W"];
const OPPOSITE: Record<Side, Side> = { N: "S", E: "W", S: "N", W: "E" };

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

const normalize = (sides: string) => SIDES.filter(side => sides.includes(side)).join("");
// Pieces can only be turned 180 degrees, so the cross and the straight pieces never change.
export const rotate = (sides: string) => normalize([...sides].map(side => OPPOSITE[side as Side]).join(""));
const orient = (sides: string, rot: number) => { let out = sides; for (let i = 0; i < rot; i++) out = rotate(out); return out; };

const rowOf = (cell: number) => Math.floor(cell / COLS);
const colOf = (cell: number) => cell % COLS;

function neighbour(cell: number, side: Side): number | null {
  const row = rowOf(cell) + (side === "S" ? 1 : side === "N" ? -1 : 0);
  const col = colOf(cell) + (side === "E" ? 1 : side === "W" ? -1 : 0);
  return row < 0 || row >= ROWS || col < 0 || col >= COLS ? null : row * COLS + col;
}

// The ladder is open on every side.
const sidesAt = (state: SaboteurState, cell: number): string | null => (cell === LADDER ? "NESW" : state.tunnels[cell] ?? null);
const goalAt = (state: SaboteurState, cell: number) => state.goals.find(goal => goal.cell === cell);

// Distance from the ladder along tunnels that open into each other.
function distances(state: SaboteurState): Map<number, number> {
  const dist = new Map<number, number>([[LADDER, 0]]);
  const queue = [LADDER];
  for (let head = 0; head < queue.length; head++) {
    const cell = queue[head];
    const sides = sidesAt(state, cell)!;
    for (const side of SIDES) {
      if (!sides.includes(side)) continue;
      const next = neighbour(cell, side);
      if (next === null || dist.has(next)) continue;
      if (sidesAt(state, next)?.includes(OPPOSITE[side])) {
        dist.set(next, dist.get(cell)! + 1);
        queue.push(next);
      }
    }
  }
  return dist;
}

function canPlace(state: SaboteurState, cell: number, sides: string, reachable: Map<number, number>): boolean {
  if (cell === LADDER || state.tunnels[cell] || goalAt(state, cell)) return false;
  let connected = false;
  for (const side of SIDES) {
    const next = neighbour(cell, side);
    if (next === null) continue;
    const other = sidesAt(state, next);
    if (other === null) continue;
    const open = sides.includes(side);
    const theirs = other.includes(OPPOSITE[side]);
    if (open !== theirs) return false;
    if (open && reachable.has(next)) connected = true;
  }
  return connected;
}

function placements(state: SaboteurState, sides: string): Record<number, number[]> {
  const reachable = distances(state);
  const out: Record<number, number[]> = {};
  for (const rot of [0, 1]) {
    const oriented = orient(sides, rot);
    const cells: number[] = [];
    for (let cell = 0; cell < ROWS * COLS; cell++) if (canPlace(state, cell, oriented, reachable)) cells.push(cell);
    out[rot] = cells;
  }
  return out;
}

const current = (state: SaboteurState) => state.players[state.turn];
const playerOf = (state: SaboteurState, id: unknown) => (typeof id === "string" ? state.players.find(player => player.id === id) : undefined);

function addLog(state: SaboteurState, line: string) {
  state.log.push(line);
  (state.turnLog ??= []).push(line);
  if (state.log.length > LOG_LIMIT) state.log.shift();
}

function finish(state: SaboteurState, winner: Role, reason: "gold" | "monster" | "tunnels") {
  state.phase = "results";
  state.winner = winner;
  state.endReason = reason;
  state.step = "turn";
  state.monsterQueue = [];
  state.monsterOptions = [];
}

function resetToLobby(state: SaboteurState) {
  state.phase = "lobby";
  state.players = [];
  state.tunnels = {};
  state.goals = [];
  state.gems = [];
  state.monsters = [];
  state.monsterQueue = [];
  state.monsterOptions = [];
  state.deck = [];
  state.row = [];
  state.log = [];
  state.step = "turn";
  state.winner = null;
  state.endReason = null;
}

function startGame(state: SaboteurState) {
  const seats = Object.values(state.seats).sort((a, b) => a.order - b.order);
  const [saboteurs] = ROLES[seats.length];
  const roles = shuffle<Role>([...Array<Role>(saboteurs).fill("saboteur"), ...Array<Role>(seats.length - saboteurs).fill("explorer")]);

  const abilities = shuffle((Object.keys(ABILITY_COUNTS) as AbilityType[]).flatMap(type => Array<AbilityType>(ABILITY_COUNTS[type]).fill(type)));
  const dealt = ABILITIES_DEALT[seats.length];
  state.deck = shuffle(TUNNEL_CARDS.flatMap(([sides, count]) => Array<string>(count).fill(sides)));

  const goalTypes = shuffle<GoalType>(["gold", "monster", "monster"]);
  state.goals = GOAL_CELLS.map((cell, index) => ({ cell, type: goalTypes[index], revealed: false }));

  state.players = seats.map((seat, index) => ({
    id: seat.id, username: seat.username, role: roles[index],
    tunnels: state.deck.splice(0, HAND_SIZE), abilities: abilities.splice(0, dealt),
    pickaxeBroken: false, lanternBroken: false, knownGoals: {}, knownDwarves: {}
  }));
  // Saboteurs see the goals and each other before play starts.
  for (const player of state.players) {
    if (player.role !== "saboteur") continue;
    state.goals.forEach((goal, index) => { player.knownGoals[index] = goal.type; });
    for (const mate of state.players) if (mate.role === "saboteur") player.knownDwarves[mate.id] = "saboteur";
  }
  state.row = abilities;
  state.tunnels = {};
  state.gems = [...GEM_CELLS];
  state.monsters = [];
  state.monsterQueue = [];
  state.monsterOptions = [];
  state.log = [];
  state.winner = null;
  state.endReason = null;
  state.recorded = false;
  state.turn = randomInt(state.players.length);
  state.step = "turn";
  state.phase = "playing";
  state.round += 1;
  state.turnLog = [];
  state.lastTurn = [];
  addLog(state, `${current(state).username} starts.`);
  skipEmptyHands(state);
}

// A dwarf without cards loses their turn.
function skipEmptyHands(state: SaboteurState) {
  for (let i = 0; i < state.players.length; i++) {
    const player = current(state);
    if (player.tunnels.length + player.abilities.length > 0) return;
    addLog(state, `${player.username} has no cards and is skipped.`);
    state.turn = (state.turn + 1) % state.players.length;
  }
}

// Runs the monsters one by one. Stops when the player whose turn it is must choose between equally short routes.
function moveMonsters(state: SaboteurState) {
  while (state.monsterQueue.length > 0) {
    const index = state.monsterQueue[0];
    const options = monsterOptions(state, state.monsters[index]);
    if (options.length === 0) {
      state.monsterQueue.shift();
    } else if (options.length === 1) {
      state.monsterQueue.shift();
      if (moveMonster(state, index, options[0])) return;
    } else {
      state.monsterOptions = options;
      state.step = "monster";
      return;
    }
  }
  state.monsterOptions = [];
  nextTurn(state);
}

function monsterOptions(state: SaboteurState, at: number): number[] {
  const dist = distances(state);
  let best = Infinity;
  let options: number[] = [];
  const consider = (cell: number) => {
    const d = dist.get(cell);
    if (d === undefined) return;
    if (d < best) { best = d; options = [cell]; } else if (d === best) options.push(cell);
  };
  if (goalAt(state, at)) {
    // Still sitting on the goal card: it can step into any tunnel that opens onto it.
    for (const side of SIDES) {
      const next = neighbour(at, side);
      if (next !== null && state.tunnels[next]?.includes(OPPOSITE[side])) consider(next);
    }
  } else {
    const here = dist.get(at);
    if (here === undefined) return [];
    const sides = sidesAt(state, at)!;
    for (const side of SIDES) {
      const next = neighbour(at, side);
      if (next !== null && sides.includes(side) && sidesAt(state, next)?.includes(OPPOSITE[side]) && dist.get(next) === here - 1) consider(next);
    }
  }
  return options;
}

// Returns true when the saboteurs won because the monster reached the ladder.
function moveMonster(state: SaboteurState, index: number, to: number): boolean {
  state.monsters[index] = to;
  addLog(state, "A monster crawls closer to the ladder.");
  if (to === LADDER) {
    finish(state, "saboteur", "monster");
    return true;
  }
  return false;
}

function allTunnelsPlayed(state: SaboteurState) {
  return state.players.every(player => player.tunnels.length === 0);
}

// Ends the active dwarf's turn: refill the hand, move the monsters, then pass the turn on.
function endTurn(state: SaboteurState) {
  const player = current(state);
  while (player.tunnels.length < HAND_SIZE && state.deck.length > 0) player.tunnels.push(state.deck.shift()!);
  state.step = "turn";
  state.monsterQueue = state.monsters.map((_, index) => index);
  moveMonsters(state);
}

function nextTurn(state: SaboteurState) {
  if (state.phase !== "playing") return;
  if (allTunnelsPlayed(state)) {
    finish(state, "saboteur", "tunnels");
    return;
  }
  state.lastTurn = state.turnLog ?? [];
  state.turnLog = [];
  state.turn = (state.turn + 1) % state.players.length;
  state.step = "turn";
  skipEmptyHands(state);
}

function revealGoals(state: SaboteurState, cell: number, sides: string): boolean {
  let gold = false;
  for (const side of SIDES) {
    if (!sides.includes(side)) continue;
    const next = neighbour(cell, side);
    const goal = next === null ? undefined : goalAt(state, next);
    if (!goal || goal.revealed) continue;
    goal.revealed = true;
    if (goal.type === "gold") {
      gold = true;
      addLog(state, "The tunnel reaches the gold!");
    } else {
      state.monsters.push(goal.cell);
      addLog(state, "The tunnel opens a monster's lair!");
    }
  }
  return gold;
}

export const saboteur: GameModule<SaboteurState> = {
  info: {
    id: "saboteur",
    name: "Saboteur",
    description: "Dwarves dig toward the gold, but saboteurs are among them. Explorers must reach the gold; saboteurs must wake a monster and let it reach the ladder. 4-14 players.",
    maxPlayers: MAX_PLAYERS
  },
  perViewer: true,

  create: () => ({
    phase: "lobby", round: 0, nextOrder: 0, seats: {}, players: [], turn: 0, step: "turn", deck: [], row: [], tunnels: {}, goals: [], gems: [], monsters: [],
    monsterQueue: [], monsterOptions: [], log: [], winner: null, endReason: null
  }),

  migrate(state) {
    const fresh = saboteur.create();
    for (const key of Object.keys(fresh) as (keyof SaboteurState)[]) {
      if (state[key] === undefined) (state as any)[key] = fresh[key];
    }
  },

  handle(state, actor, message, context) {
    const seat = state.seats[actor.userId];
    const me = state.players.find(player => player.id === actor.userId);
    const active = state.phase === "playing" && current(state)?.id === actor.userId;
    const name = actor.username;

    switch (message.type) {
      case "seat": {
        if (state.phase !== "lobby") return "ignore";
        if (!seat && Object.keys(state.seats).length >= MAX_PLAYERS) return { error: "The game is full." };
        if (!seat) state.seats[actor.userId] = { id: actor.userId, username: actor.username, order: state.nextOrder++ };
        return "save";
      }
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
      case "start": {
        if (!actor.isHost || state.phase !== "lobby") return "ignore";
        const count = Object.keys(state.seats).length;
        if (count < MIN_PLAYERS) return { error: `At least ${MIN_PLAYERS} players are needed.` };
        startGame(state);
        return "save";
      }
      case "place": {
        if (!active || state.step !== "turn" || !me) return "ignore";
        const { index, rot, cell } = message;
        if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index >= me.tunnels.length) return "ignore";
        if ((rot !== 0 && rot !== 1) || typeof cell !== "number" || !Number.isInteger(cell)) return "ignore";
        if (me.pickaxeBroken || me.lanternBroken) return { error: "Your pickaxe or lantern is broken, so you cannot place tunnels." };
        const sides = orient(me.tunnels[index], rot);
        if (cell < 0 || cell >= ROWS * COLS || !canPlace(state, cell, sides, distances(state))) return { error: "That tunnel does not fit there." };
        me.tunnels.splice(index, 1);
        state.tunnels[cell] = sides;
        addLog(state, `${name} placed a tunnel.`);
        if (revealGoals(state, cell, sides)) {
          finish(state, "explorer", "gold");
          return "save";
        }
        const gem = state.gems.indexOf(cell);
        if (gem >= 0) {
          state.gems.splice(gem, 1);
          if (state.row.length > 0 && state.players.length > 1) {
            state.step = "gift";
            addLog(state, `${name} found a gem and may hand out a card from The Shop.`);
            return "save";
          }
        }
        endTurn(state);
        return "save";
      }
      case "pass": {
        if (!active || state.step !== "turn" || !me) return "ignore";
        if (me.tunnels.length > 0) {
          const { index } = message;
          if (typeof index !== "number" || !Number.isInteger(index) || index < 0 || index >= me.tunnels.length) return "ignore";
          me.tunnels.splice(index, 1);
          addLog(state, `${name} passed and discarded a tunnel card.`);
        } else addLog(state, `${name} passed (no tunnel cards to discard).`);
        endTurn(state);
        return "save";
      }
      case "ability": {
        if (!active || state.step !== "turn" || !me) return "ignore";
        const card = message.card as AbilityType;
        const at = me.abilities.indexOf(card);
        if (at < 0) return "ignore";
        const target = playerOf(state, message.target);
        const spend = () => me.abilities.splice(at, 1);

        switch (card) {
          case "lookGoal": {
            const goal = message.goal;
            if (typeof goal !== "number" || !Number.isInteger(goal) || goal < 0 || goal >= state.goals.length) return "ignore";
            if (state.goals[goal].revealed) return { error: "That goal is already revealed." };
            spend();
            me.knownGoals[goal] = state.goals[goal].type;
            addLog(state, `${name} looked at a goal.`);
            break;
          }
          case "lookDwarf":
            if (!target || target.id === me.id) return { error: "Choose another dwarf." };
            spend();
            me.knownDwarves[target.id] = target.role;
            addLog(state, `${name} looked at ${target.username}'s dwarf card.`);
            break;
          case "destroyTunnel": {
            const cell = message.cell;
            if (typeof cell !== "number" || !Number.isInteger(cell) || !state.tunnels[cell]) return { error: "Choose a tunnel to destroy." };
            if (state.monsters.includes(cell)) return { error: "A monster is standing there." };
            spend();
            delete state.tunnels[cell];
            addLog(state, `${name} destroyed a tunnel.`);
            break;
          }
          case "destroyPickaxe":
          case "destroyLantern": {
            const key = card === "destroyPickaxe" ? "pickaxeBroken" : "lanternBroken";
            if (!target) return { error: "Choose a dwarf." };
            if (target[key]) return { error: `${target.username} already has that broken.` };
            spend();
            target[key] = true;
            addLog(state, `${name} broke ${target.username}'s ${card === "destroyPickaxe" ? "pickaxe" : "lantern"}.`);
            break;
          }
          case "fixPickaxe":
          case "fixLantern": {
            const key = card === "fixPickaxe" ? "pickaxeBroken" : "lanternBroken";
            if (!target || target.id === me.id) return { error: "Choose another dwarf." };
            if (!target[key]) return { error: `${target.username} has nothing to fix.` };
            spend();
            target[key] = false;
            addLog(state, `${name} fixed ${target.username}'s ${card === "fixPickaxe" ? "pickaxe" : "lantern"}.`);
            break;
          }
          default:
            return "ignore";
        }
        endTurn(state);
        return "save";
      }
      case "gift": {
        if (!active || state.step !== "gift") return "ignore";
        const target = playerOf(state, message.target);
        const at = state.row.indexOf(message.card as AbilityType);
        if (!target || target.id === actor.userId || at < 0) return { error: "Pick a card and another dwarf." };
        state.row.splice(at, 1);
        target.abilities.push(message.card as AbilityType);
        addLog(state, `${name} gave the ${ABILITY_NAMES[message.card as AbilityType]} card to ${target.username}.`);
        endTurn(state);
        return "save";
      }
      case "skipgift":
        if (!active || state.step !== "gift") return "ignore";
        endTurn(state);
        return "save";
      case "monster": {
        if (!active || state.step !== "monster") return "ignore";
        const { cell } = message;
        if (typeof cell !== "number" || !state.monsterOptions.includes(cell)) return "ignore";
        const index = state.monsterQueue.shift()!;
        state.monsterOptions = [];
        state.step = "turn";
        if (moveMonster(state, index, cell)) return "save";
        moveMonsters(state);
        return "save";
      }
      case "forceskip": {
        // Lets the host unstick the game when the dwarf whose turn it is has left.
        if (!actor.isHost || state.phase !== "playing" || context.connected.has(current(state).id)) return "ignore";
        const player = current(state);
        if (state.step === "monster") {
          const index = state.monsterQueue.shift()!;
          const cell = state.monsterOptions[randomInt(state.monsterOptions.length)];
          state.monsterOptions = [];
          state.step = "turn";
          if (!moveMonster(state, index, cell)) moveMonsters(state);
        } else if (state.step === "gift") {
          endTurn(state);
        } else {
          const cards = player.tunnels.length + player.abilities.length;
          const pick = randomInt(cards);
          if (pick < player.tunnels.length) player.tunnels.splice(pick, 1);
          else player.abilities.splice(pick - player.tunnels.length, 1);
          addLog(state, `${player.username} was skipped by the host.`);
          endTurn(state);
        }
        return "save";
      }
      case "exit":
        if (!actor.isHost || state.phase !== "results") return "ignore";
        resetToLobby(state);
        return "save";
      case "abort":
        if (!actor.isHost || state.phase !== "playing") return "ignore";
        resetToLobby(state);
        return "save";
      default:
        return "ignore";
    }
  },

  disconnect(state, userId) {
    // Once the game is running every dwarf keeps their seat so they can come back.
    if (state.phase !== "lobby" || !state.seats[userId]) return false;
    delete state.seats[userId];
    return true;
  },

  participants: state => new Set(state.phase === "lobby" ? Object.keys(state.seats) : state.players.map(player => player.id)),

  takeResult(state) {
    if (state.phase !== "results" || state.recorded || !state.winner) return null;
    state.recorded = true;
    return { players: state.players.map(player => ({ userId: player.id, role: player.role, won: player.role === state.winner })) };
  },

  snapshot(state, viewerId, connected) {
    const playing = state.phase !== "lobby";
    const me = state.players.find(player => player.id === viewerId);
    const showRoles = state.phase === "results";
    const myTurn = state.phase === "playing" && current(state)?.id === viewerId;

    let placeable: Record<number, Record<number, number[]>> | null = null;
    if (myTurn && me && state.step === "turn" && !me.pickaxeBroken && !me.lanternBroken) {
      placeable = {};
      const cache = new Map<string, Record<number, number[]>>();
      me.tunnels.forEach((sides, index) => {
        if (!cache.has(sides)) cache.set(sides, placements(state, sides));
        placeable![index] = cache.get(sides)!;
      });
    }

    return {
      phase: state.phase,
      round: state.round,
      minPlayers: MIN_PLAYERS,
      seats: Object.values(state.seats).sort((a, b) => a.order - b.order).map(({ id, username }) => ({ id, username, connected: connected.has(id) })),
      rows: ROWS,
      cols: COLS,
      ladder: LADDER,
      abilityNames: ABILITY_NAMES,
      players: playing ? state.players.map(player => ({
        id: player.id, username: player.username, connected: connected.has(player.id),
        tunnels: player.tunnels.length, abilities: player.abilities.length,
        pickaxeBroken: player.pickaxeBroken, lanternBroken: player.lanternBroken,
        // Roles stay hidden until the game ends, except your own and the ones you have looked at.
        role: showRoles ? player.role : player.id === viewerId ? player.role : me?.knownDwarves[player.id] ?? null
      })) : [],
      turnId: state.phase === "playing" ? current(state)?.id ?? null : null,
      step: state.step,
      tunnels: Object.entries(state.tunnels).map(([cell, sides]) => ({ cell: Number(cell), sides })),
      goals: state.goals.map((goal, index) => ({
        index, cell: goal.cell,
        // Public once revealed (or when the game is over); otherwise only what this dwarf has learned.
        type: goal.revealed || showRoles ? goal.type : me?.knownGoals[index] ?? null,
        revealed: goal.revealed
      })),
      gems: state.gems,
      monsters: state.monsters,
      lastTurn: state.lastTurn ?? [],
      monsterNext: state.phase === "playing" ? state.monsters.flatMap(from => monsterOptions(state, from).map(to => ({ from, to }))) : [],
      row: state.row,
      deckCount: state.deck.length,
      log: state.log,
      winner: state.winner,
      endReason: state.endReason,
      me: me ? { role: me.role, tunnels: me.tunnels, abilities: me.abilities } : null,
      placeable,
      monsterOptions: myTurn && state.step === "monster" ? state.monsterOptions : null
    };
  }
};
