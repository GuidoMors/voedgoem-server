import { hasCard, maxArmyStrength } from "./cards";
import { arkBoardOf, garrison, wallBlocks } from "./buildings";
import { characterById } from "./draft";
import { adjacent, activationError, armiesOf, endTurn, resumeMove, setTapped, sourcesFor, type Source } from "./play";
import { rollDie } from "./rng";
import { breakOnAttack } from "./treaties";
import { announce, counterattack, dolomorActivate, dolomorReaction, dolomorStrike } from "./tactics";
import { dominates, iheratPay, iheratReaction, thrallInBattle } from "./deepones";
import { characterAbilitySource, characterPower, hasChar } from "./neutrals";
import { influence, spendInfluence } from "./hanshu";
import { canHunt, huntTiles, intimidates, lumonBarred, redeemed } from "./lumon";
import { answerRiverToll, canPlea, startPlea } from "./streams";
import type { Army, BattleReport, BattleSide, BattleState, Building, DiceChoice, DiceKind, KinState, ReactionState } from "./types";

// Battle: an army attacks an adjacent tile with an army or a tile or center building of another player.

interface Face { hits?: number; blocks?: number; self?: number; ambush?: number }

// Faces 1 to 6 of each kind of combat die.
export const DICE: Record<DiceKind, Face[]> = {
  strategic: [{}, { hits: 1 }, { blocks: 1 }, { blocks: 1, hits: 1 }, { blocks: 2 }, { hits: 2 }],
  aggressive: [{ self: 2 }, { self: 2, hits: 1 }, { self: 1, hits: 2 }, { self: 1, hits: 2 }, { hits: 2 }, { hits: 3 }],
  ambush: [{ self: 2, hits: 1 }, { self: 1, hits: 1 }, { blocks: 1, hits: 1 }, { hits: 2 }, { self: 1 }, { ambush: 1 }],
  defensive: [{ hits: 1 }, { blocks: 1 }, { blocks: 1 }, { blocks: 1, hits: 1 }, { blocks: 2 }, { blocks: 3 }]
};

export const DICE_KINDS = Object.keys(DICE) as DiceKind[];
const UNLOCK: Partial<Record<DiceKind, string>> = { aggressive: "aggresive-combat", defensive: "defensive-combat", ambush: "ambush-combat" };

// Only the strategic dice are known at the start; the others come with a technology.
export const unlockedDice = (state: KinState, player: string): DiceKind[] =>
  DICE_KINDS.filter(kind => !UNLOCK[kind] || hasCard(state, player, UNLOCK[kind]!));

const isCombatBuilding = (building: Building) => (building.kind === "tile" || building.kind === "center") && building.owner !== null;
const buildingsOn = (state: KinState, tile: number) => state.buildings.filter(building => building.tile === tile && isCombatBuilding(building));

// The tile or center building that can be destroyed on a tile: the tile building if there is one.
const mainBuilding = (state: KinState, tile: number, owner: string): Building | undefined => {
  const own = buildingsOn(state, tile).filter(building => building.owner === owner);
  return own.find(building => building.kind === "tile") ?? own[0];
};

// Enemy tiles an army could attack: adjacent, not behind a wall, with an army or a tile or center building of another player.
export function battleTargets(state: KinState, army: Army): number[] {
  if (army.tile < 0 || army.status) return [];
  const targets = new Set<number>();
  for (const tile of adjacent(state, army.owner, army.tile)) {
    if (wallBlocks(state, army.owner, army.tile, tile)) continue;
    const enemy = state.armies.some(other => other.tile === tile && other.owner !== army.owner) || buildingsOn(state, tile).some(building => building.owner !== army.owner);
    const owner = enemy ? defenderOn(state, army.owner, tile) : null;
    if (enemy && !(owner && intimidates(state, owner, army.strength))) targets.add(tile);
  }
  return [...targets];
}

export const battleOptions = (state: KinState, player: string): { army: string; targets: number[] }[] =>
  armiesOf(state, player).map(army => ({ army: army.id, targets: battleTargets(state, army) })).filter(option => option.targets.length > 0);

export const canBattle = (state: KinState, player: string) => battleOptions(state, player).length > 0;

// The player on the target tile: the owner of an army there, otherwise the owner of its building.
function defenderOn(state: KinState, attacker: string, tile: number): string | null {
  const army = state.armies.find(other => other.tile === tile && other.owner !== attacker);
  if (army) return army.owner;
  return buildingsOn(state, tile).find(building => building.owner !== attacker)?.owner ?? null;
}

const defendingArmies = (state: KinState, defender: string, tile: number) => state.armies.filter(army => army.tile === tile && army.owner === defender);

// Strength pool of the defender without the general: the armies on the tile and the garrison of its building.
export function defenderBase(state: KinState, defender: string, tile: number) {
  const building = mainBuilding(state, tile, defender);
  // Nitrosium's Sabotage: the garrison of the building is not added for the rest of the round.
  return { army: defendingArmies(state, defender, tile).reduce((sum, army) => sum + army.strength, 0), garrison: building && !state.sabotaged?.includes(building.id) ? garrison(state, building) : 0 };
}

// Control characters the defender can tap as their general. Horus only has his gold-based power as an attacker.
export const defenderGenerals = (state: KinState, defender: string): Source[] =>
  sourcesFor(state, defender, "control").filter(source => source.kind === "character" && !lumonBarred(state, defender, source.id)).map(source => characterAbilitySource(state, defender, source, "horus") ? { ...source, power: 0 } : source);

// Barendam's Smite: 2 mana adds 2 strength to the pool of a battle where he is the general.
export const SMITE = 2;
export const canSmite = (state: KinState, player: string, general: string | null | undefined) =>
  general === "barendam" && hasChar(state, player, "barendam") && (state.players[player].resources.mana ?? 0) >= SMITE;
const smiteOf = (state: KinState, player: string, general: string | null | undefined, wanted: unknown) => wanted === true && canSmite(state, player, general) ? SMITE : 0;

// Liangzhuge: a prediction (a whole number of hits) as general costs 1 influence.
export const canPredict = (state: KinState, player: string, general: string | null | undefined, prediction: unknown) =>
  general === "liangzhuge" && hasChar(state, player, "liangzhuge") && influence(state, player) >= 1 && Number.isInteger(prediction) && (prediction as number) >= 0;

function readDice(state: KinState, player: string, value: unknown, pool: number): DiceChoice | string {
  const raw = (value ?? {}) as Record<string, unknown>;
  const unlocked = unlockedDice(state, player);
  const choice: DiceChoice = {};
  let total = 0;
  for (const [kind, count] of Object.entries(raw)) {
    if (!DICE_KINDS.includes(kind as DiceKind)) return "Unknown dice.";
    if (!Number.isInteger(count) || (count as number) < 0) return "Choose whole numbers of dice.";
    if ((count as number) === 0) continue;
    if (!unlocked.includes(kind as DiceKind)) return `You do not know the technology for the ${kind} dice.`;
    choice[kind as DiceKind] = count as number;
    total += count as number;
  }
  return total === pool ? choice : `Your strength pool is ${pool}: choose exactly ${pool} dice.`;
}

// --- Starting a battle ---

export function validateBattle(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "battle", "control");
  if (typeof source === "string") return source;
  const option = battleOptions(state, player).find(candidate => candidate.army === action.army);
  if (!option) return "Choose one of your armies, not exhausted, next to an army or building of another player.";
  if (!option.targets.includes(action.tile as number)) return "Choose an adjacent tile with an army or building of another player.";
  const army = state.armies.find(candidate => candidate.id === action.army)!;
  if (action.smite === true && !canSmite(state, player, source.kind === "character" ? source.id : null)) return "Smite needs Barendam as your general and 2 mana.";
  if (action.predict !== undefined && !canPredict(state, player, source.kind === "character" ? source.id : null, action.predict)) return "A prediction needs Liangzhuge as your general, 1 influence and a whole number of hits.";
  if (source.kind === "character" && lumonBarred(state, player, source.id)) return "Lumon cannot be used as a general by another player.";
  const power = source.kind === "character" && source.id === "horus" ? characterPower(state, player, source.id, source.power) : source.power;
  const dice = readDice(state, player, action.dice, power + smiteOf(state, player, source.id, action.smite) + army.strength);
  return typeof dice === "string" ? dice : null;
}

export function battle(state: KinState, player: string, action: Record<string, unknown>) {
  const play = state.play!;
  const source = activationError(state, player, action, "battle", "control") as Source;
  const army = state.armies.find(candidate => candidate.id === action.army)!;
  const tile = action.tile as number;
  const defender = defenderOn(state, player, tile)!;
  // Chosen Thrall (Deep Ones): the general joins their court and the Battle is cancelled.
  if (source.kind === "character" && thrallInBattle(state, defender, source.id)) {
    setTapped(state, source, true);
    play.passes = 0;
    return endTurn(state);
  }
  const smite = source.kind === "character" ? smiteOf(state, player, source.id, action.smite) : 0;
  const power = source.kind === "character" && source.id === "horus" ? characterPower(state, player, source.id, source.power) : source.power;
  const battleSource = { ...source, power };
  const dice = readDice(state, player, action.dice, power + smite + army.strength) as DiceChoice;
  const predict = source.kind === "character" && canPredict(state, player, source.id, action.predict) ? (action.predict as number) : undefined;
  if (predict !== undefined) spendInfluence(state, player, 1);
  setTapped(state, source, true);
  if (smite) state.players[player].resources.mana -= SMITE;
  play.passes = 0;
  breakOnAttack(state, player, defender);
  const base = defenderBase(state, defender, tile);
  // A building without garrison and without an army is destroyed at once, with no dice.
  if (base.army === 0 && base.garrison === 0) {
    const building = mainBuilding(state, tile, defender)!;
    destroy(state, building);
    play.report = emptyReport(state, player, defender, tile, battleSource, army, building);
    endTurn(state);
    return;
  }
  play.battle = { attacker: player, defender, army: army.id, tile, source: { kind: source.kind, id: source.id }, generalPower: power, ...(smite ? { smite } : {}), ...(predict !== undefined ? { predict } : {}), dice };
}

function emptyReport(state: KinState, attacker: string, defender: string, tile: number, source: Source, army: Army, building: Building): BattleReport {
  const side = (player: string, general: string | null, pool: BattleSide["pool"]): BattleSide => ({ player, general, pool, dice: [], hits: 0, blocks: 0, selfHits: 0, ambush: 0, unblocked: 0 });
  return {
    id: (state.play!.report?.id ?? 0) + 1,
    attacker: side(attacker, source.name, { general: source.power, army: army.strength, garrison: 0 }),
    defender: side(defender, null, { general: 0, army: 0, garrison: 0 }),
    tile, immediate: true, disbanded: [], weakened: [], destroyed: building.def, hostages: []
  };
}

// --- The defender answers ---

export function validateBattleRespond(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const battle = state.play?.battle;
  if (!battle) return "There is no battle to answer.";
  if (battle.defender !== player) return "The battle is not against you.";
  if (battle.round) return "The battle is already being resolved.";
  if (state.play?.consent) return "Wait for the attacker to answer Merciful Plea.";
  let power = 0;
  let general: string | null = null;
  if (action.general !== undefined && action.general !== null) {
    const chosen = defenderGenerals(state, player).find(source => source.id === action.general);
    if (!chosen) return "Choose an untapped Control character in your court as your general, or none.";
    power = dominates(state, battle.attacker, battle.source.kind === "character" ? battle.source.id : null) ? 0 : chosen.power;
    general = chosen.id;
  }
  if (action.smite === true && !canSmite(state, player, general)) return "Smite needs Barendam as your general and 2 mana.";
  if (action.plea === true && !canPlea(state, player, general)) return "Merciful Plea needs Qumono as your general and 2 mana.";
  if (action.predict !== undefined && !canPredict(state, player, general, action.predict)) return "A prediction needs Liangzhuge as your general, 1 influence and a whole number of hits.";
  const base = defenderBase(state, player, battle.tile);
  const dice = readDice(state, player, action.dice, power + smiteOf(state, player, general, action.smite) + base.army + base.garrison);
  return typeof dice === "string" ? dice : null;
}

const IMMUNE_TO_HOSTAGE = ["ethereal", "lumon"];

type Die = { kind: DiceKind; face: number };

// Adds (or with sign -1 removes) the faces of dice to the totals of a side.
function tally(side: BattleSide, dice: Die[], sign: 1 | -1 = 1) {
  for (const die of dice) {
    const result = DICE[die.kind][die.face - 1];
    side.hits += sign * (result.hits ?? 0);
    side.blocks += sign * (result.blocks ?? 0);
    side.selfHits += sign * (result.self ?? 0);
    side.ambush += sign * (result.ambush ?? 0);
  }
}

function roll(state: KinState, player: string, general: string | null, pool: BattleSide["pool"], choice: DiceChoice): BattleSide {
  const side: BattleSide = { player, general, pool, dice: [], hits: 0, blocks: 0, selfHits: 0, ambush: 0, unblocked: 0 };
  for (const kind of DICE_KINDS) {
    for (let index = 0; index < (choice[kind] ?? 0); index++) side.dice.push({ kind, face: rollDie(state.rng) });
  }
  tally(side, side.dice);
  return side;
}

// Takes hits on armies: each hit removes 1 strength, an army at 0 is disbanded. Returns the hits left over.
function hitArmies(state: KinState, armies: Army[], hits: number, report: BattleReport): number {
  for (const army of armies) {
    const taken = Math.min(hits, army.strength);
    if (taken === 0) continue;
    army.strength -= taken;
    hits -= taken;
    if (army.strength === 0) {
      state.armies = state.armies.filter(other => other !== army);
      report.disbanded.push(army.id);
    } else report.weakened.push(army.id);
  }
  return hits;
}

// Buildings are destroyed, not captured. Destroying a tile building also destroys the slices in it.
export function destroy(state: KinState, building: Building) {
  const gone = new Set([building.id]);
  if (building.kind === "tile") for (const slice of state.buildings) if (slice.kind === "slice" && slice.tile === building.tile) gone.add(slice.id);
  // The Eternal Ark: destroying the Ark destroys everything on the ark board.
  if (building.def === "the-ark") for (const inside of arkBoardOf(state, building)) gone.add(inside.id);
  state.buildings = state.buildings.filter(candidate => !gone.has(candidate.id));
}

function hostage(state: KinState, cardId: string, taker: string, from: string, report: BattleReport) {
  const card = state.cards[cardId];
  card.owner = taker;
  card.zone = `court:${taker}`;
  card.hostageOf = from;
  report.hostages.push(card.id);
}

// Great Feasts (Beastmen): 1 food for each army disbanded in a battle you took part in, your own armies included.
function greatFeasts(state: KinState, players: string[], disbanded: number) {
  if (disbanded < 1) return;
  for (const who of players) {
    if (hasCard(state, who, "great-feasts")) state.players[who].resources.food = (state.players[who].resources.food ?? 0) + disbanded;
  }
}

export function battleRespond(state: KinState, player: string, action: Record<string, unknown>) {
  const play = state.play!;
  const pending = play.battle as BattleState;
  const attackerArmy = state.armies.find(candidate => candidate.id === pending.army)!;
  const attackerSource = pending.source;
  if (action.plea === true) return startPlea(state, player, action);
  if (counterattack(state, player, pending.attacker, attackerArmy)) {
    const side = (who: string, pool: BattleSide["pool"]): BattleSide => ({ player: who, general: null, pool, dice: [], hits: 0, blocks: 0, selfHits: 0, ambush: 0, unblocked: 0 });
    play.report = {
      id: (play.report?.id ?? 0) + 1,
      attacker: side(pending.attacker, { general: pending.generalPower, army: 0, garrison: 0 }),
      defender: side(player, { general: 0, army: 0, garrison: 0 }),
      tile: pending.tile, immediate: true, disbanded: [attackerArmy.id], weakened: [], destroyed: null, hostages: []
    };
    play.battle = null;
    greatFeasts(state, [pending.attacker, player], 1);
    return endTurn(state);
  }
  let defenderGeneral: Source | undefined;
  if (action.general !== undefined && action.general !== null) {
    defenderGeneral = defenderGenerals(state, player).find(source => source.id === action.general);
    if (defenderGeneral) {
      setTapped(state, defenderGeneral, true);
      // Chosen Thrall (Deep Ones): the general joins their court and the Battle is cancelled.
      if (thrallInBattle(state, pending.attacker, defenderGeneral.id)) {
        play.battle = null;
        play.passes = 0;
        return endTurn(state);
      }
      // Raheskah: the opposing general has no power.
      if (dominates(state, pending.attacker, attackerSource.kind === "character" ? attackerSource.id : null)) defenderGeneral = { ...defenderGeneral, power: 0 };
    }
  }
  // Raheskah as the defending general sets the power of the attacking general to 0.
  const attackerPower = dominates(state, player, defenderGeneral?.id) ? 0 : pending.generalPower;
  // The attacker may have lost strength: the dice cannot exceed the strength pool that is left.
  let excess = Object.values(pending.dice).reduce((sum, count) => sum + (count ?? 0), 0) - (attackerPower + (pending.smite ?? 0) + attackerArmy.strength);
  for (const kind of [...DICE_KINDS].reverse()) {
    const cut = Math.min(Math.max(excess, 0), pending.dice[kind] ?? 0);
    if (cut > 0) pending.dice[kind] = (pending.dice[kind] ?? 0) - cut;
    excess -= cut;
  }
  const defenderSmite = smiteOf(state, player, defenderGeneral?.id, action.smite);
  if (defenderSmite) state.players[player].resources.mana -= SMITE;
  const predictionPaid = canPredict(state, player, defenderGeneral?.id, action.predict);
  if (predictionPaid) spendInfluence(state, player, 1);
  const base = defenderBase(state, player, pending.tile);
  const defenderChoice = readDice(state, player, action.dice, (defenderGeneral?.power ?? 0) + defenderSmite + base.army + base.garrison) as DiceChoice;
  const attackerName = attackerSource.kind === "character" ? characterById(state.cards[attackerSource.id].def)?.name ?? "General" : "Activation card";
  const attackerSide = roll(state, pending.attacker, attackerName, { general: attackerPower + (pending.smite ?? 0), army: attackerArmy.strength, garrison: 0 }, pending.dice);
  const defenderSide = roll(state, player, defenderGeneral?.name ?? null, { general: (defenderGeneral?.power ?? 0) + defenderSmite, army: base.army, garrison: base.garrison }, defenderChoice);
  const report: BattleReport = { id: (play.report?.id ?? 0) + 1, attacker: attackerSide, defender: defenderSide, tile: pending.tile, immediate: false, disbanded: [], weakened: [], destroyed: null, hostages: [] };

  // Gorengar the Black, Grim Defender: as a general he adds 2 blocks to the result.
  if (attackerSource.kind === "character" && attackerSource.id === "gorengar-the-black" && hasChar(state, pending.attacker, "gorengar-the-black")) attackerSide.blocks += 2;
  if (defenderGeneral?.id === "gorengar-the-black" && hasChar(state, player, "gorengar-the-black")) defenderSide.blocks += 2;
  // Thorngast, Shield of Thorns: as the attacking general he adds 3 hits to the dice results.
  if (attackerSource.kind === "character" && hasChar(state, pending.attacker, "thorngast") && (attackerSource.id === "thorngast" || state.borrowed?.[attackerSource.id] === "thorngast")) attackerSide.hits += 3;

  pending.round = {
    stage: "dice", report, attackerPower, garrison: base.garrison,
    defenderGeneral: defenderGeneral ? { id: defenderGeneral.id, power: defenderGeneral.power } : null,
    predicted: { ...(pending.predict !== undefined ? { attacker: pending.predict } : {}), ...(predictionPaid ? { defender: action.predict as number } : {}) }
  };
  // The dice are rolled and visible: before they are resolved, the attacking Dorhor and Iherat may step in.
  play.reactions = [];
  if (isGeneral(state, pending.attacker, attackerSource, "dorhor-of-norvador") && attackerSide.dice.length > 0) {
    play.reactions.push({
      kind: "dorhor", owner: pending.attacker, title: "Troll King Stash",
      text: "Dorhor of Norvador: reroll up to 3 of your combat dice, or decline.",
      options: attackerSide.dice.map((die, index) => ({ id: String(index), label: `Die ${index + 1}: ${DICE_NAMES[die.kind]} ${die.face}` })), min: 0, max: 3
    });
  }
  const conversion = iheratReaction(state);
  if (conversion) play.reactions.push(conversion);
  proceed(state);
}

const DICE_NAMES: Record<DiceKind, string> = { strategic: "Strategic", aggressive: "Aggressive", ambush: "Ambush", defensive: "Defensive" };

// A character is the general of a side when he is the one tapped for the Battle, or when Birchawe borrows his ability.
const isGeneral = (state: KinState, player: string, source: { kind: string; id: string } | null | undefined, id: string) =>
  !!source && source.kind === "character" && hasChar(state, player, id) && (source.id === id || state.borrowed?.[source.id] === id);

// --- The steps of a battle after the roll ---
// Dice -> (Dorhor, Iherat) -> Resolve Dice -> (Bulu, Relic Seekers) -> Ambush -> (Taahira, Dolomor Darkeye) -> the report. A reaction in
// `play.reactions` pauses the battle until its owner answers; `proceed` carries on as soon as the queue is empty.

function proceed(state: KinState) {
  const play = state.play!;
  while (!play.reactions?.length) {
    const round = play.battle!.round!;
    if (round.stage === "dice") {
      round.stage = "ambush";
      play.reactions = resolveDice(state);
    } else if (round.stage === "ambush") {
      round.stage = "after";
      ambush(state);
      play.reactions = afterBattle(state);
    } else return finish(state);
  }
}

function finish(state: KinState) {
  const play = state.play!;
  play.report = play.battle!.round!.report;
  play.battle = null;
  play.reactions = [];
  endTurn(state);
}

function resolveDice(state: KinState): ReactionState[] {
  const battle = state.play!.battle!;
  const round = battle.round!;
  const { report } = round;
  const attackerSide = report.attacker;
  const defenderSide = report.defender;
  const attackerArmy = state.armies.find(candidate => candidate.id === battle.army)!;
  // Self hits count for the opponent; then each side's blocks cancel hits against it.
  defenderSide.unblocked = Math.max(0, attackerSide.hits + defenderSide.selfHits - defenderSide.blocks);
  attackerSide.unblocked = Math.max(0, defenderSide.hits + attackerSide.selfHits - attackerSide.blocks);
  // Liangzhuge: a prediction that equals the hits rolled by the opponent blocks all of those hits; the own self hits still count.
  if (round.predicted.attacker !== undefined && round.predicted.attacker === defenderSide.hits) attackerSide.unblocked = Math.max(0, attackerSide.selfHits - attackerSide.blocks);
  if (round.predicted.defender !== undefined && round.predicted.defender === attackerSide.hits) defenderSide.unblocked = Math.max(0, defenderSide.selfHits - defenderSide.blocks);

  // The ambush looks at the tiles as they were before the damage.
  round.attackerTileBuilt = buildingsOn(state, attackerArmy.tile).length > 0;
  round.defenderTileBuilt = buildingsOn(state, battle.tile).length > 0;
  round.defendersBefore = defendingArmies(state, battle.defender, battle.tile).length;
  const building = mainBuilding(state, battle.tile, battle.defender);

  const left = hitArmies(state, defendingArmies(state, battle.defender, battle.tile), defenderSide.unblocked, report);
  hitArmies(state, [attackerArmy], attackerSide.unblocked, report);
  // Bull of Akantash: when he leads the attack and the army survives, it gains 1 strength.
  if (battle.source.kind === "character" && battle.source.id === "bull-of-akantash" && hasChar(state, battle.attacker, "bull-of-akantash")
    && state.armies.includes(attackerArmy)) attackerArmy.strength = Math.min(maxArmyStrength(state, battle.attacker), attackerArmy.strength + 1);
  greatFeasts(state, [battle.attacker, battle.defender], report.disbanded.length);
  if (building && left > 0 && left >= round.garrison) {
    destroy(state, building);
    report.destroyed = building.def;
  }

  // Before the ambush: Bulu is Disloyal, and Relic Seekers may steal a relic.
  const reactions: ReactionState[] = [];
  const attackerGeneral = battle.source.kind === "character" ? battle.source.id : null;
  for (const entry of [
    { who: battle.defender, other: battle.attacker, general: round.defenderGeneral?.id, unblocked: defenderSide.unblocked },
    { who: battle.attacker, other: battle.defender, general: attackerGeneral, unblocked: attackerSide.unblocked }
  ]) {
    if (entry.general !== "bulu" || entry.unblocked < 1 || !hasChar(state, entry.who, "bulu")) continue;
    // Without the influence there is nothing to choose: Bulu leaves.
    if (influence(state, entry.who) < 1) { buluLeaves(state, entry.other); continue; }
    reactions.push({
      kind: "bulu", owner: entry.who, title: "Disloyal",
      text: `Bulu took unblocked hits: pay 1 influence to keep him, or he joins ${state.players[entry.other].username}'s court.`,
      options: [{ id: "pay", label: "Pay 1 influence" }, { id: "leave", label: "Bulu joins the opponent" }], min: 1, max: 1
    });
  }
  const relics = state.players[battle.defender].resources.relic ?? 0;
  if (hasCard(state, battle.attacker, "relic-seekers") && relics >= 1 && attackerSide.ambush >= relics) {
    reactions.push({
      kind: "steal", owner: battle.attacker, title: "Relic Seekers",
      text: `Steal 1 relic from ${state.players[battle.defender].username} instead of taking a general hostage?`,
      options: [{ id: "steal", label: "Steal a relic" }], min: 0, max: 1
    });
  }
  return reactions;
}

function buluLeaves(state: KinState, other: string) {
  state.cards.bulu.owner = other;
  state.cards.bulu.zone = `court:${other}`;
  state.cards.bulu.tapped = true;
}

function ambush(state: KinState) {
  const battle = state.play!.battle!;
  const round = battle.round!;
  const { report } = round;
  const attackerSide = report.attacker;
  const defenderSide = report.defender;
  const player = battle.defender;
  const defenderRelics = state.players[player].resources.relic ?? 0;
  // Relic Seekers: with an ambush total of at least the defender's relics, the attacker steals 1 relic instead of a hostage.
  const stealing = round.steal === true && defenderRelics >= 1 && attackerSide.ambush >= defenderRelics;
  if (stealing) {
    state.players[player].resources.relic = defenderRelics - 1;
    state.players[battle.attacker].resources.relic = (state.players[battle.attacker].resources.relic ?? 0) + 1;
  }
  const takeable = (cardId: string, hits: number, ambushTotal: number, power: number, tileBuilt: boolean, owner: string) =>
    !tileBuilt && hits >= 1 && ambushTotal > power && !IMMUNE_TO_HOSTAGE.includes(state.cards[cardId].def) && state.cards[cardId].owner === owner && !redeemed(state, owner);
  if (!stealing && round.defenderGeneral && takeable(round.defenderGeneral.id, defenderSide.unblocked, attackerSide.ambush, round.defenderGeneral.power, !!round.defenderTileBuilt, player)) {
    hostage(state, round.defenderGeneral.id, battle.attacker, player, report);
  }
  if (battle.source.kind === "character" && takeable(battle.source.id, attackerSide.unblocked, defenderSide.ambush, round.attackerPower, !!round.attackerTileBuilt, battle.attacker)) {
    hostage(state, battle.source.id, player, battle.attacker, report);
  }
}

// After the battle has fully resolved: Taahira's hunt and Dolomor Darkeye's Cunning Deception.
function afterBattle(state: KinState): ReactionState[] {
  const battle = state.play!.battle!;
  const round = battle.round!;
  const { report } = round;
  const army = state.armies.find(candidate => candidate.id === battle.army);
  const reactions: ReactionState[] = [];
  const cleared = (round.defendersBefore ?? 0) > 0 && defendingArmies(state, battle.defender, battle.tile).length === 0;
  const general = battle.source.kind === "character" ? battle.source.id : null;
  // Taahira, The Great Hunt: when her army cleared the tile, she may untap and the army moves on.
  if (cleared && army && canHunt(state, battle.attacker, general)) {
    const tiles = huntTiles(state, battle.attacker, army);
    if (tiles.length > 0) {
      reactions.push({
        kind: "taahira", owner: battle.attacker, title: "The Great Hunt",
        text: "Taahira: untap her and move the army to an adjacent non-ocean tile, or decline.",
        options: tiles.map(tile => ({ id: String(tile), label: `Tile ${tile}` })), min: 0, max: 1
      });
    }
  }
  // Dolomor Darkeye: winning is dealing more unblocked hits than the army of the attacker took.
  if (isGeneral(state, battle.attacker, battle.source, "dolomor-darkeye") && report.defender.unblocked > report.attacker.unblocked) {
    const strike = dolomorReaction(state, battle.attacker, battle.defender);
    if (strike) reactions.push(strike);
  }
  return reactions;
}

// --- Answering a reaction ---

export function validateReaction(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const reaction = state.play?.reactions?.[0];
  if (!reaction) return "Nothing is waiting for your answer.";
  if (reaction.owner !== player) return "That decision is not yours.";
  const choices = action.choices;
  if (!Array.isArray(choices) || choices.some(choice => typeof choice !== "string")) return "Choose from the options.";
  if (new Set(choices).size !== choices.length || choices.some(choice => !reaction.options.some(option => option.id === choice))) return "Choose valid, different options.";
  if (choices.length < reaction.min || choices.length > reaction.max) return reaction.min === reaction.max ? `Choose ${reaction.min}.` : `Choose between ${reaction.min} and ${reaction.max} options.`;
  if (reaction.kind === "river-toll-pay" && choices[0] !== "pay" && choices[0] !== "decline") return "Choose to pay or decline the River Toll.";
  if (reaction.kind === "river-toll-pay" && choices[0] === "pay" && (state.players[player].resources.gold ?? 0) < 1) return "You need 1 gold to pay the River Toll.";
  if (reaction.kind === "iherat" && choices.length > 0 && iheratReaction(state)?.owner !== player) return "Iherat cannot be used now.";
  if (reaction.kind === "bulu" && choices[0] === "pay" && influence(state, player) < 1) return "You need 1 influence.";
  return null;
}

export function reactionRespond(state: KinState, player: string, action: Record<string, unknown>) {
  const play = state.play!;
  const reaction = play.reactions!.shift()!;
  const choices = action.choices as string[];
  if (reaction.kind === "river-toll" || reaction.kind === "river-toll-pay") {
    answerRiverToll(state, reaction, choices);
    if (!play.reactions!.length) resumeMove(state);
    return;
  }
  const battle = play.battle!;
  const round = battle.round!;
  const { report } = round;
  if (reaction.kind === "dorhor") {
    const dice = report.attacker.dice;
    for (const index of choices.map(Number)) {
      tally(report.attacker, [dice[index]], -1);
      dice[index] = { kind: dice[index].kind, face: rollDie(state.rng) };
      tally(report.attacker, [dice[index]]);
    }
    if (choices.length > 0) announce(state, `${state.players[player].username}'s Dorhor of Norvador rerolled ${choices.length} ${choices.length === 1 ? "die" : "dice"}.`);
  } else if (reaction.kind === "iherat" && choices.length > 0) {
    iheratPay(state, player);
    const side = report[choices[0] as "attacker" | "defender"];
    const added: Die[] = [{ kind: "ambush", face: rollDie(state.rng) }, { kind: "ambush", face: rollDie(state.rng) }];
    side.dice.push(...added);
    tally(side, added);
  } else if (reaction.kind === "bulu") {
    if (choices[0] === "pay") spendInfluence(state, player, 1);
    else buluLeaves(state, player === battle.attacker ? battle.defender : battle.attacker);
  } else if (reaction.kind === "steal") round.steal = choices.length > 0;
  else if (reaction.kind === "taahira" && choices.length > 0) {
    const army = state.armies.find(candidate => candidate.id === battle.army)!;
    state.cards.taahira.tapped = false;
    army.tile = Number(choices[0]);
  } else if (reaction.kind === "dolomor" && choices.length > 0) {
    const next = dolomorActivate(state, player, battle.defender, Number(choices[0]));
    if (next) play.reactions!.unshift(next);
  } else if (reaction.kind === "dolomor-army") dolomorStrike(state, choices[0]);
  proceed(state);
}
