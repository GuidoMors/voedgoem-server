import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { arkOf, buildPower, garrison, placeBuilding, placementError, placements, production } from "./buildings";
import { canRecruitOn } from "./control";
import { defenderBase } from "./battle";
import { demolishOptions, demolishPower, deployOptions } from "./expansion";
import { eventOptions } from "./events";
import { massHarvestYield } from "./ark";
import { createRng, nextInt } from "./rng";
import { addArmy, addBuilding, setupChoices } from "./setup";
import { neighbors, tileIndex } from "./world";
import type { Action, KinState } from "./types";

const act = (type: string, id: string, extra: Record<string, unknown> = {}): Action => ({ type, actor: { id, username: id, isHost: id === "p1" }, ...extra });

function playing(): KinState {
  const state = createState(1);
  dispatch(state, act("join", "p1"));
  dispatch(state, act("start", "p1"));
  const rng = createRng(1);
  const types = ["mountain", "forest", "farmland"] as const;
  while (state.world!.step === "tiles") {
    const free = state.tiles.flatMap((tile, index) => tile.terrain === "ocean" ? [index] : []);
    let terrain: string = types[nextInt(rng, 3)];
    while (state.world!.pile[terrain as "mountain"] === 0) terrain = types[nextInt(rng, 3)];
    dispatch(state, act("placeTile", tilePlacer(state, state.world!), { tile: free[nextInt(rng, free.length)], terrain }));
  }
  state.world!.step = "kin";
  dispatch(state, act("pickKin", "p1", { kin: "ark" }));
  for (let guard = 0; state.world!.step === "setup" && guard < 50; guard++) {
    const choices = setupChoices(state)!;
    dispatch(state, act("setupPlace", "p1", choices.tile !== null ? { side: choices.sides[0] } : { tile: choices.tiles[choices.tiles.length - 1] }));
  }
  while (state.world!.step === "characters") {
    const pick = eligibleCharacters(state, characterPicker(state)!, characterRound(state))[0];
    dispatch(state, act("pickCharacter", "p1", { character: pick.id }));
  }
  state.order.push("p2");
  state.players.p2 = { id: "p2", username: "p2", connected: true, resources: {} };
  for (const card of Object.values(state.cards)) { card.owner = undefined; card.tapped = false; }
  state.play!.turn = "p1";
  state.play!.passes = 0;
  return state;
}

const own = (state: KinState, id: string, player = "p1") => {
  state.cards[id] ??= { id, def: id, owner: player, zone: `court:${player}`, tapped: false } as never;
  state.cards[id].owner = player;
  state.cards[id].zone = `court:${player}`;
};

const A = tileIndex(6, 10);
const oxyliumNeighbor = (_state: KinState) => neighbors(A)[0];

// p1 is the Archive Ark with its Ark on a plains tile and its worksite on the ark board; everything else is cleared.
function arkGame() {
  const state = playing();
  state.buildings = [];
  state.armies = [];
  state.items = state.items.filter(item => item.zone.startsWith("board:"));
  state.players.p1.resources.gear = 0;
  for (const [index, item] of state.items.entries()) item.id = `fixture-${index}`;
  state.world!.rivers = {};
  for (const tile of state.tiles) tile.terrain = "plains";
  for (const def of ["the-eternal-ark", "technomancers", "drifting-citadel"]) addItem(state, def, "court:p1", "p1");
  const ark = addBuilding(state, { def: "the-ark", owner: "p1", kind: "center", tile: A });
  addBuilding(state, { def: "worksite", owner: "p1", kind: "slice", tile: -1, side: 0 });
  return { state, ark };
}

test("the Ark cannot be built, but armies are deployed and recruited on it", () => {
  const { state, ark } = arkGame();
  addItem(state, "the-ark", "court:p1", "p1");
  assert.match(placementError(state, "p1", "the-ark", { tile: tileIndex(6, 14) }) ?? "", /rules of its Kin/);
  assert.deepEqual(deployOptions(state, "p1"), [ark.id]);
  const card = addItem(state, "activation-expansion", "court:p1", "p1");
  state.play!.phase = "expansion";
  assert.equal(dispatch(state, act("deploy", "p1", { kind: "item", card: card.id, building: ark.id })), null);
  const army = state.armies[0];
  assert.equal(army.tile, A);
  assert.equal(canRecruitOn(state, army), true);
});

test("the ark board has 6 edges per tile for slice buildings, whatever their building conditions", () => {
  const { state } = arkGame();
  addItem(state, "university", "court:p1", "p1");
  assert.equal(placementError(state, "p1", "university", { tile: -1, side: 1 }), null);
  assert.match(placementError(state, "p1", "university", { tile: -1, side: 0 }) ?? "", /already built/);
  for (const side of [-1, 12, 1.5]) assert.match(placementError(state, "p1", "university", { tile: -1, side }) ?? "", /2 tiles/);
  assert.deepEqual(placements(state, "p1", "university").filter(place => place.tile === -1),
    Array.from({ length: 11 }, (_, index) => ({ tile: -1, side: index + 1 })));
  for (let side = 1; side < 12; side++) {
    assert.equal(placementError(state, "p1", "university", { tile: -1, side }), null);
    placeBuilding(state, "p1", "university", { tile: -1, side });
  }
  assert.equal(placements(state, "p1", "university").filter(place => place.tile === -1).length, 0);
  assert.equal(state.buildings.filter(building => building.tile === -1).length, 12);
  state.items = state.items.filter(item => item.def !== "the-eternal-ark");
  assert.match(placementError(state, "p1", "university", { tile: -1, side: 1 }) ?? "", /no ark board/);
});

test("Ark Smith discounts stay on their own tile", () => {
  const { state } = arkGame();
  addBuilding(state, { def: "smith", owner: "p1", kind: "slice", tile: -1, side: 2 });
  assert.equal(buildPower(state, "university", { tile: -1, side: 4 }), 2);
  assert.equal(buildPower(state, "university", { tile: -1, side: 1 }), 3);
  const first = placeBuilding(state, "p1", "university", { tile: -1, side: 4 });
  const second = placeBuilding(state, "p1", "university", { tile: -1, side: 1 });
  assert.equal(demolishPower(state, second) - demolishPower(state, first), 1);
});

test("worksites on the ark board do not produce, other slice buildings do", () => {
  const { state } = arkGame();
  assert.deepEqual(production(state, "p1"), {});
  addBuilding(state, { def: "university", owner: "p1", kind: "slice", tile: -1, side: 1 });
  assert.deepEqual(production(state, "p1"), { gear: 1 });
});

test("Demolish can remove an individual Ark-board slice building", () => {
  const { state, ark } = arkGame();
  const worksite = state.buildings.find(building => building.tile === -1)!;
  addArmy(state, "p1", A);
  const cards = [1, 2, 3].map(() => addItem(state, "activation-expansion", "court:p1", "p1"));
  state.play!.phase = "expansion";
  assert.ok(demolishOptions(state, "p1").some(option => option.building === worksite.id));
  const extra = cards.slice(1).map(card => ({ kind: "item", id: card.id }));
  assert.equal(dispatch(state, act("demolish", "p1", { kind: "item", card: cards[0].id, building: worksite.id, extra })), null);
  assert.equal(state.buildings.some(building => building.id === worksite.id), false);
  assert.equal(arkOf(state, "p1")?.id, ark.id);
});

test("destroying the Ark destroys the ark board", () => {
  const { state, ark } = arkGame();
  addArmy(state, "p1", A);
  const cards = [1, 2, 3].map(() => addItem(state, "activation-expansion", "court:p1", "p1"));
  state.play!.phase = "expansion";
  const extra = cards.slice(1).map(card => ({ kind: "item", id: card.id }));
  assert.equal(dispatch(state, act("demolish", "p1", { kind: "item", card: cards[0].id, building: ark.id, extra })), null);
  assert.equal(state.buildings.length, 0);
  assert.equal(arkOf(state, "p1"), undefined);
});

test("Xcav-2M gives the Ark a garrison of 10 on a mountain", () => {
  const { state, ark } = arkGame();
  own(state, "xcav-2m");
  assert.equal(garrison(state, ark), 5);
  state.tiles[A].terrain = "mountain";
  assert.equal(garrison(state, ark), 10);
  state.cards["xcav-2m"].owner = "p2";
  assert.equal(garrison(state, ark), 5);
});

test("Mass Harvest gives a resource for each worksite on the ark board", () => {
  const { state } = arkGame();
  addBuilding(state, { def: "worksite", owner: "p1", kind: "slice", tile: -1, side: 1 });
  state.play!.phase = "event";
  assert.equal(massHarvestYield(state, "p1"), null);
  assert.deepEqual(eventOptions(state, "p1"), []);
  own(state, "agri-1f");
  assert.deepEqual(massHarvestYield(state, "p1"), { resource: "food", count: 2 });
  state.tiles[A].terrain = "forest";
  assert.deepEqual(eventOptions(state, "p1"), ["mass-harvest"]);
  assert.deepEqual(eventOptions(state, "p2"), []);
  assert.equal(dispatch(state, act("activateEvent", "p1", { def: "mass-harvest" })), null);
  assert.equal(state.players.p1.resources.lumber, 2);
  assert.equal(state.items.find(item => item.def === "mass-harvest")!.tapped, true);
});

test("Drifting Citadel moves the Ark to an adjacent unbuilt tile of any type", () => {
  const { state, ark } = arkGame();
  const [built, free] = neighbors(A);
  addBuilding(state, { def: "village", owner: "p2", kind: "tile", tile: built });
  state.tiles[free].terrain = "ocean";
  const card = addItem(state, "activation-discovery", "court:p1", "p1");
  state.play!.phase = "discovery";
  const action = { kind: "item", card: card.id };
  assert.match(String(dispatch(state, act("driftingCitadel", "p1", { ...action, tile: built }))), /unbuilt/);
  assert.equal(dispatch(state, act("driftingCitadel", "p1", { ...action, tile: free })), null);
  assert.equal(ark.tile, free);
});

test("Technomancers gives a gear when another player publicizes your technology", () => {
  const { state } = arkGame();
  const tech = addItem(state, "wall-construction", "court:p1", "p1");
  const card = addItem(state, "activation-discovery", "court:p2", "p2");
  state.players.p2.resources.gear = 3;
  state.play!.phase = "discovery";
  state.play!.turn = "p2";
  assert.equal(dispatch(state, act("publicize", "p2", { kind: "item", card: card.id, tech: tech.id })), null);
  assert.equal(state.players.p1.resources.gear, 1);
  assert.equal(tech.zone, "board:public");
});

test("Calculators gives gears for each technology when the prediction comes true, once per round", () => {
  const { state } = arkGame();
  addItem(state, "market-construction", "court:p1", "p1");
  addItem(state, "wall-construction", "court:p1", "p1");
  own(state, "dinker", "p2");
  addArmy(state, "p2", tileIndex(2, 2));
  state.play!.phase = "event";
  assert.match(String(dispatch(state, act("activateEvent", "p1", { def: "calculators", target: "p1", action: "move", character: "dinker" }))), /another player/);
  assert.equal(dispatch(state, act("activateEvent", "p1", { def: "calculators", target: "p2", action: "move", character: "dinker" })), null);
  state.play!.phase = "discovery";
  state.play!.turn = "p2";
  assert.equal(dispatch(state, act("activateMove", "p2", { kind: "character", card: "dinker", army: state.armies[0].id })), null);
  assert.equal(state.players.p1.resources.gear, 2);
  assert.equal(state.predictions?.length, 0);
});

test("a wrong Calculators prediction gives nothing", () => {
  const { state } = arkGame();
  addItem(state, "market-construction", "court:p1", "p1");
  own(state, "dinker", "p2");
  addArmy(state, "p2", tileIndex(2, 2));
  state.play!.phase = "event";
  dispatch(state, act("activateEvent", "p1", { def: "calculators", target: "p2", action: "research", character: "dinker" }));
  state.play!.phase = "discovery";
  state.play!.turn = "p2";
  dispatch(state, act("activateMove", "p2", { kind: "character", card: "dinker", army: state.armies[0].id }));
  assert.equal(state.players.p1.resources.gear ?? 0, 0);
  assert.equal(state.predictions?.length, 1);
});

test("Coppygen needs the permission of the owner of a village next to the Ark", () => {
  const { state } = arkGame();
  own(state, "coppygen");
  state.play!.phase = "discovery";
  assert.match(String(dispatch(state, act("ability", "p1", { character: "coppygen", building: "b9" }))), /village or city|next to the Ark/);
  const village = addBuilding(state, { def: "village", owner: "p2", kind: "tile", tile: neighbors(A)[0] });
  assert.equal(dispatch(state, act("ability", "p1", { character: "coppygen", building: village.id })), null);
  assert.equal(state.cards.coppygen.tapped, true);
  assert.equal(state.play!.turn, "p1");
  assert.match(String(dispatch(state, act("pass", "p1"))), /Wait/);
  assert.match(String(dispatch(state, act("consentRespond", "p1", { accept: true }))), /not for you/);
  assert.equal(dispatch(state, act("consentRespond", "p2", { accept: true })), null);
  assert.equal(state.players.p1.resources.gear, 1);
  assert.equal(state.players.p2.resources.gear, 1);
  assert.equal(state.play!.consent, null);
  assert.equal(state.play!.turn, "p2");
});

test("Coppygen gives nothing when the owner declines, but the character stays tapped", () => {
  const { state } = arkGame();
  own(state, "coppygen");
  state.play!.phase = "discovery";
  const village = addBuilding(state, { def: "village", owner: "p2", kind: "tile", tile: neighbors(A)[0] });
  dispatch(state, act("ability", "p1", { character: "coppygen", building: village.id }));
  assert.equal(dispatch(state, act("consentRespond", "p2", { accept: false })), null);
  assert.equal(state.players.p1.resources.gear ?? 0, 0);
  assert.equal(state.cards.coppygen.tapped, true);
});

test("Aurosphoros fires on an army next to the Ark for 2 mana", () => {
  const { state } = arkGame();
  own(state, "aurosphoros");
  state.play!.phase = "control";
  state.players.p1.resources.mana = 2;
  const army = addArmy(state, "p2", neighbors(A)[0]);
  army.strength = 5;
  assert.equal(dispatch(state, act("ability", "p1", { character: "aurosphoros", army: army.id })), null);
  assert.equal(army.strength, 2);
  assert.equal(state.players.p1.resources.mana, 0);
  state.play!.turn = "p1";
  state.cards.aurosphoros.tapped = false;
  state.players.p1.resources.mana = 2;
  assert.equal(dispatch(state, act("ability", "p1", { character: "aurosphoros", army: army.id })), null);
  assert.equal(state.armies.some(candidate => candidate.id === army.id), false);
});

test("Nitrosium removes the garrison of a building next to your army for the round", () => {
  const { state } = arkGame();
  own(state, "nitrosium");
  state.play!.phase = "discovery";
  state.players.p1.resources.mana = 1;
  addArmy(state, "p1", A);
  const tile = neighbors(A)[0];
  const village = addBuilding(state, { def: "village", owner: "p2", kind: "tile", tile });
  addBuilding(state, { def: "barracks", owner: "p2", kind: "slice", tile, side: 0 });
  const before = defenderBase(state, "p2", tile).garrison;
  assert.ok(before > 0);
  assert.equal(dispatch(state, act("ability", "p1", { character: "nitrosium", building: village.id })), null);
  assert.equal(defenderBase(state, "p2", tile).garrison, 0);
  assert.equal(state.players.p1.resources.mana, 0);
});

test("Oxylium lets the Ark Explore a ruins on an adjacent tile and reclaims at once", () => {
  const { state } = arkGame();
  own(state, "oxylium");
  addItem(state, "quantum-collapse", "court:p1", "p1");
  addItem(state, "explore", "court:p1", "p1");
  const card = addItem(state, "activation-control", "court:p1", "p1");
  state.play!.phase = "control";
  state.blocks = [];
  const next = oxyliumNeighbor(state);
  assert.match(String(dispatch(state, act("explore", "p1", { kind: "item", card: card.id, army: "ark", choice: "relic" }))), /next to the Ark/);
  state.blocks.push({ tile: A, kind: "ruins" });
  assert.match(String(dispatch(state, act("explore", "p1", { kind: "item", card: card.id, army: "ark", choice: "relic" }))), /next to the Ark/);
  state.blocks.push({ tile: next, kind: "ruins" });
  assert.equal(dispatch(state, act("explore", "p1", { kind: "item", card: card.id, army: "ark", tile: next, choice: "relic" })), null);
  assert.equal(state.players.p1.resources.relic, 1);
  assert.deepEqual(state.blocks, [{ tile: A, kind: "ruins" }]);
});
