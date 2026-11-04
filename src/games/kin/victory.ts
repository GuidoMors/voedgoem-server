import { population } from "./buildings";
import { cardById } from "./cards.data";
import { treatyDef, treatyType } from "./treaties";
import type { KinState } from "./types";

// The victory condition of the New Dawn chapter, checked at the end of every Control phase.

export const AREAS = ["population", "strength", "treaties", "mana", "technologies", "relics"] as const;
export type Area = (typeof AREAS)[number];
export type Standing = Record<Area, number>;

// The chapters that can be played so far. The other chapters come with their own milestones.
export const AVAILABLE_CHAPTERS = ["new-dawn"] as const;
export const AREAS_NEEDED = 4;

// A vassal gave out their Vassal Treaty: everything they have counts for the player who holds it, and they cannot win.
export function lordOf(state: KinState, player: string): string | null {
  return state.items.find(item => item.def === treatyDef("vassal") && item.giver === player)?.owner ?? null;
}

const ownStanding = (state: KinState, player: string): Standing => ({
  population: population(state, player),
  strength: state.armies.filter(army => army.owner === player && army.tile >= 0).reduce((sum, army) => sum + army.strength, 0),
  treaties: state.items.filter(item => item.zone === `court:${player}` && !!treatyType(item.def)).length,
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

// The chapter that is being played, who won the earlier ones and what the campaign scores are.
export function chapterOf(state: KinState) {
  return (state.chapter ??= { current: "new-dawn", leader: null, history: [], points: {} });
}

// Called when the Control phase has ended. A winner ends the game when the game type says so; otherwise play goes on.
export function checkVictory(state: KinState): boolean {
  if (state.result) return true;
  const winner = newDawnWinner(state);
  if (!winner) return false;
  const chapter = chapterOf(state);
  const previous = chapter.history[chapter.history.length - 1];
  chapter.history.push({ chapter: chapter.current, winner, round: state.round });
  chapter.points[winner] = (chapter.points[winner] ?? 0) + 1;
  const played = new Set(chapter.history.map(entry => entry.chapter));
  const chaptersLeft = AVAILABLE_CHAPTERS.filter(id => !played.has(id));
  const mode = state.options.mode;
  let reason: string | null = null;
  if (mode === "short") reason = "The winner of the opening chapter wins a short game.";
  else if (mode === "long" && previous?.winner === winner) reason = "The winner won two chapters in a row.";
  else if (chaptersLeft.length === 0) reason = mode === "long" ? "No chapters remain, so the winner of the last chapter wins." : "All chapters have been played.";
  if (reason === null) {
    // Another chapter follows: the winner is its leader and will choose it.
    chapter.leader = winner;
    return false;
  }
  state.result = { winner, reason, mode, chapter: chapter.current, round: state.round, areas: areaLeaders(state), points: { ...chapter.points } };
  state.phase = "results";
  return true;
}
