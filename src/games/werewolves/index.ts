import type { GameModule } from "../types";

type RoleId =
  | "big-bad-wolf" | "cloaked-wolf" | "wise-wolf" | "throatcutter" | "sniffer"
  | "wolfchild" | "fool" | "cupido" | "elder" | "hunter" | "alchemist"
  | "old-knight" | "judge" | "little-girl" | "guard" | "bearman" | "seer";
type Faction = "werewolf" | "villager" | "neutral";
type Phase = "lobby" | "playing" | "results";
type StepPhase = "before-first-night" | "night" | "day";
type ActorMode = "gm" | "role" | "wolves" | "living" | "mayor" | "hunter" | "judge" | "voter" | "executioner";
type MoonCard = "ghost" | "executioner" | "strict-sentence" | "mistrust" | "in-need-of-aid" | "buried" | "good-manners";
type ActionValue = Record<string, unknown>;

interface Seat {
  id: string;
  username: string;
  order: number;
  role?: RoleId;
  alive: boolean;
  publiclyRevealed?: boolean;
}
interface Step {
  id: string;
  phase: StepPhase;
  day: number;
  kind: string;
  prompt: string;
  actorMode: ActorMode;
  role?: RoleId;
  actorId?: string;
  required?: boolean;
  optional?: boolean;
  voterId?: string;
  targetId?: string;
  data?: Record<string, unknown>;
}

interface DeathRecord {
  userId: string;
  reason: string;
  order: number;
  revealedRole?: RoleId;
}

interface WerewolvesState {
  phase: Phase;
  day: number;
  firstNight: boolean;
  nightActive: boolean;
  nextOrder: number;
  seats: Record<string, Seat>;
  gmId: string | null;
  gmName: string | null;
  settings: {
    rolePool: RoleId[];
    wolfCount: number;
    skipLynch: boolean;
    moonCards: boolean;
  };
  steps: Step[];
  submissions: Record<string, Record<string, ActionValue>>;
  overrides: Record<string, ActionValue>;
  actions: Record<string, ActionValue>;
  privateResults: Record<string, Record<string, unknown>>;
  events: string[];
  townName: string;
  mayorId: string | null;
  mayorCandidates: string[];
  lovers: [string, string] | null;
  wolfchildTarget: string | null;
  deaths: DeathRecord[];
  nightVisitors: string[];
  night: {
    wolfTarget: string | null;
    oldKnightTarget: string | null;
    oldKnightVictim: string | null;
    alchemistSaveTarget: string | null;
    poisonTarget: string | null;
    wolfKnightVictim: string | null;
  };
  throatcutterUsed: boolean;
  bigBadUsed: boolean;
  potionAvailable: boolean;
  poisonAvailable: boolean;
  silencedId: string | null;
  absentId: string | null;
  absentThroughNight: number;
  buried: boolean;
  goodManners: boolean;
  villagerAbilitiesLost: boolean;
  interruptedIds: string[];
  moonDeck: MoonCard[];
  moonOffers: MoonCard[];
  currentMoon: MoonCard | null;
  executionerId: string | null;
  lynchRemaining: string[];
  lynchTarget: string | null;
  judgeUsed: boolean;
  strictFirstWasWolf: boolean | null;
  winner: "villagers" | "werewolves" | "lovers" | "draw" | null;
  winners: string[];
  individualWinners: string[];
  resultRecorded?: boolean;
}

const ROLE_INFO: Record<RoleId, { name: string; faction: Faction; icon: string; rule: string }> = {
  "big-bad-wolf": { name: "Big Bad Wolf", faction: "werewolf", icon: "big-bad-wolf.svg", rule: "Once per game, before voting starts during the day, reveal your role and kill one player outright." },
  "cloaked-wolf": { name: "Cloaked Wolf", faction: "werewolf", icon: "cloaked-wolf.svg", rule: "The Guard's dog, Bearman's bear, and Seer cannot detect you." },
  "wise-wolf": { name: "Wise Wolf", faction: "werewolf", icon: "wise-wolf.svg", rule: "While alive, warns the Werewolves when they target the Old Knight, a protected player, the Hunter, or the Elder. The warning does not prevent the attack." },
  throatcutter: { name: "Throatcutter", faction: "werewolf", icon: "throatcutter.svg", rule: "Once per game after the Werewolves choose a target, you may silence one player for the next day. Silenced players may still vote." },
  sniffer: { name: "Sniffer", faction: "werewolf", icon: "sniffer.svg", rule: "Wakes alone before the Werewolves and checks a player's role. On the first night, a Werewolf result is thumbs-down and you may reconsider." },
  wolfchild: { name: "Wolfchild", faction: "neutral", icon: "wolfdog.svg", rule: "On the first night, choose a player to imitate. You stay Wolfchild; you count as a Villager while they live and a Werewolf as soon as they die." },
  fool: { name: "Fool", faction: "neutral", icon: "fool.svg", rule: "If selected for lynching, reveal your role and win individually without dying. You lose if killed by Werewolves; you do not affect faction wins." },
  cupido: { name: "Cupido", faction: "villager", icon: "cupido.svg", rule: "On the first night, choose two players as lovers. If either dies, the other dies of heartbreak. Lovers win together when both live at a faction win, or if they are the only two alive." },
  elder: { name: "Elder", faction: "villager", icon: "elder.svg", rule: "Werewolves cannot kill you. If another cause kills you, Villagers lose their role abilities for the rest of the game." },
  hunter: { name: "Hunter", faction: "villager", icon: "hunter.svg", rule: "When killed, you may shoot and kill another player. Night deaths trigger your shot when revealed in the morning." },
  alchemist: { name: "Alchemist", faction: "villager", icon: "alchemist.svg", rule: "Once per game each, use a potion to save the Werewolves' target (or the Old Knight when protection triggered) and poison to kill a chosen player. You may use both in one night." },
  "old-knight": { name: "Old Knight", faction: "villager", icon: "old-knight.svg", rule: "Each night protect another player. If Werewolves attack them, the attack is prevented, you die, and the first living Werewolf to their left dies. The Alchemist may save you, but not that Werewolf." },
  judge: { name: "Judge", faction: "villager", icon: "judge.svg", rule: "After a lynch result and before the death, reveal your role to become mayor and restart the vote." },
  "little-girl": { name: "Little Girl", faction: "villager", icon: "little-girl.svg", rule: "Each night choose a player; the GM privately reports whether they visited anyone." },
  guard: { name: "Guard", faction: "villager", icon: "guard.svg", rule: "Each night choose a player. The dog gives thumbs-up if they or either closest living neighbor is a Werewolf, except a Cloaked Wolf; otherwise thumbs-down." },
  bearman: { name: "Bearman", faction: "villager", icon: "bearman.svg", rule: "At dawn, growl if either closest living neighbor is a Werewolf, except a Cloaked Wolf." },
  seer: { name: "Seer", faction: "villager", icon: "seer.svg", rule: "Each night view another player's role. Cloaked Wolf, Wolfchild, Fool, and Bearman return thumbs-down." }
};

const ROLE_IDS = Object.keys(ROLE_INFO) as RoleId[];
const roleCard = (role: RoleId) => ({
  id: role,
  ...ROLE_INFO[role],
  iconPath: `/content/werewolf/${ROLE_INFO[role].icon}`
});
const WOLF_ROLES = ROLE_IDS.filter(role => ROLE_INFO[role].faction === "werewolf");
const MOON_CARDS: MoonCard[] = ["ghost", "executioner", "strict-sentence", "mistrust", "in-need-of-aid", "buried", "good-manners"];
const MOON_NAMES: Record<MoonCard, string> = {
  ghost: "Ghost",
  executioner: "Executioner",
  "strict-sentence": "Strict Sentence",
  mistrust: "Mistrust",
  "in-need-of-aid": "In Need of Aid",
  buried: "Buried",
  "good-manners": "Good Manners"
};
const MOON_RULES: Record<MoonCard, string> = {
  ghost: "Offered only after a death. The ghost of the first player killed visits town and points at one player; the meaning is for the players to interpret.",
  executioner: "Everyone votes for an executioner; the mayor breaks ties. The chosen executioner alone chooses and carries out a lynching.",
  "strict-sentence": "If the first lynched player is not a Werewolf, immediately hold a second lynch.",
  mistrust: "Everyone secretly votes for up to their two closest friends. Any living player who receives no votes is lynched that evening.",
  "in-need-of-aid": "The mayor sends one player away for the rest of the day and following night. They cannot vote, use night powers, or be targeted.",
  buried: "From this point onward, the village is not told the identities of dead players.",
  "good-manners": "Each player gets one uninterrupted speaking turn. The GM records interruptions; an interrupter cannot vote, and the mayor controls their vote."
};
const RULES = [
  "The Villagers win when no Werewolves remain; the Werewolves win when no Villagers remain. The Fool is ignored when checking these factions. If neither faction remains, the game is a draw.",
  "The Wolfchild counts as a Villager while their chosen target lives and as a Werewolf once that target dies. If both lovers are alive when a faction wins, they win together. The lovers also win if they are the only two players left alive.",
  "The GM confirms each step and adjudicates unclear cases. Role actions and private results are visible only to the player, relevant Werewolves, and GM."
];

const randomInt = (max: number) => {
  const limit = Math.floor(0x100000000 / max) * max;
  const buffer = new Uint32Array(1);
  do crypto.getRandomValues(buffer); while (buffer[0] >= limit);
  return buffer[0] % max;
};

function shuffle<T>(values: T[]): T[] {
  for (let i = values.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [values[i], values[j]] = [values[j], values[i]];
  }
  return values;
}

const aliveSeats = (state: WerewolvesState) => Object.values(state.seats).filter(seat => seat.alive).sort((a, b) => a.order - b.order);
const seat = (state: WerewolvesState, id: unknown) => typeof id === "string" ? state.seats[id] : undefined;
const roleOf = (state: WerewolvesState, id: string) => state.seats[id]?.role;
const isAlive = (state: WerewolvesState, id: unknown) => !!seat(state, id)?.alive;
const isAbsent = (state: WerewolvesState, id: string) => {
  if (state.absentId !== id) return false;
  if (state.absentThroughNight >= state.day) return true;
  return state.nightActive && state.day === state.absentThroughNight + 1;
};

function isWolfAligned(state: WerewolvesState, id: string): boolean {
  const player = state.seats[id];
  if (!player?.role) return false;
  if (WOLF_ROLES.includes(player.role)) return true;
  return player.role === "wolfchild" && !!state.wolfchildTarget && !isAlive(state, state.wolfchildTarget);
}

function factionOf(state: WerewolvesState, id: string): Faction {
  const role = roleOf(state, id);
  if (role === "wolfchild") return isWolfAligned(state, id) ? "werewolf" : "villager";
  return role ? ROLE_INFO[role].faction : "neutral";
}

function addEvent(state: WerewolvesState, text: string) {
  state.events.push(text);
  if (state.events.length > 100) state.events.splice(0, state.events.length - 100);
}

function step(state: WerewolvesState, phase: StepPhase, kind: string, prompt: string, actorMode: ActorMode, options: Partial<Step> = {}): Step {
  return {
    id: `${phase}-${state.day}-${kind}-${crypto.randomUUID()}`,
    phase,
    day: state.day,
    kind,
    prompt,
    actorMode,
    ...options
  };
}

function pushRoleStep(state: WerewolvesState, steps: Step[], role: RoleId, kind: string, prompt: string, phase: StepPhase, options: Partial<Step> = {}) {
  const holder = Object.values(state.seats).find(player => player.alive && player.role === role && !isAbsent(state, player.id));
  if (holder) steps.push(step(state, phase, kind, prompt, "role", { role, actorId: holder.id, required: true, ...options }));
}

function newGameSteps(state: WerewolvesState) {
  state.steps = [
    step(state, "before-first-night", "mayor-nominations", "Ask who wants to run for mayor.", "living", { required: true }),
    step(state, "before-first-night", "mayor-speeches", "Give each mayoral candidate time to make a speech.", "gm"),
    step(state, "before-first-night", "mayor-election", "Hold the mayoral election and record the elected mayor.", "living", { required: true }),
    step(state, "before-first-night", "town-name", "The mayor names the town.", "mayor", { required: true })
  ];
}

function startNight(state: WerewolvesState) {
  state.nightActive = true;
  state.steps = [];
  delete state.actions.nightResolutionSummary;
  state.night = { wolfTarget: null, oldKnightTarget: null, oldKnightVictim: null, alchemistSaveTarget: null, poisonTarget: null, wolfKnightVictim: null };
  state.nightVisitors = [];
  const night: Step[] = [];
  if (state.firstNight) {
    pushRoleStep(state, night, "cupido", "lovers", "Cupido chooses two players to become lovers.", "night", { data: { targets: 2 } });
    pushRoleStep(state, night, "wolfchild", "wolfchild-target", "The Wolfchild chooses a player to imitate.", "night");
  }
  pushRoleStep(state, night, "old-knight", "old-knight-target", "The Old Knight chooses a player to protect.", "night");
  pushRoleStep(state, night, "guard", "guard-check", "The Guard chooses a player for the dog to check.", "night");
  pushRoleStep(state, night, "seer", "seer-check", "The Seer chooses a player to view.", "night");
  pushRoleStep(state, night, "sniffer", "sniffer-check", "The Sniffer chooses a player to check.", "night");
  if (aliveSeats(state).some(player => isWolfAligned(state, player.id) && !isAbsent(state, player.id))) {
    night.push(step(state, "night", "wolf-target", "Each living Werewolf submits a target. Record a target only if they agree unanimously, or override/skip the attack.", "wolves", { required: true }));
  }
  if (!state.throatcutterUsed) pushRoleStep(state, night, "throatcutter", "silence-target", "The Throatcutter may silence one player for the next day or pass.", "night", { optional: true });
  if (roleAlive(state, "alchemist") && (state.potionAvailable || state.poisonAvailable)) {
    night.push(step(state, "night", "alchemist-actions", "The Alchemist may use either or both remaining potions, then confirm.", "role", {
      role: "alchemist",
      actorId: roleHolderId(state, "alchemist") ?? undefined,
      required: true
    }));
  }
  pushRoleStep(state, night, "little-girl", "little-girl-check", "The Little Girl chooses a player. Report whether they visited anyone tonight.", "night");
  night.push(step(state, "night", "night-deaths", "Resolve the Werewolves' attack, Old Knight protection, and Alchemist actions. Then reveal deaths in random order.", "gm"));
  state.steps = night;
}

function roleAlive(state: WerewolvesState, role: RoleId) {
  return !state.villagerAbilitiesLost || ROLE_INFO[role].faction !== "villager"
    ? Object.values(state.seats).some(player => player.alive && player.role === role && !isAbsent(state, player.id))
    : false;
}

function roleHolderId(state: WerewolvesState, role: RoleId) {
  return roleAlive(state, role)
    ? Object.values(state.seats).find(player => player.alive && player.role === role && !isAbsent(state, player.id))?.id
    : undefined;
}

function getStep(state: WerewolvesState) {
  return state.steps[0];
}

function aliveVoters(state: WerewolvesState) {
  return aliveSeats(state).filter(player => !isAbsent(state, player.id));
}

function circularNeighbor(state: WerewolvesState, id: string, direction: 1 | -1) {
  const living = aliveSeats(state);
  if (living.length <= 1) return undefined;
  const index = living.findIndex(player => player.id === id);
  if (index < 0) return undefined;
  return living[(index + direction + living.length) % living.length];
}

function wolfToLeftOf(state: WerewolvesState, id: string) {
  const ordered = aliveSeats(state);
  const start = ordered.findIndex(player => player.id === id);
  if (start < 0) return undefined;
  for (let offset = 1; offset < ordered.length; offset++) {
    const candidate = ordered[(start - offset + ordered.length) % ordered.length];
    if (isWolfAligned(state, candidate.id)) return candidate;
  }
  return undefined;
}

function targetIsElder(state: WerewolvesState, id: string | null) {
  return !!id && roleOf(state, id) === "elder" && isAlive(state, id);
}

function wiseWolfWarning(state: WerewolvesState, targetId: string | null) {
  if (!targetId || !roleAlive(state, "wise-wolf")) return false;
  return roleOf(state, targetId) === "old-knight"
    || targetId === state.night.oldKnightTarget
    || roleOf(state, targetId) === "hunter"
    || roleOf(state, targetId) === "elder";
}

function roleResult(state: WerewolvesState, step: Step, value: ActionValue) {
  const actorId = step.actorId;
  if (!actorId) return;
  if (!state.privateResults[actorId]) state.privateResults[actorId] = {};
  const targetId = typeof value.targetId === "string" ? value.targetId : "";
  const targetRole = roleOf(state, targetId);
  switch (step.kind) {
    case "guard-check": {
      const neighborIds = [circularNeighbor(state, targetId, -1)?.id, circularNeighbor(state, targetId, 1)?.id];
      const detected = [targetId, ...neighborIds].some(id => !!id && isWolfAligned(state, id) && roleOf(state, id) !== "cloaked-wolf");
      state.privateResults[actorId][step.kind] = { result: detected ? "thumbs-up" : "thumbs-down", targetId };
      break;
    }
    case "seer-check": {
      const hidden = targetRole === "cloaked-wolf" || targetRole === "wolfchild" || targetRole === "fool" || targetRole === "bearman";
      state.privateResults[actorId][step.kind] = hidden ? { result: "thumbs-down", targetId } : { result: "role", role: targetRole, targetId };
      break;
    }
    case "sniffer-check": {
      const isWolf = !!targetRole && (ROLE_INFO[targetRole].faction === "werewolf" || (targetRole === "wolfchild" && isWolfAligned(state, targetId)));
      const result = state.firstNight && isWolf ? { result: "thumbs-down" } : { result: "role", role: targetRole };
      state.privateResults[actorId][step.kind] = { ...result, targetId };
      break;
    }
    case "little-girl-check": {
      const visited = state.nightVisitors.includes(targetId);
      state.privateResults[actorId][step.kind] = { targetId, visited };
      break;
    }
  }
}

function moonEligibility(state: WerewolvesState): MoonCard[] {
  return state.moonDeck.filter(card => card !== "ghost" || state.deaths.length > 0);
}

function currentWolfSubmissions(state: WerewolvesState, step: Step) {
  const submissions = state.submissions[step.id] ?? {};
  return Object.entries(submissions)
    .filter(([id]) => isWolfAligned(state, id) && !isAbsent(state, id))
    .map(([userId, value]) => ({ userId, targetId: typeof value.targetId === "string" ? value.targetId : null }));
}

function requireRecord(value: unknown): ActionValue | null {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? value as ActionValue : null;
}

function validateTarget(state: WerewolvesState, value: ActionValue, key = "targetId", options: { another?: boolean; allowAbsent?: boolean } = {}) {
  const id = value[key];
  if (!isAlive(state, id)) return `Choose a living player.`;
  if (options.another && typeof id === "string" && id === value.userId) return "You must choose another player.";
  if (!options.allowAbsent && typeof id === "string" && isAbsent(state, id)) return "That player is absent and cannot be targeted.";
  return null;
}
function validateValue(state: WerewolvesState, step: Step, value: ActionValue, actorId: string): string | null {
  const hasTarget = (another = false) => validateTarget(state, { ...value, userId: actorId }, "targetId", { another });
  const targetId = typeof value.targetId === "string" ? value.targetId : null;
  switch (step.kind) {
    case "mayor-nominations":
      if (typeof value.candidate !== "boolean") return "Choose whether to run for mayor.";
      break;
    case "mayor-election":
    case "new-mayor":
      if (step.kind === "mayor-election" && !state.mayorCandidates.includes(String(value.targetId))) return "Choose a nominated mayoral candidate.";
      if (step.kind === "new-mayor" && (!isAlive(state, targetId) || isAbsent(state, targetId ?? ""))) return "Choose a living player who is not absent as mayor.";
      break;
    case "town-name":
      if (typeof value.name !== "string" || !value.name.trim() || value.name.trim().length > 60) return "Enter a town name (1-60 characters).";
      break;
    case "lovers": {
      const ids = value.targetIds;
      if (!Array.isArray(ids) || ids.length !== 2 || ids[0] === ids[1] || !ids.every(id => isAlive(state, id) && !isAbsent(state, String(id)))) return "Choose two distinct living players.";
      break;
    }
    case "wolfchild-target":
    case "old-knight-target":
    case "guard-check":
    case "seer-check":
    case "sniffer-check":
    case "little-girl-check":
    case "silence-target":
    case "ghost-choice":
    case "aid-target":
    case "hunter-shot":
    case "executioner-lynch":
    case "lynch-spare":
      if (value.pass === true && (step.kind === "hunter-shot" || step.kind === "silence-target")) break;
      {
        const error = hasTarget(["old-knight-target", "seer-check", "hunter-shot", "lynch-spare"].includes(step.kind));
        if (error) return error;
      }
      if (step.kind === "lynch-spare") {
        const remaining = state.lynchRemaining;
        if (!remaining.includes(targetId ?? "") || targetId === step.voterId) return "Choose another player still in the lynch vote.";
      }
      if (step.kind === "old-knight-target" && targetId === step.actorId) return "The Old Knight cannot protect themself.";
      if (step.kind === "seer-check" && targetId === step.actorId) return "The Seer must view another player.";
      if (step.kind === "hunter-shot" && targetId === step.actorId) return "The Hunter must shoot another player.";
      if (step.kind === "lynch-spare" && step.voterId !== actorId && !state.interruptedIds.includes(step.voterId ?? "")) return "Only the player whose turn it is may choose.";
      break;
    case "wolf-target":
      if (value.pass === true) break;
      return hasTarget();
    case "alchemist-actions": {
      const save = value.saveTarget;
      const poison = value.poisonTarget;
      if (value.usePotion === true && !state.potionAvailable) return "The potion has already been used.";
      if (value.usePoison === true && !state.poisonAvailable) return "The poison has already been used.";
      if (value.usePotion === true) {
        if (save !== state.night.wolfTarget && save !== state.night.oldKnightVictim) return "Choose the Werewolves' target or the Old Knight when their protection triggered.";
        if (save === state.night.wolfTarget && (targetIsElder(state, state.night.wolfTarget) || state.night.oldKnightVictim !== null)) return "The potion cannot save that target in this situation.";
      }
      if (value.usePoison === true) {
        if (typeof poison !== "string" || !isAlive(state, poison) || isAbsent(state, poison)) return "Choose a living player to poison.";
      }
      break;
    }
    case "big-bad-wolf":
      if (value.pass !== true) return hasTarget();
      break;
    case "skip-vote":
      if (typeof value.skip !== "boolean") return "Vote yes or no on skipping the lynch.";
      break;
    case "moon-offer":
      if (state.moonOffers.length === 0) {
        if (value.pass !== true) return "There are no Moon cards to choose.";
      } else if (!state.moonOffers.includes(value.card as MoonCard)) {
        return "Choose one of the offered Moon cards.";
      }
      break;
    case "executioner-vote":
      return hasTarget();
    case "executioner-tie":
      if (!Array.isArray(step.data?.candidates) || !step.data.candidates.includes(value.targetId)) return "Choose one of the tied executioner candidates.";
      break;
    case "mistrust-vote":
      {
        const available = aliveVoters(state).filter(player => player.id !== actorId);
        const expected = Math.min(2, available.length);
        if (!Array.isArray(value.targetIds) || value.targetIds.length !== expected || new Set(value.targetIds).size !== expected
          || !value.targetIds.every(id => available.some(player => player.id === id))) return `Choose ${expected} distinct living player(s) other than yourself.`;
      }
      break;
    case "judge-intervention":
      if (typeof value.reveal !== "boolean") return "Choose whether to reveal your Judge role.";
      break;
    case "good-manners-violation":
      if (!isAlive(state, value.userId)) return "Choose a living player.";
      break;
    case "lynch-result":
      if (!isAlive(state, targetId)) return "The lynch target is no longer alive.";
      break;
    default:
      break;
  }
  return null;
}

function actorsForStep(state: WerewolvesState, current: Step): string[] {
  switch (current.actorMode) {
    case "role":
      return current.actorId && isAlive(state, current.actorId) ? [current.actorId] : [];
    case "wolves":
      return aliveSeats(state).filter(player => isWolfAligned(state, player.id) && !isAbsent(state, player.id)).map(player => player.id);
    case "living":
      return aliveVoters(state).map(player => player.id);
    case "mayor":
      return state.mayorId && isAlive(state, state.mayorId) && !isAbsent(state, state.mayorId) ? [state.mayorId] : [];
    case "hunter":
    case "judge":
      return current.actorId ? [current.actorId] : [];
    case "voter":
      return current.voterId ? [current.voterId] : [];
    case "executioner":
      return state.executionerId && isAlive(state, state.executionerId) ? [state.executionerId] : [];
    default:
      return [];
  }
}

function activeRoleActionsAllowed(state: WerewolvesState, actorId: string, current: Step) {
  if (current.actorMode === "hunter") return current.actorId === actorId;
  if (!isAlive(state, actorId) || isAbsent(state, actorId)) return false;
  if (current.actorMode === "wolves") return isWolfAligned(state, actorId);
  if (current.actorMode === "role") return current.actorId === actorId && roleOf(state, actorId) === current.role;
  return actorsForStep(state, current).includes(actorId);
}

function beginLynch(state: WerewolvesState) {
  state.lynchRemaining = aliveVoters(state).map(player => player.id);
  if (state.lynchRemaining.length <= 2) {
    const mayorId = state.mayorId && state.lynchRemaining.includes(state.mayorId) ? state.mayorId : null;
    const targetId = mayorId
      ? state.lynchRemaining.find(id => id !== mayorId) ?? null
      : state.mayorId && isAbsent(state, state.mayorId) && state.lynchRemaining.length === 2
        ? null
        : state.lynchRemaining[0] ?? null;
    state.steps.unshift(step(state, "day", "lynch-result", "The last player is selected for lynching.", "gm", {
      required: true,
      ...(targetId ? { targetId, data: { targetId } } : {})
    }));
    return;
  }
  const mayor = state.mayorId && state.lynchRemaining.includes(state.mayorId) ? state.mayorId : null;
  const first = mayor ?? state.lynchRemaining[0];
  if (!first) {
    state.steps.unshift(step(state, "day", "day-check-after-lynch", "Check the game outcome.", "gm"));
    return;
  }
  state.steps.unshift(step(state, "day", "lynch-spare", `${state.seats[first]?.username ?? "The mayor"} chooses someone to spare.`, "voter", {
    required: true,
    voterId: first,
    data: { remaining: [...state.lynchRemaining] }
  }));
}

function appendNextLynchStep(state: WerewolvesState, previousSparedId: string) {
  const remaining = state.lynchRemaining;
  if (remaining.length <= 2) {
    const mayorId = state.mayorId && remaining.includes(state.mayorId) ? state.mayorId : null;
    const targetId = mayorId
      ? remaining.find(id => id !== mayorId) ?? null
      : state.mayorId && isAbsent(state, state.mayorId) && remaining.length === 2
        ? null
        : remaining[0] ?? null;
    state.steps.unshift(step(state, "day", "lynch-result", "The last player is selected for lynching.", "gm", {
      required: true,
      ...(targetId ? { targetId, data: { targetId } } : {})
    }));
    return;
  }
  state.steps.unshift(step(state, "day", "lynch-spare", `${state.seats[previousSparedId]?.username ?? "The spared player"} chooses someone else to spare.`, "voter", {
    required: true,
    voterId: previousSparedId,
    data: { remaining: [...state.lynchRemaining] }
  }));
}

function queueDeaths(state: WerewolvesState, ids: string[], reason: string) {
  const existing = new Set(state.steps.filter(item => item.kind === "death-reveal").map(item => item.targetId));
  const fresh = ids.filter(id => isAlive(state, id) && !existing.has(id));
  state.steps.unshift(...fresh.map(id => {
    const text = `${state.seats[id]?.username ?? "A player"} is to be revealed as killed (${reason}).`;
    return step(state, "day", "death-reveal", text, "gm", { targetId: id, data: { reason } });
  }));
}

function queueDeathEntries(state: WerewolvesState, entries: { id: string; reason: string }[]) {
  const existing = new Set(state.steps.filter(item => item.kind === "death-reveal").map(item => item.targetId));
  const fresh = entries.filter(entry => isAlive(state, entry.id) && !existing.has(entry.id));
  state.steps.unshift(...fresh.map(entry => step(state, "day", "death-reveal",
    `${state.seats[entry.id]?.username ?? "A player"} is to be revealed as killed (${entry.reason}).`,
    "gm", { targetId: entry.id, data: { reason: entry.reason } })));
}

function hasPendingDeathAction(state: WerewolvesState) {
  return state.steps.some(item => item.kind === "death-reveal" || item.kind === "hunter-shot");
}

function ensureMayorStep(state: WerewolvesState) {
  if (state.phase !== "playing" || state.steps[0]?.phase === "before-first-night" || state.mayorId || !aliveSeats(state).length || hasPendingDeathAction(state)) return;
  if (state.steps[0]?.kind !== "new-mayor") {
    state.steps.unshift(step(state, "day", "new-mayor", "The mayor has died. The GM chooses a new mayor from living players.", "gm", { required: true }));
  }
}

function privatelyReveal(state: WerewolvesState, userId: string, key: string, result: unknown) {
  state.privateResults[userId] ??= {};
  state.privateResults[userId][key] = result;
}

function savePrivateAction(state: WerewolvesState, step: Step, value: ActionValue) {
  if (step.actorId) privatelyReveal(state, step.actorId, `action:${step.kind}`, value);
}

function finishGame(state: WerewolvesState, winner: WerewolvesState["winner"], factionWinners: string[] = []) {
  state.phase = "results";
  state.winner = winner;
  state.winners = [...new Set([...state.individualWinners, ...factionWinners])];
  if (state.lovers && state.lovers.every(id => isAlive(state, id))) {
    state.winners.push(...state.lovers);
  }
  if (winner === "lovers" && state.lovers) state.winners.push(...state.lovers);
  state.winners = [...new Set(state.winners)];
  state.steps = [];
  addEvent(state, winner === "draw" ? "The game ends in a draw." : `The ${winner === "lovers" ? "lovers" : winner} win.`);
}

function getWinCheck(state: WerewolvesState) {
  const living = aliveSeats(state);
  if (state.lovers && state.lovers.every(id => isAlive(state, id)) && living.length === 2) {
    return {
      winner: "lovers" as const,
      factionWinners: [...state.lovers],
      werewolves: living.filter(player => isWolfAligned(state, player.id)).length,
      villagers: living.filter(player => factionOf(state, player.id) === "villager").length,
      living: living.length,
      reason: "The two living lovers are the only players left; they win together."
    };
  }
  const active = living.filter(player => player.role !== "fool");
  const wolves = active.filter(player => isWolfAligned(state, player.id));
  const villagers = active.filter(player => factionOf(state, player.id) === "villager");
  if (!wolves.length && !villagers.length) {
    return {
      winner: "draw" as const,
      factionWinners: [],
      werewolves: 0,
      villagers: 0,
      living: living.length,
      reason: "No Villagers or Werewolves remain; the game is a draw."
    };
  }
  if (!wolves.length) {
    return {
      winner: "villagers" as const,
      factionWinners: villagers.map(player => player.id),
      werewolves: 0,
      villagers: villagers.length,
      living: living.length,
      reason: "No Werewolves remain; the Villagers win."
    };
  }
  if (!villagers.length) {
    return {
      winner: "werewolves" as const,
      factionWinners: wolves.map(player => player.id),
      werewolves: wolves.length,
      villagers: 0,
      living: living.length,
      reason: "No Villagers remain; the Werewolves win."
    };
  }
  return {
    winner: null,
    factionWinners: [],
    werewolves: wolves.length,
    villagers: villagers.length,
    living: living.length,
    reason: `The game continues: ${wolves.length} Werewolf-aligned player(s) and ${villagers.length} Villager-aligned player(s) remain.`
  };
}

function checkWin(state: WerewolvesState): boolean {
  const result = getWinCheck(state);
  if (!result.winner) return false;
  finishGame(state, result.winner, result.factionWinners);
  return true;
}

function getSubmission(state: WerewolvesState, current: Step): ActionValue | undefined {
  const override = state.overrides[current.id];
  if (override) return override;
  const submissions = state.submissions[current.id] ?? {};
  const actor = current.actorId ?? current.voterId ?? (current.actorMode === "mayor" ? state.mayorId : null);
  return actor ? submissions[actor] : undefined;
}

function confirmRequirements(state: WerewolvesState, current: Step): string | null {
  if (!current.required) return null;
  if (state.overrides[current.id]) return null;
  if (current.actorMode === "gm") {
    if (current.kind === "new-mayor" || current.kind === "ghost-choice" || current.kind === "executioner-lynch") return "The GM must record the required player selection.";
    if (current.kind === "lynch-result" && !current.targetId) return "The GM must select the player for lynching.";
    return null;
  }
  if (current.actorMode === "mayor" && actorsForStep(state, current).length === 0) return "The absent mayor cannot act; the GM must override this step.";
  const submissions = state.submissions[current.id] ?? {};
  if (current.kind === "wolf-target") {
    const wolves = actorsForStep(state, current);
    if (!wolves.length) return null;
    if (wolves.some(id => !submissions[id])) return "Wait for every living Werewolf to submit.";
    const targets = wolves.map(id => submissions[id]?.pass === true ? null : submissions[id]?.targetId);
    if (targets.some(target => target !== targets[0])) return "The Werewolves must agree unanimously, or the GM must override/skip the attack.";
    if (targets[0] == null) return null;
    return typeof targets[0] === "string" ? null : "Wait for every living Werewolf to submit the same target.";
  }
  const actors = actorsForStep(state, current);
  if (current.kind === "lynch-result" || current.kind === "new-mayor") return current.targetId || state.overrides[current.id] ? null : "The GM must select a player.";
  if (current.kind === "mayor-election") {
    if (state.mayorCandidates.length === 0 && !state.overrides[current.id]) return "The GM must select the mayoral candidate(s) or use a GM override.";
  }
  if (actors.some(id => !submissions[id])) return "Wait for every required participant to submit before confirming.";
  return null;
}

function resolveStep(state: WerewolvesState, current: Step, value: ActionValue | undefined, submissions: Record<string, ActionValue>) {
  const chosen = value ?? {};
  const targetId = typeof chosen.targetId === "string" ? chosen.targetId : null;
  switch (current.kind) {
    case "mayor-nominations":
      state.mayorCandidates = Object.entries(submissions).filter(([, vote]) => vote.candidate === true).map(([id]) => id);
      addEvent(state, `${state.mayorCandidates.length} player(s) are running for mayor.`);
      break;
    case "mayor-election": {
      if (typeof chosen.targetId === "string") {
        state.mayorId = chosen.targetId;
      } else {
        const counts = new Map<string, number>();
        Object.values(submissions).forEach(vote => {
          if (typeof vote.targetId === "string") counts.set(vote.targetId, (counts.get(vote.targetId) ?? 0) + 1);
        });
        const top = Math.max(0, ...counts.values());
        const leaders = [...counts].filter(([, count]) => count === top).map(([id]) => id);
        if (leaders.length !== 1 || top === 0) return "There is no unique mayor. The GM must choose from the tied candidates.";
        state.mayorId = leaders[0];
      }
      addEvent(state, `${state.seats[state.mayorId]?.username ?? "The mayor"} is elected mayor.`);
      break;
    }
    case "new-mayor":
      state.mayorId = targetId;
      addEvent(state, `${state.seats[state.mayorId ?? ""]?.username ?? "A player"} becomes mayor.`);
      break;
    case "town-name":
      state.townName = String(chosen.name).trim();
      addEvent(state, `The mayor names the town ${state.townName}.`);
      break;
    case "lovers": {
      const ids = chosen.targetIds as string[];
      state.lovers = [ids[0], ids[1]];
      savePrivateAction(state, current, chosen);
      for (const id of ids) privatelyReveal(state, id, "lover", { partnerId: ids.find(other => other !== id) });
      addEvent(state, "Two players are now lovers.");
      break;
    }
    case "wolfchild-target":
      state.wolfchildTarget = targetId;
      savePrivateAction(state, current, chosen);
      addEvent(state, "The Wolfchild has chosen someone to imitate.");
      break;
    case "old-knight-target":
      state.night.oldKnightTarget = targetId;
      if (current.actorId) state.nightVisitors.push(current.actorId);
      savePrivateAction(state, current, chosen);
      state.actions[current.kind] = { ...chosen, userId: current.actorId };
      break;
    case "guard-check":
    case "seer-check":
    case "sniffer-check":
    case "little-girl-check":
      roleResult(state, current, { ...chosen, userId: current.actorId });
      savePrivateAction(state, current, chosen);
      if (current.kind !== "little-girl-check" && current.actorId) state.nightVisitors.push(current.actorId);
      state.actions[current.kind] = { ...chosen, userId: current.actorId };
      if (current.kind === "sniffer-check" && state.firstNight && targetId && isWolfAligned(state, targetId)) {
        state.steps.unshift({ ...current, id: `${current.id}-reconsider-${crypto.randomUUID()}`, prompt: "The Sniffer gets thumbs-down. They may check another player or reconsider any number of times." });
      }
      break;
    case "wolf-target": {
      const selected = chosen.pass === true ? null : targetId ?? currentWolfSubmissions(state, current)[0]?.targetId ?? null;
      state.night.wolfTarget = selected;
      state.night.oldKnightVictim = selected && !targetIsElder(state, selected) && selected === state.night.oldKnightTarget && roleAlive(state, "old-knight")
        ? roleHolderId(state, "old-knight") ?? null
        : null;
      state.actions[current.kind] = { targetId: selected, warning: wiseWolfWarning(state, selected) };
      if (selected) {
        for (const wolf of aliveSeats(state).filter(player => isWolfAligned(state, player.id) && !isAbsent(state, player.id))) {
          if (!state.nightVisitors.includes(wolf.id)) state.nightVisitors.push(wolf.id);
          privatelyReveal(state, wolf.id, "action:wolf-target", { targetId: selected });
          if (wiseWolfWarning(state, selected)) privatelyReveal(state, wolf.id, "wolf-warning", { result: "thumbs-down", targetId: selected });
        }
      }
      if (!selected) addEvent(state, "The Werewolves skip their attack tonight.");
      break;
    }
    case "silence-target":
      if (chosen.pass !== true && targetId) {
        state.silencedId = targetId;
        state.throatcutterUsed = true;
        if (current.actorId) state.nightVisitors.push(current.actorId);
        savePrivateAction(state, current, chosen);
        state.actions.silence = { targetId, day: state.day };
      } else {
        savePrivateAction(state, current, { pass: true });
        state.actions[current.kind] = { pass: true };
      }
      break;
    case "alchemist-actions": {
      const action = chosen;
      if (action.usePotion === true) {
        state.potionAvailable = false;
        state.night.alchemistSaveTarget = String(action.saveTarget);
      }
      if (action.usePoison === true) {
        state.poisonAvailable = false;
        state.night.poisonTarget = String(action.poisonTarget);
      }
      if ((action.usePotion === true || action.usePoison === true) && current.actorId) state.nightVisitors.push(current.actorId);
      state.actions[current.kind] = { ...action, userId: current.actorId };
      savePrivateAction(state, current, action);
      break;
    }
    case "night-deaths": {
      const deaths: { id: string; reason: string }[] = [];
      const summary: string[] = [];
      const wolfTarget = state.night.wolfTarget;
      if (!wolfTarget) {
        summary.push("The Werewolves did not attack a player tonight.");
      } else if (targetIsElder(state, wolfTarget)) {
        summary.push(`The Werewolves targeted ${state.seats[wolfTarget]?.username ?? "a player"}, but the Elder cannot be killed by their attack.`);
      } else {
        const targetName = state.seats[wolfTarget]?.username ?? "the target";
        if (wolfTarget === state.night.oldKnightTarget && roleAlive(state, "old-knight")) {
          const knightId = roleHolderId(state, "old-knight");
          const wolf = wolfToLeftOf(state, wolfTarget);
          state.night.oldKnightVictim = knightId ?? null;
          state.night.wolfKnightVictim = wolf?.id ?? null;
          summary.push(`The Werewolves targeted ${targetName}, who was protected by the Old Knight.`);
          if (knightId) {
            if (state.night.alchemistSaveTarget !== knightId) {
              deaths.push({ id: knightId, reason: "Old Knight protection" });
              summary.push(`${state.seats[knightId]?.username ?? "The Old Knight"} will die; the Alchemist did not save them.`);
            } else {
              summary.push(`${state.seats[knightId]?.username ?? "The Old Knight"} was saved by the Alchemist's potion.`);
            }
          }
          if (wolf?.id) deaths.push({ id: wolf.id, reason: "Old Knight protection" });
          if (wolf?.id) {
            summary.push(`${wolf.username}, the first living Werewolf to the left of ${targetName}, will die.`);
          } else {
            summary.push(`No living Werewolf was found to the left of ${targetName}.`);
          }
          state.actions.oldKnightProtection = { triggered: true, protectedTarget: wolfTarget, knightId, wolfId: wolf?.id ?? null };
        } else if (state.night.alchemistSaveTarget !== wolfTarget) {
          deaths.push({ id: wolfTarget, reason: "Werewolves" });
          summary.push(`The Werewolves targeted ${targetName}; ${targetName} will die from the attack.`);
        } else {
          summary.push(`The Werewolves targeted ${targetName}, but the Alchemist's potion saved them.`);
        }
      }
      if (state.night.poisonTarget) {
        deaths.push({ id: state.night.poisonTarget, reason: "Alchemist's poison" });
        summary.push(`${state.seats[state.night.poisonTarget]?.username ?? "The poison target"} will die from the Alchemist's poison.`);
      }
      const resolvedDeaths = shuffle([...new Map(deaths.map(death => [death.id, death])).values()]);
      summary.push(resolvedDeaths.length
        ? `Reveal these deaths in this random order: ${resolvedDeaths.map(death => state.seats[death.id]?.username ?? "a player").join(", ")}.`
        : "No deaths will be revealed this morning.");
      state.actions.nightResolutionSummary = { events: summary };
      queueDeathEntries(state, resolvedDeaths);
      if (state.absentId && state.absentThroughNight < state.day) state.absentId = null;
      state.steps.push(...daySteps(state));
      break;
    }
    case "big-bad-wolf":
      if (chosen.pass === true) break;
      state.bigBadUsed = true;
      if (current.actorId && state.seats[current.actorId]) state.seats[current.actorId].publiclyRevealed = true;
      state.actions[current.kind] = { ...chosen, userId: current.actorId };
      savePrivateAction(state, current, chosen);
      addEvent(state, "The Big Bad Wolf reveals their role.");
      queueDeaths(state, targetId ? [targetId] : [], "Big Bad Wolf");
      if (targetId) {
        const deathSteps = state.steps.filter(item => item.kind === "death-reveal").length;
        state.steps.splice(deathSteps, 0, step(state, "day", "day-check-after-big-bad", "Check whether the Big Bad Wolf's kill ends the game.", "gm"));
      }
      break;
    case "skip-vote": {
      const allSkip = Object.values(submissions).length > 0 && aliveVoters(state).every(player => submissions[player.id]?.skip === true);
      state.actions[current.kind] = { allSkip };
      if (allSkip) {
        addEvent(state, "Every living player votes to skip the lynch.");
        state.steps.unshift(step(state, "day", "day-end", "End the day without a lynch.", "gm"));
      } else {
        addEvent(state, "The vote does not unanimously skip the lynch.");
        state.steps.unshift(step(state, "day", "lynch-start", "Begin the lynch vote.", "gm"));
      }
      break;
    }
    case "moon-offer": {
      if (chosen.pass === true || typeof chosen.card !== "string") {
        state.currentMoon = null;
        state.moonOffers = [];
        break;
      }
      const card = chosen.card as MoonCard;
      state.currentMoon = card;
      state.moonOffers = [];
      state.moonDeck = state.moonDeck.filter(item => item !== card);
      addEvent(state, `The mayor chooses the Moon card ${MOON_NAMES[card]}.`);
      if (card === "buried") state.buried = true;
      if (card === "good-manners") state.goodManners = true;
      if (card === "ghost") state.steps.unshift(step(state, "day", "ghost-choice", "The first player's ghost points at one player. The GM records the choice.", "gm", { required: true }));
      if (card === "executioner") state.steps.unshift(step(state, "day", "executioner-vote", "Each living player votes to choose the executioner.", "living", { required: true }));
      if (card === "mistrust") state.steps.unshift(step(state, "day", "mistrust-vote", "Each player secretly votes for their two closest friends.", "living", { required: true }));
      if (card === "in-need-of-aid") state.steps.unshift(step(state, "day", "aid-target", "The mayor chooses a player to leave for the rest of today and the following night.", "mayor", { required: true }));
      if (card === "strict-sentence" || card === "buried" || card === "good-manners") {
        state.steps.unshift(step(state, "day", "moon-applied", `Apply ${MOON_NAMES[card]}.`, "gm"));
      }
      break;
    }
    case "ghost-choice":
      state.actions[current.kind] = { ...chosen };
      addEvent(state, `The first player's ghost points at ${state.seats[targetId ?? ""]?.username ?? "a player"}.`);
      break;
    case "executioner-vote": {
      const counts = new Map<string, number>();
      Object.values(submissions).forEach(vote => {
        if (typeof vote.targetId === "string") counts.set(vote.targetId, (counts.get(vote.targetId) ?? 0) + 1);
      });
      const top = Math.max(0, ...counts.values());
      const leaders = [...counts].filter(([, count]) => count === top).map(([id]) => id);
      if (leaders.length === 1) {
        state.executionerId = leaders[0];
        state.steps.unshift(step(state, "day", "executioner-lynch", "The executioner chooses and carries out the lynching.", "executioner", { actorId: state.executionerId, required: true }));
      } else {
        state.steps.unshift(step(state, "day", "executioner-tie", "The mayor breaks the executioner-election tie.", "mayor", {
          required: true,
          data: { candidates: leaders }
        }));
      }
      break;
    }
    case "executioner-tie": {
      state.executionerId = targetId;
      state.steps.unshift(step(state, "day", "executioner-lynch", "The executioner chooses and carries out the lynching.", "executioner", { actorId: state.executionerId ?? undefined, required: true }));
      break;
    }
    case "executioner-lynch":
      state.lynchTarget = targetId;
      state.steps.unshift(step(state, "day", "lynch-result", "The executioner has selected a player for lynching.", "gm", { ...(targetId ? { targetId } : {}), required: true }));
      break;
    case "mistrust-vote": {
      const counts = new Map<string, number>();
      for (const vote of Object.values(submissions)) {
        if (Array.isArray(vote.targetIds)) for (const id of vote.targetIds) counts.set(String(id), (counts.get(String(id)) ?? 0) + 1);
      }
      const victims = aliveVoters(state).filter(player => (counts.get(player.id) ?? 0) === 0).map(player => player.id);
      addEvent(state, `${victims.length} player(s) received no Mistrust votes.`);
      state.actions.mistrustPending = { victims: shuffle(victims) };
      const discussionIndex = state.steps.findIndex(item => item.kind === "discussion");
      const resolve = step(state, "day", "mistrust-resolve", "At evening, lynch the players who received no Mistrust votes.", "gm");
      state.steps.splice(discussionIndex < 0 ? 0 : discussionIndex + 1, 0, resolve);
      break;
    }
    case "aid-target":
      state.absentId = targetId;
      state.absentThroughNight = state.day;
      addEvent(state, `${state.seats[targetId ?? ""]?.username ?? "A player"} leaves town for today and the following night.`);
      break;
    case "good-manners-violation":
      if (targetId) state.interruptedIds = [...new Set([...state.interruptedIds, targetId])];
      break;
    case "lynch-start":
      beginLynch(state);
      break;
    case "lynch-spare":
      if (targetId) {
        state.lynchRemaining = state.lynchRemaining.filter(id => id !== targetId);
        appendNextLynchStep(state, targetId);
      }
      break;
    case "lynch-result":
      state.lynchTarget = targetId ?? (typeof current.targetId === "string" ? current.targetId : null);
      if (state.lynchTarget && state.seats[state.lynchTarget]?.role === "fool") {
        const fool = state.seats[state.lynchTarget];
        fool.publiclyRevealed = true;
        state.individualWinners.push(fool.id);
        state.strictFirstWasWolf ??= isWolfAligned(state, fool.id);
        addEvent(state, "The Fool reveals their role and wins individually without dying.");
        state.steps.unshift(...(state.currentMoon === "strict-sentence" && state.strictFirstWasWolf === false
          ? [step(state, "day", "strict-sentence-check", "Strict Sentence requires an immediate second lynch because the first selected player was not a Werewolf.", "gm")]
          : []), step(state, "day", "day-check-after-lynch", "Check whether either faction has won.", "gm"));
      } else {
        const judgeId = roleAlive(state, "judge") ? roleHolderId(state, "judge") : undefined;
        if (judgeId && !state.judgeUsed) {
          state.steps.unshift(step(state, "day", "judge-intervention", "After the result and before the death, the Judge may reveal their role to become mayor and restart the vote.", "judge", {
            actorId: judgeId,
            required: true,
            ...(state.lynchTarget ? { targetId: state.lynchTarget } : {})
          }));
        } else {
          state.steps.unshift(step(state, "day", "lynch-kill", "Kill the selected player and resolve death-triggered abilities.", "gm", { required: true, ...(state.lynchTarget ? { targetId: state.lynchTarget } : {}) }));
        }
      }
      break;
    case "judge-intervention":
      if (chosen.reveal === true && current.actorId) {
        state.judgeUsed = true;
        state.seats[current.actorId].publiclyRevealed = true;
        state.mayorId = current.actorId;
        state.lynchTarget = null;
        addEvent(state, "The Judge reveals their role, becomes mayor, and restarts the lynch vote.");
        state.steps.unshift(step(state, "day", "lynch-start", "The Judge restarts the lynch vote.", "gm"));
      } else {
        state.steps.unshift(step(state, "day", "lynch-kill", "Kill the selected player and resolve death-triggered abilities.", "gm", { required: true, ...(current.targetId ? { targetId: current.targetId } : {}) }));
      }
      break;
    case "lynch-kill": {
      const victim = current.targetId ?? state.lynchTarget;
      if (victim) {
        const firstLynch = state.strictFirstWasWolf === null;
        const wasWolf = isWolfAligned(state, victim);
        if (firstLynch) state.strictFirstWasWolf = wasWolf;
        queueDeaths(state, [victim], "lynching");
        state.steps.push(...(firstLynch && state.currentMoon === "strict-sentence" && !wasWolf
          ? [step(state, "day", "strict-sentence-check", "Strict Sentence requires an immediate second lynch because the first player was not a Werewolf.", "gm")]
          : []));
        state.steps.push(step(state, "day", "day-check-after-lynch", "Check whether either faction has won.", "gm"));
      }
      break;
    }
    case "strict-sentence-check":
      state.steps.unshift(step(state, "day", "lynch-start", "Hold the second lynch under Strict Sentence.", "gm"));
      break;
    case "death-reveal": {
      const victimId = current.targetId;
      const victim = victimId ? state.seats[victimId] : undefined;
      if (!victim || !victim.alive) break;
      const reason = String(current.data?.reason ?? "unknown");
      victim.alive = false;
      const death = { userId: victim.id, reason, order: state.deaths.length, revealedRole: state.buried ? undefined : victim.role };
      state.deaths.push(death);
      if (!state.buried) victim.publiclyRevealed = true;
      addEvent(state, `${victim.username} dies${state.buried ? "." : ` as the ${victim.role ? ROLE_INFO[victim.role].name : "unknown role"}.`}`);
      if (victim.id === state.mayorId) state.mayorId = null;
      if (victim.role === "elder" && reason !== "Werewolves") {
        state.villagerAbilitiesLost = true;
        state.actions.elderAbilityLost = { value: true };
        addEvent(state, "The Elder dies by another cause; Villager role abilities are lost.");
      }
      const nested: Step[] = [];
      if (state.lovers?.includes(victim.id)) {
        const partner = state.lovers.find(id => id !== victim.id);
        const alreadyPending = partner && state.steps.some(item => item.kind === "death-reveal" && item.targetId === partner);
        if (partner && isAlive(state, partner) && !alreadyPending) {
          nested.push(step(state, "day", "death-reveal", `${state.seats[partner]?.username ?? "The other lover"} dies of heartbreak.`, "gm", { targetId: partner, data: { reason: "heartbreak" } }));
        }
      }
      if (victim.role === "hunter" && !state.villagerAbilitiesLost) nested.push(step(state, "day", "hunter-shot", "The Hunter may shoot another player.", "hunter", { actorId: victim.id, optional: true }));
      if (nested.length) state.steps.unshift(...nested);
      ensureMayorStep(state);
      break;
    }
    case "hunter-shot":
      savePrivateAction(state, current, chosen);
      if (chosen.pass !== true && targetId) queueDeaths(state, [targetId], "Hunter");
      break;
    case "day-check":
    case "day-check-after-lynch":
    case "day-check-after-big-bad":
    case "day-check-after-mistrust":
      state.actions.lastWinCheck = getWinCheck(state);
      checkWin(state);
      if (state.phase === "results") break;
      if (current.kind === "day-check-after-lynch") {
        state.day++;
        state.firstNight = false;
        state.silencedId = null;
        state.interruptedIds = [];
        state.goodManners = false;
        state.strictFirstWasWolf = null;
        state.currentMoon = null;
        state.moonOffers = [];
        startNight(state);
      }
      break;
    case "bearman-growl": {
      const bearmanId = roleHolderId(state, "bearman");
      const neighbors = bearmanId ? [circularNeighbor(state, bearmanId, -1), circularNeighbor(state, bearmanId, 1)].filter(Boolean) : [];
      const wolves = neighbors.filter(player => player && isWolfAligned(state, player.id) && player.role !== "cloaked-wolf");
      state.actions.bearman = { growl: wolves.length > 0, neighbors: neighbors.map(player => player?.id), wolfIds: wolves.map(player => player?.id) };
      addEvent(state, wolves.length ? "The Bearman's bear growls." : "The Bearman's bear does not growl.");
      break;
    }
    case "discussion":
    case "mayor-speeches":
    case "moon-applied":
      break;
    case "mistrust-resolve": {
      const victims = state.actions.mistrustPending?.victims;
      if (Array.isArray(victims)) queueDeaths(state, victims as string[], "Mistrust");
      delete state.actions.mistrustPending;
      const deathSteps = state.steps.filter(item => item.kind === "death-reveal").length;
      state.steps.splice(deathSteps, 0, step(state, "day", "day-check-after-mistrust", "Check whether the Mistrust lynches end the game.", "gm"));
      break;
    }
    case "day-end":
      state.day++;
      state.firstNight = false;
      state.silencedId = null;
      state.interruptedIds = [];
      state.goodManners = false;
      state.strictFirstWasWolf = null;
      state.currentMoon = null;
      state.moonOffers = [];
      startNight(state);
      break;
  }
  return null;
}

function daySteps(state: WerewolvesState): Step[] {
  state.nightActive = false;
  delete state.actions.bearman;
  const day = state.day;
  state.moonOffers = state.settings.moonCards ? shuffle(moonEligibility(state)).slice(0, 3) : [];
  const result = [step(state, "day", "day-check", "Check whether either faction has won and show the GM why play continues.", "gm")];
  if (roleAlive(state, "bearman")) result.push(step(state, "day", "bearman-growl", "Report whether the Bearman's bear growls and why.", "gm"));
  if (state.settings.moonCards) result.push(step(state, "day", "moon-offer", "Offer up to three eligible Moon cards; the mayor chooses one.", "mayor", {
    optional: state.moonOffers.length === 0,
    required: state.moonOffers.length > 0
  }));
  result.push(step(state, "day", "discussion", "Let the players discuss. Advance when discussion is no longer productive or time is up.", "gm"));
  if (roleAlive(state, "big-bad-wolf") && !state.bigBadUsed) {
    result.push(step(state, "day", "big-bad-wolf", "The Big Bad Wolf may reveal their role and kill a player before voting, or pass.", "role", {
      role: "big-bad-wolf",
      actorId: roleHolderId(state, "big-bad-wolf"),
      optional: true
    }));
  }
  if (state.settings.skipLynch) result.push(step(state, "day", "skip-vote", "All living players vote whether to skip lynching. The lynch is skipped only if every living player votes yes.", "living", { required: true }));
  result.push(step(state, "day", "lynch-start", "Begin the lynch vote.", "gm"));
  return result.map(item => ({ ...item, day }));
}

function nightForecast(state: WerewolvesState): string[] {
  const forecast: string[] = [];
  const aliveRole = (role: RoleId) => roleAlive(state, role);
  if (!state.villagerAbilitiesLost) {
    if (aliveRole("old-knight")) forecast.push("Old Knight: choose protection");
    if (aliveRole("guard")) forecast.push("Guard: check a player");
    if (aliveRole("seer")) forecast.push("Seer: view a role");
  }
  if (aliveRole("sniffer")) forecast.push("Sniffer: check a role");
  if (aliveSeats(state).some(player => isWolfAligned(state, player.id) && !isAbsent(state, player.id))) forecast.push("Werewolves: agree on a target");
  if (aliveRole("throatcutter") && !state.throatcutterUsed) forecast.push("Throatcutter: optional silence");
  if (aliveRole("alchemist") && (state.potionAvailable || state.poisonAvailable)) forecast.push("Alchemist: optional potion and/or poison");
  if (!state.villagerAbilitiesLost && aliveRole("little-girl")) forecast.push("Little Girl: check whether a player visited");
  forecast.push("GM: resolve and reveal night deaths");
  return forecast;
}

function canActAsGM(state: WerewolvesState, actorId: string) {
  return actorId === state.gmId;
}

function dealRoles(state: WerewolvesState) {
  const players = Object.values(state.seats).sort((a, b) => a.order - b.order);
  const wolfPool = shuffle(state.settings.rolePool.filter(role => WOLF_ROLES.includes(role)));
  const villagerPool = shuffle(state.settings.rolePool.filter(role => !WOLF_ROLES.includes(role)));
  const selected = [...wolfPool.slice(0, state.settings.wolfCount), ...villagerPool.slice(0, players.length - state.settings.wolfCount)];
  if (selected.length !== players.length) return "The role pool cannot cover the village.";
  shuffle(selected);
  players.forEach((player, index) => {
    player.role = selected[index];
    player.alive = true;
    player.publiclyRevealed = false;
  });
  return null;
}

function startGame(state: WerewolvesState) {
  const problem = dealRoles(state);
  if (problem) return problem;
  state.phase = "playing";
  state.day = 1;
  state.firstNight = true;
  state.nightActive = false;
  state.steps = [];
  state.submissions = {};
  state.overrides = {};
  state.actions = {};
  state.privateResults = {};
  state.events = [];
  state.townName = "";
  state.mayorId = null;
  state.mayorCandidates = [];
  state.lovers = null;
  state.wolfchildTarget = null;
  state.deaths = [];
  state.nightVisitors = [];
  state.night = { wolfTarget: null, oldKnightTarget: null, oldKnightVictim: null, alchemistSaveTarget: null, poisonTarget: null, wolfKnightVictim: null };
  state.throatcutterUsed = false;
  state.bigBadUsed = false;
  state.potionAvailable = true;
  state.poisonAvailable = true;
  state.silencedId = null;
  state.absentId = null;
  state.absentThroughNight = 0;
  state.buried = false;
  state.goodManners = false;
  state.villagerAbilitiesLost = false;
  state.interruptedIds = [];
  state.moonDeck = shuffle([...MOON_CARDS]);
  state.moonOffers = [];
  state.currentMoon = null;
  state.executionerId = null;
  state.lynchRemaining = [];
  state.lynchTarget = null;
  state.judgeUsed = false;
  state.strictFirstWasWolf = null;
  state.winner = null;
  state.winners = [];
  state.individualWinners = [];
  state.resultRecorded = false;
  newGameSteps(state);
  return null;
}

export const werewolves: GameModule<WerewolvesState> = {
  info: {
    id: "werewolves",
    name: "Werewolves",
    description: "A social deduction game of secret roles, night actions, and village lynching, guided by a Game Master.",
    maxPlayers: 20
  },
  perViewer: true,

  create: () => ({
    phase: "lobby",
    day: 0,
    firstNight: true,
    nightActive: false,
    nextOrder: 0,
    seats: {},
    gmId: null,
    gmName: null,
    settings: { rolePool: [...ROLE_IDS], wolfCount: 3, skipLynch: false, moonCards: false },
    steps: [],
    submissions: {},
    overrides: {},
    actions: {},
    privateResults: {},
    events: [],
    townName: "",
    mayorId: null,
    mayorCandidates: [],
    lovers: null,
    wolfchildTarget: null,
    deaths: [],
    nightVisitors: [],
    night: { wolfTarget: null, oldKnightTarget: null, oldKnightVictim: null, alchemistSaveTarget: null, poisonTarget: null, wolfKnightVictim: null },
    throatcutterUsed: false,
    bigBadUsed: false,
    potionAvailable: true,
    poisonAvailable: true,
    silencedId: null,
    absentId: null,
    absentThroughNight: 0,
    buried: false,
    goodManners: false,
    villagerAbilitiesLost: false,
    interruptedIds: [],
    moonDeck: [...MOON_CARDS],
    moonOffers: [],
    currentMoon: null,
    executionerId: null,
    lynchRemaining: [],
    lynchTarget: null,
    judgeUsed: false,
    strictFirstWasWolf: null,
    winner: null,
    winners: [],
    individualWinners: []
  }),

  migrate(state) {
    const fresh = werewolves.create();
    for (const key of Object.keys(fresh) as (keyof WerewolvesState)[]) {
      if (state[key] === undefined) (state as any)[key] = fresh[key];
    }
    if (!state.settings || typeof state.settings !== "object") state.settings = fresh.settings;
    for (const key of Object.keys(fresh.settings) as (keyof WerewolvesState["settings"])[]) {
      if (state.settings[key] === undefined) (state.settings as any)[key] = fresh.settings[key];
    }
    if (!Array.isArray(state.steps)) state.steps = [];
    if (!state.submissions || typeof state.submissions !== "object") state.submissions = {};
    if (!state.overrides || typeof state.overrides !== "object") state.overrides = {};
    if (!state.actions || typeof state.actions !== "object") state.actions = {};
    if (!state.privateResults || typeof state.privateResults !== "object") state.privateResults = {};
    if (!Array.isArray(state.events)) state.events = [];
    if (!Array.isArray(state.settings.rolePool)) state.settings.rolePool = [...ROLE_IDS];
    state.settings.rolePool = [...new Set(state.settings.rolePool.filter((role: RoleId) => ROLE_IDS.includes(role)))];
    if (!Number.isInteger(state.settings.wolfCount) || state.settings.wolfCount < 0) state.settings.wolfCount = fresh.settings.wolfCount;
    state.settings.wolfCount = Math.min(state.settings.wolfCount, state.settings.rolePool.filter(role => WOLF_ROLES.includes(role)).length);
    if (typeof state.settings.skipLynch !== "boolean") state.settings.skipLynch = fresh.settings.skipLynch;
    if (typeof state.settings.moonCards !== "boolean") state.settings.moonCards = fresh.settings.moonCards;
    if (!state.night || typeof state.night !== "object") state.night = { ...fresh.night };
    for (const key of Object.keys(fresh.night) as (keyof WerewolvesState["night"])[]) {
      if (state.night[key] === undefined) (state.night as any)[key] = fresh.night[key];
    }
  },

  handle(state, actor, message, context) {
    const current = getStep(state);
    switch (message.type) {
      case "join": {
        if (state.phase !== "lobby") return "ignore";
        if (!context.connected.has(actor.userId)) return "ignore";
        if (actor.userId === state.gmId) return { error: "The GM cannot hold a village role." };
        if (state.seats[actor.userId]) return "ignore";
        if (Object.keys(state.seats).length + (state.gmId ? 1 : 0) >= werewolves.info.maxPlayers) return { error: "The game has reached its 20 participant limit." };
        const roleCapacity = state.settings.rolePool.length;
        if (Object.values(state.seats).length >= roleCapacity) return { error: "The village role pool is full; you will remain a spectator." };
        state.seats[actor.userId] = { id: actor.userId, username: actor.username, order: state.nextOrder++, alive: true };
        return "save";
      }
      case "leave": {
        if (state.phase !== "lobby" || !state.seats[actor.userId]) return "ignore";
        delete state.seats[actor.userId];
        return "save";
      }
      case "configure": {
        if (!actor.isAdmin || state.phase !== "lobby") return "ignore";
        const rolePool = message.rolePool;
        const wolfCount = message.wolfCount;
        if (!Array.isArray(rolePool) || rolePool.some(role => typeof role !== "string" || !ROLE_IDS.includes(role as RoleId))) return { error: "Choose only roles from the Werewolves role list." };
        if (new Set(rolePool).size !== rolePool.length) return { error: "The role pool cannot contain duplicate roles." };
        if (rolePool.length < Object.keys(state.seats).length) return { error: "The pool must contain at least one distinct role for every village player." };
        if (rolePool.length + (state.gmId ? 1 : 0) > werewolves.info.maxPlayers) return { error: "The role pool cannot exceed the 20 participant limit including the GM." };
        if (typeof wolfCount !== "number" || !Number.isInteger(wolfCount) || wolfCount < 0) return { error: "Choose a valid exact Werewolf count." };
        const availableWolves = rolePool.filter(role => WOLF_ROLES.includes(role as RoleId)).length;
        if (wolfCount > availableWolves) return { error: "The Werewolf count cannot exceed the number of Werewolf roles in the pool." };
        if (typeof message.skipLynch !== "boolean" || typeof message.moonCards !== "boolean") return { error: "Set both skip-lynch and Moon-card options." };
        state.settings = { rolePool: rolePool as RoleId[], wolfCount, skipLynch: message.skipLynch, moonCards: message.moonCards };
        return "save";
      }
      case "set_gm": {
        if (!actor.isAdmin || state.phase !== "lobby") return "ignore";
        const userId = message.userId;
        if (typeof userId !== "string" || !context.connected.has(userId)) return { error: "Choose a connected participant as GM." };
        const seatCount = Object.keys(state.seats).length - (state.seats[userId] ? 1 : 0);
        if (userId !== state.gmId && seatCount + 1 > werewolves.info.maxPlayers) return { error: "The game has reached its 20 participant limit." };
        if (state.seats[userId]) delete state.seats[userId];
        state.gmId = userId;
        state.gmName = context.connected.get(userId) ?? null;
        return "save";
      }
      case "set_order": {
        if (!canActAsGM(state, actor.userId) || state.phase !== "lobby") return "ignore";
        const ids = message.userIds;
        const expected = Object.keys(state.seats);
        if (!Array.isArray(ids) || ids.length !== expected.length || new Set(ids).size !== ids.length || ids.some(id => !expected.includes(String(id)))) return { error: "Provide every village seat exactly once in seating order." };
        ids.forEach((id, index) => { state.seats[String(id)].order = index; });
        state.nextOrder = ids.length;
        return "save";
      }
      case "start": {
        if (!canActAsGM(state, actor.userId) || state.phase !== "lobby") return "ignore";
        if (!state.gmId) return { error: "An admin must assign a Game Master before the game can start." };
        if (state.gmId === actor.userId && Object.keys(state.seats).length === 0) return { error: "At least one village player is required." };
        if (Object.keys(state.seats).length === 0) return { error: "At least one village player is required." };
        if (state.settings.rolePool.length < Object.keys(state.seats).length) return { error: "The role pool must contain enough distinct roles for all village players." };
        const availableWolves = state.settings.rolePool.filter(role => WOLF_ROLES.includes(role)).length;
        if (state.settings.wolfCount > availableWolves) return { error: "The role pool does not contain enough Werewolf roles." };
        if (state.settings.wolfCount > Object.keys(state.seats).length) return { error: "There must be at least one role-holding player for every configured Werewolf." };
        if (state.settings.rolePool.length - availableWolves < Object.keys(state.seats).length - state.settings.wolfCount) return { error: "The pool does not contain enough non-Werewolf roles for the village." };
        const problem = startGame(state);
        return problem ? { error: problem } : "save";
      }
      case "submit_action": {
        if (state.phase !== "playing" || !current) return "ignore";
        const value = requireRecord(message.value);
        if (!value) return { error: "Submit an action value." };
        const targetId = current.voterId;
        const groupSubstitute = current.actorMode === "living"
          && typeof message.forUserId === "string"
          && state.interruptedIds.includes(message.forUserId)
          && actorsForStep(state, current).includes(message.forUserId)
          && actor.userId === state.mayorId
          ? message.forUserId
          : null;
        const substitutedByMayor = current.actorMode === "voter"
          && targetId && state.interruptedIds.includes(targetId)
          && actor.userId === state.mayorId;
        if (current.actorMode === "living" && state.interruptedIds.includes(actor.userId)) return "ignore";
        if (!activeRoleActionsAllowed(state, actor.userId, current) && !substitutedByMayor) return "ignore";
        const error = validateValue(state, current, value, groupSubstitute ?? (targetId && substitutedByMayor ? targetId : actor.userId));
        if (error) return { error };
        state.submissions[current.id] ??= {};
        const submitterId = groupSubstitute ?? (targetId && substitutedByMayor ? targetId : actor.userId);
        state.submissions[current.id][submitterId] = { ...value, userId: submitterId };
        return "save";
      }
      case "gm_action": {
        if (state.phase !== "playing" || !current || !canActAsGM(state, actor.userId)) return "ignore";
        const value = requireRecord(message.value);
        if (!value) return { error: "Provide an action value to override or record." };
        if ((current.actorMode === "living" || current.actorMode === "voter")
          && typeof value.forUserId === "string") {
          const vote = requireRecord(value.vote);
          if (!vote || !actorsForStep(state, current).includes(value.forUserId)) return { error: "Choose a participant who must vote and provide their vote." };
          const voteError = validateValue(state, current, vote, value.forUserId);
          if (voteError) return { error: voteError };
          state.submissions[current.id] ??= {};
          state.submissions[current.id][value.forUserId] = { ...vote, userId: value.forUserId };
          return "save";
        }
        const error = validateValue(state, current, value, current.actorId ?? current.voterId ?? state.gmId ?? actor.userId);
        if (error && current.kind !== "mayor-election") return { error };
        if (current.kind === "mayor-election") {
          if (!isAlive(state, value.targetId)) return { error: "Choose a living player as mayor." };
          if (state.mayorCandidates.length && !state.mayorCandidates.includes(String(value.targetId))) return { error: "Choose a nominated candidate for mayor." };
        }
        state.overrides[current.id] = value;
        return "save";
      }
      case "confirm_step": {
        if (state.phase !== "playing" || !current || !canActAsGM(state, actor.userId)) return "ignore";
        const requirement = confirmRequirements(state, current);
        if (requirement) return { error: requirement };
        if (current.kind === "wolf-target" && !state.overrides[current.id]) {
          const wolves = actorsForStep(state, current);
          const submitted = currentWolfSubmissions(state, current);
          if (wolves.length && submitted.length === wolves.length) {
            const targets = submitted.map(item => item.targetId);
            if (targets.some(target => target !== targets[0])) return { error: "The Werewolves must agree unanimously or the GM must override the attack." };
          }
        }
        const chosen = getSubmission(state, current);
        const saved = state.submissions[current.id] ?? {};
        state.steps.shift();
        const resolved = resolveStep(state, current, chosen, saved);
        if (resolved) {
          state.steps.unshift(current);
          return { error: resolved };
        }
        delete state.submissions[current.id];
        delete state.overrides[current.id];
        ensureMayorStep(state);
        if (state.phase === "playing" && state.steps.length === 0) {
          if (current.kind === "town-name") startNight(state);
          else if (current.kind === "day-end" || current.kind === "day-check-after-lynch") {
            state.day++;
            state.firstNight = false;
            state.silencedId = null;
            state.interruptedIds = [];
            state.goodManners = false;
            state.strictFirstWasWolf = null;
            state.currentMoon = null;
            state.moonOffers = [];
            if (state.absentId && state.absentThroughNight < state.day) state.absentId = null;
            startNight(state);
          }
        }
        return "save";
      }
      case "record_violation": {
        if (state.phase !== "playing" || !canActAsGM(state, actor.userId) || !state.goodManners || current?.kind !== "discussion") return "ignore";
        const userId = message.userId;
        if (!isAlive(state, userId)) return { error: "Choose a living player." };
        state.interruptedIds = [...new Set([...state.interruptedIds, String(userId)])];
        addEvent(state, `${state.seats[String(userId)].username} interrupts and loses their vote; the mayor controls it.`);
        return "save";
      }
      case "close_results":
        if (state.phase !== "results" || !actor.isAdmin) return "ignore";
        state.phase = "lobby";
        state.steps = [];
        for (const player of Object.values(state.seats)) delete player.role;
        state.seats = {};
        state.gmId = null;
        state.gmName = null;
        return "save";
      default:
        return "ignore";
    }
  },

  disconnect(state, userId) {
    return state.phase === "lobby" && !!state.seats[userId] ? (delete state.seats[userId], true) : false;
  },

  participants: state => new Set([...Object.keys(state.seats), ...(state.gmId ? [state.gmId] : [])]),

  takeResult(state) {
    if (state.phase !== "results" || state.resultRecorded) return null;
    state.resultRecorded = true;
    return {
      players: Object.values(state.seats).filter(player => player.role).map(player => ({
        userId: player.id,
        role: player.role!,
        won: state.winners.includes(player.id),
        flag: player.role === "fool" && state.winners.includes(player.id)
      }))
    };
  },

  snapshot(state, viewerId, connected) {
    const isGM = viewerId === state.gmId;
    const viewer = state.seats[viewerId];
    const viewerIsWolf = !!viewer && isWolfAligned(state, viewerId);
    const seats = Object.values(state.seats).sort((a, b) => a.order - b.order).map(player => {
      const result: Record<string, unknown> = {
        id: player.id,
        username: player.username,
        order: player.order,
        alive: player.alive,
        connected: connected.has(player.id),
        mayor: player.id === state.mayorId,
        silenced: (isGM || player.id === viewerId) && state.silencedId === player.id,
        absent: isAbsent(state, player.id),
        publiclyRevealed: !!player.publiclyRevealed
      };
      if (isGM || player.id === viewerId) result.role = player.role ?? null;
      else if (player.publiclyRevealed || state.phase === "results") result.role = player.role ?? null;
      if (isGM && player.role) result.faction = factionOf(state, player.id);
      return result;
    });
    const ownPrivateResults = state.privateResults[viewerId] ?? {};
    const current = getStep(state);
    const ownSubmission = current ? state.submissions[current.id]?.[viewerId] ?? null : null;
    const wolvesTargets = current?.kind === "wolf-target" && viewerIsWolf
      ? currentWolfSubmissions(state, current)
      : [];
    const publicDaySteps: Record<string, string> = {
      "day-check": "The GM checks whether the game continues.",
      "day-check-after-lynch": "The GM checks whether the game continues.",
      "day-check-after-big-bad": "The GM checks whether the game continues.",
      "bearman-growl": "The Bearman's dawn report.",
      "moon-offer": "The mayor chooses a Moon card.",
      discussion: "Village discussion.",
      "skip-vote": "Vote whether to skip the lynch.",
      "lynch-start": "The lynch vote begins.",
      "lynch-spare": "The village is voting.",
      "lynch-result": "The lynch result is ready.",
      "death-reveal": "The GM is resolving a death.",
      "day-end": "The day is ending."
    };
    const publicStep = current
      ? current.phase === "before-first-night"
        ? { phase: current.phase, day: current.day, kind: current.kind, prompt: current.prompt }
        : current.phase === "night"
          ? { phase: current.phase, day: current.day, kind: "night", prompt: "Night actions are in progress." }
          : {
              phase: current.phase,
              day: current.day,
              kind: publicDaySteps[current.kind] ? current.kind : "day",
              prompt: publicDaySteps[current.kind] ?? "The day is in progress.",
              ...(current.kind === "lynch-spare" && current.voterId ? { voterId: current.voterId } : {}),
              ...(["lynch-result", "lynch-kill"].includes(current.kind)
                ? { lynchTargetId: current.targetId ?? state.overrides[current.id]?.targetId ?? state.lynchTarget ?? undefined }
                : {})
            }
      : null;
    const upcomingSteps = isGM && current
      ? current.phase === "night"
        ? [{ phase: "day", steps: [
            "Check faction win conditions",
            ...(roleAlive(state, "bearman") ? ["Report the Bearman's growl"] : []),
            ...(state.settings.moonCards ? ["Mayor chooses an eligible Moon card"] : []),
            "Discussion",
            ...(!state.bigBadUsed && roleAlive(state, "big-bad-wolf") ? ["Big Bad Wolf may act before voting"] : []),
            ...(state.settings.skipLynch ? ["Unanimous skip-lynch vote"] : []),
            "Lynch vote"
          ] }]
        : current.phase === "day"
          ? [{ phase: "night", steps: nightForecast(state) }]
          : current.phase === "before-first-night"
            ? [{ phase: "night", steps: [
                ...(state.firstNight && roleAlive(state, "cupido") ? ["Cupido: choose lovers"] : []),
                ...(state.firstNight && roleAlive(state, "wolfchild") ? ["Wolfchild: choose imitation target"] : []),
                ...nightForecast(state)
              ] }]
            : []
      : [];
    const gmSteps = isGM ? state.steps.map(item => ({
      ...item,
      submissions: state.submissions[item.id] ?? {},
      override: state.overrides[item.id] ?? null,
      wiseWolfWarning: item.kind === "wolf-target" && (
        !!state.overrides[item.id] && wiseWolfWarning(state, String(state.overrides[item.id].targetId ?? ""))
        || currentWolfSubmissions(state, item).some(submission => wiseWolfWarning(state, submission.targetId))
      ),
      data: item.kind === "executioner-tie"
        ? { ...item.data, candidates: item.data?.candidates ?? [] }
        : item.data
    })) : undefined;
    const currentWinCheck = current && [
      "day-check", "day-check-after-lynch", "day-check-after-big-bad", "day-check-after-mistrust"
    ].includes(current.kind) ? getWinCheck(state) : undefined;
    const publicDeaths = state.deaths.map(death => {
      const player = state.seats[death.userId];
      return {
        userId: death.userId,
        username: player?.username,
        reason: isGM ? death.reason : undefined,
        role: death.revealedRole,
        order: death.order
      };
    });
    return {
      game: "werewolves",
      phase: state.phase,
      day: state.day,
      firstNight: state.firstNight,
      maxPlayers: werewolves.info.maxPlayers,
      settings: state.settings,
      roleCatalog: ROLE_IDS.map(roleCard),
      rules: {
        general: RULES,
        roles: ROLE_IDS.map(roleCard),
        moonCards: MOON_CARDS.map(card => ({ id: card, name: MOON_NAMES[card], rule: MOON_RULES[card] }))
      },
      moonCatalog: MOON_CARDS.map(card => ({ id: card, name: MOON_NAMES[card], rule: MOON_RULES[card] })),
      ghost: isGM && state.deaths.length ? {
        id: state.deaths[0].userId,
        username: state.seats[state.deaths[0].userId]?.username
      } : undefined,
      rolePool: state.settings.rolePool,
      wolfCount: state.settings.wolfCount,
      gm: state.gmId ? { id: state.gmId, username: state.gmName ?? "Game Master", connected: connected.has(state.gmId) } : null,
      isGM,
      viewer: viewer ? { id: viewer.id, role: viewer.role ?? null, alive: viewer.alive, faction: viewer.role === "wolfchild" ? factionOf(state, viewerId) : (viewer.role ? ROLE_INFO[viewer.role].faction : null) } : null,
      seats,
      villageCapacity: state.settings.rolePool.length,
      villageCount: Object.keys(state.seats).length,
      townName: state.townName,
      mayorId: state.mayorId,
      mayorCandidates: state.mayorCandidates,
      lovers: isGM ? state.lovers : state.lovers?.includes(viewerId) ? state.lovers : null,
      wolfchildTarget: isGM || viewer?.role === "wolfchild" ? state.wolfchildTarget : null,
      publicStep,
      privatePrompt: isGM || (!!current && activeRoleActionsAllowed(state, viewerId, current))
        ? current ? { kind: current.kind, prompt: current.prompt, role: current.role ?? null, data: current.data } : null
        : null,
      sparedPlayerIds: current?.kind === "lynch-spare"
        ? aliveVoters(state).filter(player => !state.lynchRemaining.includes(player.id)).map(player => player.id)
        : [],
      currentStep: isGM ? gmSteps?.[0] ?? null : null,
      stepsRemaining: gmSteps,
      upcomingSteps,
      canAct: !!current && !isGM && activeRoleActionsAllowed(state, viewerId, current),
      action: ownSubmission,
      privateResults: ownPrivateResults,
      gmPrivateResults: isGM ? state.privateResults : undefined,
      gmActions: isGM
        ? { ...state.actions, ...(currentWinCheck ? { lastWinCheck: currentWinCheck } : {}) }
        : undefined,
      nightResolution: isGM ? state.night : viewer?.role === "alchemist" ? {
        wolfTarget: state.night.wolfTarget,
        oldKnightWillDie: state.night.oldKnightVictim === viewer.id,
        oldKnightSaveTarget: state.night.oldKnightVictim
      } : undefined,
      wolfSubmissions: isGM || viewerIsWolf ? wolvesTargets : undefined,
      wolfTarget: isGM || viewerIsWolf ? state.night.wolfTarget : undefined,
      wolfWarning: viewerIsWolf && current?.kind === "wolf-target"
        ? currentWolfSubmissions(state, current).some(item => wiseWolfWarning(state, item.targetId))
        : false,
      publicActions: {
        bearGrowl: state.actions.bearman ? { growl: state.actions.bearman.growl } : null,
        bigBadRevealed: Object.values(state.seats).some(player => player.role === "big-bad-wolf" && player.publiclyRevealed),
        moonCard: state.currentMoon,
        moonCardName: state.currentMoon ? MOON_NAMES[state.currentMoon] : null
      },
      moonOffers: isGM || viewerId === state.mayorId ? state.moonOffers : [],
      moonDeckRemaining: state.moonDeck.length,
      resources: viewer?.role === "alchemist" || isGM ? { potion: state.potionAvailable, poison: state.poisonAvailable } : undefined,
      deaths: publicDeaths,
      events: state.events,
      buried: state.buried,
      result: state.phase === "results" ? { winner: state.winner, winners: state.winners } : null,
      results: state.phase === "results" ? Object.values(state.seats).map(player => ({
        id: player.id,
        username: player.username,
        role: player.role,
        alive: player.alive,
        won: state.winners.includes(player.id)
      })) : undefined,
      options: {
        join: state.phase === "lobby" && !viewer && !isGM && Object.keys(state.seats).length < Math.min(state.settings.rolePool.length, 20 - (state.gmId ? 1 : 0)),
        leave: state.phase === "lobby" && !!viewer,
        configure: state.phase === "lobby",
        setGM: state.phase === "lobby",
        start: state.phase === "lobby" && isGM,
        submitAction: state.phase === "playing" && !isGM && !!current && activeRoleActionsAllowed(state, viewerId, current),
        gmAction: state.phase === "playing" && isGM,
        confirmStep: state.phase === "playing" && isGM && !!current
      }
    };
  }
};
