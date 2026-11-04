import { addItem, hasCard } from "./cards";
import { battleRespond, destroy } from "./battle";
import { onTradeGiven, hasChar } from "./neutrals";
import { activationError, endTurn, setTapped, type Source } from "./play";
import { announce } from "./tactics";
import { breakOnAttack, breakTreaty, treatyAllowed, treatyDef, treatyType } from "./treaties";
import type { KinState, ReactionState } from "./types";
import { neighbors, sideEdge, tileDistance } from "./world";

// Seven Streams Syndicate: Tradegoods, Ruthless Capitalists, River Roamers, the Guild Hall and the characters Qumono and Sunumo.

export const TRADEGOOD = "tradegood";
export const PLEA_COST = 2;
export const TSUNAMI_COST = 3;
export const BASIC = ["gold", "lumber", "stone", "food"];

const amount = (state: KinState, player: string, resource: string) => state.players[player].resources[resource] ?? 0;
const name = (state: KinState, player: string) => state.players[player].username;

export const tradegoods = (state: KinState, player: string) => amount(state, player, TRADEGOOD);

// Trade Treaties in the court of a player, which another player gave them.
export const tradeTreaties = (state: KinState, player: string) =>
  state.items.filter(item => item.def === treatyDef("trade") && item.zone === `court:${player}` && item.giver && item.giver !== player);

// Tradegoods, Seasons Change: every harbor you own and every Trade Treaty you hold from another player produces 1.
export function tradegoodsProduction(state: KinState, player: string): number {
  if (!hasCard(state, player, "tradegoods")) return 0;
  return state.buildings.filter(building => building.owner === player && building.def === "harbor" && building.tile >= 0).length + tradeTreaties(state, player).length;
}

// Guild Hall, when built: all your tradegoods turn into one basic resource.
export function guildHallConvert(state: KinState, player: string, resource: unknown) {
  const count = tradegoods(state, player);
  if (count === 0) return;
  const target = BASIC.includes(String(resource)) ? String(resource) : "gold";
  state.players[player].resources[TRADEGOOD] = 0;
  state.players[player].resources[target] = amount(state, player, target) + count;
}

export const guildHallError = (state: KinState, player: string, resource: unknown): string | null =>
  tradegoods(state, player) > 0 && !BASIC.includes(String(resource)) ? "Choose gold, lumber, stone or food for your tradegoods." : null;

// Tradespeople: gain 1 gold for each Trade Treaty received from another player in a barter.
export function tradespeople(state: KinState, receiver: string, giver: string) {
  if (giver !== receiver && hasCard(state, receiver, "tradespeopple")) state.players[receiver].resources.gold = amount(state, receiver, "gold") + 1;
}

export function answerRiverToll(state: KinState, reaction: ReactionState, choices: string[]) {
  const mover = String(reaction.data?.mover ?? "");
  const demander = String(reaction.data?.demander ?? reaction.owner);
  if (reaction.kind === "river-toll") {
    if (choices.length === 0) return;
    state.play!.reactions!.unshift({
      kind: "river-toll-pay", owner: mover, title: "River Toll",
      text: state.players[demander].username + " demands 1 gold for crossing their river. Pay, or break all treaties with them.",
      options: [...(amount(state, mover, "gold") >= 1 ? [{ id: "pay", label: "Pay 1 gold" }] : []), { id: "decline", label: "Decline and break treaties" }], min: 1, max: 1,
      data: { mover, demander }
    });
    return;
  }
  const treaties = state.items.filter(item => treatyType(item.def) && ((item.giver === mover && item.owner === demander) || (item.giver === demander && item.owner === mover)));
  if (choices[0] === "pay") {
    const paid = 1;
    state.players[mover].resources.gold = amount(state, mover, "gold") - paid;
    state.players[demander].resources.gold = amount(state, demander, "gold") + 1;
    announce(state, name(state, mover) + " paid " + name(state, demander) + " the River Toll.");
    return;
  }
  for (const treaty of treaties) if (state.items.includes(treaty)) breakTreaty(state, mover, treaty);
  const paid = Math.min(treaties.length, amount(state, mover, "gold"));
  state.players[mover].resources.gold = amount(state, mover, "gold") - paid;
  state.players[demander].resources.gold = amount(state, demander, "gold") + paid;
  announce(state, name(state, mover) + " declined the River Toll, broke " + treaties.length + " treaties and paid " + paid + " gold.");
}
// --- River Roamers ---

// Edges of rivers that touch each other (one river flowing into another) form one water system.
function riverSystems(state: KinState): Map<string, number> {
  const parent = new Map<string, string>();
  const find = (vertex: string): string => {
    let root = vertex;
    while (parent.get(root) !== root) root = parent.get(root)!;
    parent.set(vertex, root);
    return root;
  };
  for (const edge of Object.keys(state.world?.rivers ?? {})) {
    const [a, b] = edge.split("|");
    for (const vertex of [a, b]) if (!parent.has(vertex)) parent.set(vertex, vertex);
    parent.set(find(a), find(b));
  }
  const result = new Map<string, number>();
  const ids = new Map<string, number>();
  for (const edge of Object.keys(state.world?.rivers ?? {})) {
    const root = find(edge.split("|")[0]);
    if (!ids.has(root)) ids.set(root, ids.size);
    result.set(edge, ids.get(root)!);
  }
  return result;
}

const riverSystemsAt = (systems: Map<string, number>, tile: number): number[] =>
  [0, 1, 2, 3, 4, 5].flatMap(side => systems.has(sideEdge(tile, side)) ? [systems.get(sideEdge(tile, side))!] : []);

// River Roamers: tiles on the same river as a village (or city) of yours, whether or not an army or building is next to them.
export function riverRoamTiles(state: KinState, player: string): Set<number> {
  const result = new Set<number>();
  if (!hasCard(state, player, "river-roamers") || !state.world) return result;
  const systems = riverSystems(state);
  const mine = new Set(state.buildings.filter(building => building.owner === player && building.kind === "tile" && (building.def === "village" || building.def === "city") && building.tile >= 0).flatMap(building => riverSystemsAt(systems, building.tile)));
  if (mine.size === 0) return result;
  for (let tile = 0; tile < state.tiles.length; tile++) if (riverSystemsAt(systems, tile).some(system => mine.has(system))) result.add(tile);
  return result;
}

// --- Ruthless Capitalists ---

export const RUTHLESS_COST = 3;

// Players you are connected to, who hold no Trade Treaty of yours and of whom you hold none.
export function ruthlessTargets(state: KinState, player: string): string[] {
  return state.order.filter(other => other !== player && treatyAllowed(state, "trade", player, other, []) === null && treatyAllowed(state, "trade", other, player, []) === null);
}

export function validateRuthless(state: KinState, player: string, action: Record<string, unknown>): string | null {
  const source = activationError(state, player, action, "ruthless-capitalists");
  if (typeof source === "string") return source;
  if (tradegoods(state, player) < RUTHLESS_COST) return `You need ${RUTHLESS_COST} tradegoods.`;
  return ruthlessTargets(state, player).includes(String(action.target)) ? null : "Choose a player you are connected to, with whom you hold no Trade Treaty either way.";
}

export function ruthless(state: KinState, player: string, action: Record<string, unknown>) {
  const source = activationError(state, player, action, "ruthless-capitalists") as Source;
  const target = String(action.target);
  state.players[player].resources[TRADEGOOD] = tradegoods(state, player) - RUTHLESS_COST;
  setTapped(state, source, true);
  addItem(state, treatyDef("trade"), `court:${target}`, target, player);
  addItem(state, treatyDef("trade"), `court:${player}`, player, target);
  onTradeGiven(state, player, target);
  onTradeGiven(state, target, player);
  announce(state, `${name(state, player)}'s Ruthless Capitalists exchanged Trade Treaties with ${name(state, target)}.`);
  state.play!.passes = 0;
  endTurn(state);
}

// --- Qumono, Merciful Plea ---

export const canPlea = (state: KinState, defender: string, general: string | null | undefined) =>
  general === "qumono" && hasChar(state, defender, "qumono") && amount(state, defender, "mana") >= PLEA_COST;

// The defender chose Qumono as general and invoked the plea: the answer to the battle waits until the attacker pays or cancels.
export function startPlea(state: KinState, defender: string, answer: Record<string, unknown>) {
  const play = state.play!;
  state.players[defender].resources.mana = amount(state, defender, "mana") - PLEA_COST;
  // Choosing Qumono as general taps him, also when the attacker cancels the battle.
  state.cards.qumono.tapped = true;
  play.consent = { player: defender, owner: play.battle!.attacker, building: "", plea: { ...answer, plea: false } };
  announce(state, `${name(state, defender)}'s Qumono makes a Merciful Plea: ${name(state, play.battle!.attacker)} pays ${PLEA_COST} gold or the attack is cancelled.`);
}

// The attacker pays what gold they have, up to 2, and the battle goes on; or the battle is cancelled.
export function pleaRespond(state: KinState, accept: boolean) {
  const play = state.play!;
  const consent = play.consent!;
  const answer = consent.plea!;
  play.consent = null;
  if (!accept) {
    play.battle = null;
    play.passes = 0;
    announce(state, `${name(state, consent.owner)} declined Qumono's Merciful Plea: the battle is cancelled.`);
    return endTurn(state);
  }
  const paid = Math.min(PLEA_COST, amount(state, consent.owner, "gold"));
  state.players[consent.owner].resources.gold = amount(state, consent.owner, "gold") - paid;
  state.players[consent.player].resources.gold = amount(state, consent.player, "gold") + paid;
  // The battle goes on: the answer taps Qumono again as the defending general.
  state.cards.qumono.tapped = false;
  battleRespond(state, consent.player, answer);
}

// --- Sunumo, Tsunami ---

// Buildings of other players next to an ocean and within 3 tiles of an army of yours.
export function tsunamiTargets(state: KinState, player: string): string[] {
  const armies = state.armies.filter(army => army.owner === player && army.tile >= 0);
  return state.buildings
    .filter(building => building.owner && building.owner !== player && building.tile >= 0 && (building.kind === "tile" || building.kind === "center" || building.kind === "slice"))
    .filter(building => neighbors(building.tile).some(next => state.tiles[next]?.terrain === "ocean")
      && armies.some(army => tileDistance(army.tile, building.tile) <= 3))
    .map(building => building.id);
}

export function tsunami(state: KinState, player: string, buildingId: string) {
  const building = state.buildings.find(candidate => candidate.id === buildingId)!;
  state.players[player].resources.mana = amount(state, player, "mana") - TSUNAMI_COST;
  breakOnAttack(state, player, building.owner!);
  destroy(state, building);
  announce(state, `${name(state, player)}'s Sunumo sent a tsunami over a ${building.def} of ${name(state, building.owner!)}.`);
}
