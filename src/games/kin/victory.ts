import { population } from "./buildings";
import { cardById } from "./cards.data";
import { treatyDef, treatyType } from "./treaties";
import { cleanupCommonwealth } from "./commonwealth";
import { cleanupKingdom } from "./kingdom";
import { cleanupExploration } from "./exploration";
import { lawBoard } from "./laws";
import { KINS } from "./kins";
import { startPlay } from "./play";
import type { KinState } from "./types";

// The victory condition of the New Dawn chapter, checked at the end of every Control phase.

export const AREAS = ["population", "strength", "treaties", "mana", "technologies", "relics"] as const;
export type Area = (typeof AREAS)[number];
export type Standing = Record<Area, number>;

// The chapters that can be played so far. The other chapters come with their own milestones.
export const AVAILABLE_CHAPTERS = ["new-dawn", "commonwealth", "kingdom", "exploration"] as const;
export const AREAS_NEEDED = 4;

// A vassal gave out their Vassal Treaty: everything they have counts for the player who holds it, and they cannot win.
export function lordOf(state: KinState, player: string): string | null {
  return state.items.find(item => item.def === treatyDef("vassal") && item.giver === player)?.owner ?? null;
}

const ownStanding = (state: KinState, player: string): Standing => ({
  population: population(state, player),
  strength: state.armies.filter(army => army.owner === player && army.tile >= 0).reduce((sum, army) => sum + army.strength, 0),
  treaties: state.items.filter(item => !!treatyType(item.def) && (
    item.zone === `court:${player}` ||
    (item.giver === player && state.order.some(other => other !== player && item.zone === `court:${other}`))
  )).length,
  mana: state.players[player].resources.mana ?? 0,
  technologies: state.items.filter(item => item.zone === `court:${player}` && cardById(item.def)?.kind === "technology").length,
  relics: state.players[player].resources.relic ?? 0
});

// Follow Vassal Treaties to the player who can win; a cycle has no eligible lord.
function victoryLord(state: KinState, player: string): string | null {
  const seen = new Set([player]);
  let current = player;
  while (true) {
    const lord = lordOf(state, current);
    if (!lord) return current;
    if (seen.has(lord)) return null;
    seen.add(lord);
    current = lord;
  }
}

export function explorationWinner(state: KinState): string | null {
  if (!state.exploration || state.exploration.placing || state.blocks?.some(block => block.kind === "ruins")) return null;
  const ranked = Object.entries(standings(state)).sort((a, b) => b[1].relics - a[1].relics);
  if (!ranked.length) return null;
  if (ranked.length === 1 || ranked[0][1].relics > ranked[1][1].relics) return ranked[0][0];
  const leader = state.chapter?.leader;
  return leader ? victoryLord(state, leader) : null;
}

export function victoryGold(state: KinState): Record<string, number> {
  const result: Record<string, number> = {};
  for (const player of state.order) {
    const lord = victoryLord(state, player);
    if (lord) result[lord] = (result[lord] ?? 0) + (state.players[player].resources.gold ?? 0);
  }
  return result;
}

export function commonwealthWinner(state: KinState): string | null {
  const commonwealth = state.commonwealth;
  if (!commonwealth) return null;
  const gold = victoryGold(state);
  const total = Object.values(gold).reduce((sum, amount) => sum + amount, 0);
  const richest = Object.keys(gold).find(player => gold[player] > total - gold[player]);
  if (richest) return richest;
  if (commonwealth.step === 10 && victoryLord(state, commonwealth.leader) === commonwealth.leader) return commonwealth.leader;
  const opposition = commonwealth.oppositionLeader;
  return commonwealth.step === 1 && opposition && victoryLord(state, opposition) === opposition ? opposition : null;
}

// What counts for each player who can win: their own pieces plus those of every vassal in their chain. Tapped cards count too.
export function standings(state: KinState): Record<string, Standing> {
  const result: Record<string, Standing> = {};
  for (const player of state.order) {
    const lord = victoryLord(state, player);
    if (lord && !result[lord]) result[lord] = { population: 0, strength: 0, treaties: 0, mana: 0, technologies: 0, relics: 0 };
  }
  for (const player of state.order) {
    const lord = victoryLord(state, player);
    if (!lord || !result[lord]) continue;
    const own = ownStanding(state, player);
    for (const area of AREAS) result[lord][area] += own[area];
  }
  return result;
}

// For each area the player holding the strict most (no ties). Holding nothing is not holding the most.
export function areaLeaders(state: KinState): Record<Area, string | null> {
  const table = standings(state);
  const leaders = {} as Record<Area, string | null>;
  for (const area of AREAS) {
    const ranked = Object.entries(table).sort((a, b) => b[1][area] - a[1][area]);
    const [best, next] = ranked;
    leaders[area] = best && best[1][area] > 0 && (!next || next[1][area] < best[1][area]) ? best[0] : null;
  }
  return leaders;
}

export function newDawnWinner(state: KinState): string | null {
  const counts: Record<string, number> = {};
  for (const leader of Object.values(areaLeaders(state))) if (leader) counts[leader] = (counts[leader] ?? 0) + 1;
  return Object.entries(counts).find(([, count]) => count >= AREAS_NEEDED)?.[0] ?? null;
}

export function kingdomWinner(state: KinState): string | null {
  const kingdom = state.kingdom;
  if (!kingdom) return null;
  const board = lawBoard(state);
  if (!lordOf(state, kingdom.king) && board.deck.length === 0 && board.discard.length === 0) return kingdom.king;
  const table = standings(state);
  const royalStrength = table[kingdom.king]?.strength ?? 0;
  const rebels = Object.entries(table).filter(([player]) => player !== kingdom.king);
  return rebels.find(([player, standing]) => standing.strength > royalStrength &&
    rebels.every(([other, score]) => other === player || standing.strength > score.strength))?.[0] ?? null;
}

// The chapter that is being played, who won the earlier ones and what the campaign scores are.
export function chapterOf(state: KinState): NonNullable<KinState["chapter"]> {
  return (state.chapter ??= { current: "new-dawn", leader: null, history: [], points: {} });
}

// Called when the Control phase has ended. A winner ends the game when the game type says so; otherwise play goes on.
export function checkVictory(state: KinState): boolean {
  if (state.result || state.chapter?.pending) return true;
  const chapter = chapterOf(state);
  const winner = chapter.current === "exploration" ? explorationWinner(state)
    : chapter.current === "kingdom" ? kingdomWinner(state) : chapter.current === "commonwealth" ? commonwealthWinner(state) : newDawnWinner(state);
  if (!winner) return false;
  const previous = chapter.history[chapter.history.length - 1];
  chapter.history.push({ chapter: chapter.current, winner, round: state.round });
  chapter.points[winner] = (chapter.points[winner] ?? 0) + 1;
  const played = new Set(chapter.history.map(entry => entry.chapter));
  const chaptersLeft = state.options.mode === "campaign" && chapter.leader === winner
    ? ["new-dawn"] : AVAILABLE_CHAPTERS.filter(id => !played.has(id));
  const mode = state.options.mode;
  let reason: string | null = null;
  if (mode === "short") reason = "The winner of the opening chapter wins a short game.";
  else if (mode === "long" && previous?.winner === winner) reason = "The winner won two chapters in a row.";
  else if (chaptersLeft.length === 0) reason = mode === "long" ? "No chapters remain, so the winner of the last chapter wins." : "All chapters have been played.";
  const collapse = mode === "campaign" ? chapter.leader : chapter.leader !== winner ? chapter.leader : null;
  if (collapse && replacementKins(state).length === 0) reason = "A Kin collapsed and no unpicked Kin remain.";
  if (reason === null) {
    chapter.pending = { player: winner, choices: chaptersLeft };
    chapter.collapse = collapse;
    return true;
  }
  state.result = { winner, reason, mode, chapter: chapter.current, round: state.round, areas: areaLeaders(state), points: { ...chapter.points } };
  state.phase = "results";
  return true;
}

export function replacementKins(state: KinState): string[] {
  const used = new Set([...Object.values(state.world?.kinPicks ?? {}), ...(state.chapter?.retiredKins ?? [])]);
  return KINS.map(kin => kin.id).filter(kin => !used.has(kin));
}

export function validateChapter(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const pending = state.chapter?.pending;
  if (!pending) return "No chapter is waiting to be chosen.";
  if (pending.player !== player) return "Only the chapter winner chooses the next chapter.";
  return typeof action.chapter === "string" && pending.choices.includes(action.chapter) ? null : "Choose one of the remaining chapters.";
}

function collapseKin(state: KinState, player: string) {
  const world = state.world!;
  (state.chapter!.retiredKins ??= []).push(world.kinPicks[player]);
  for (const card of Object.values(state.cards).filter(card => card.owner === player)) {
    if (card.hostageOf) {
      card.owner = card.hostageOf;
      card.zone = `court:${card.hostageOf}`;
      delete card.hostageOf;
    } else { card.zone = "discard:character"; card.owner = null; }
  }
  state.items = state.items.filter(item => item.zone !== `court:${player}`);
  state.players[player].resources = {};
  state.players[player].relicsTapped = 0;
  for (const building of state.buildings.filter(building => building.owner === player && building.kind === "tile")) {
    if (building.tile >= 0 && !state.blocks?.some(block => block.tile === building.tile && block.kind === "ruins"))
      (state.blocks ??= []).push({ tile: building.tile, kind: "ruins" });
  }
  state.buildings = state.buildings.filter(building => building.owner !== player);
  state.armies = state.armies.filter(army => army.owner !== player);
  for (const board of [state.tactics, state.subterfuge]) {
    if (board?.hands[player]) { board.discard.push(...board.hands[player]); delete board.hands[player]; }
  }
  if (state.thralls) delete state.thralls[player];
  if (state.predictions) state.predictions = state.predictions.filter(prediction => prediction.player !== player);
  delete world.kinPicks[player];
  delete world.setup[player];
  if (world.setupBuildings) delete world.setupBuildings[player];
  world.claimed = world.claimed.filter(id => id !== player);
  world.charPicks = [];
  world.redraftPlayer = player;
  world.step = "kin";
  state.phase = "draft";
  state.play = null;
}

export function chooseChapter(state: KinState, player: string, action: Record<string, unknown>) {
  const chapter = chapterOf(state);
  cleanupCommonwealth(state);
  cleanupKingdom(state);
  cleanupExploration(state);
  chapter.current = String(action.chapter);
  chapter.leader = player;
  chapter.pending = null;
  chapter.starting = true;
  if (chapter.collapse) {
    const collapsed = chapter.collapse;
    chapter.collapse = null;
    collapseKin(state, collapsed);
  } else startPlay(state);
}
