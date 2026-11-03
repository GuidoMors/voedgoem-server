import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { abilityOptions, characterAbilityHolder, characterPower, hasChar, onTradeGiven, inReinforceReach } from "./neutrals";
import { harvestOptions, recruitPayment, reinforceOptions } from "./control";
import { canSmite, defenderGenerals } from "./battle";
import { lapsedTrades } from "./treaties";
import { hammersSeasons } from "./hammers";
import { createRng, nextInt } from "./rng";
import { setupChoices } from "./setup";
import { neighbors } from "./world";
import { moveTargets } from "./play";
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
  dispatch(state, act("pickKin", "p1", { kin: "hammers" }));
  for (let guard = 0; state.world!.step === "setup" && guard < 50; guard++) {
    const choices = setupChoices(state)!;
    dispatch(state, act("setupPlace", "p1", choices.task === "worksite" ? { side: choices.sides[0] } : { tile: choices.tiles[choices.tiles.length - 1] }));
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

const give = (state: KinState, id: string, player = "p1") => { state.cards[id].owner = player; };

test("Torke needs four technologies and gives a gear", () => {
  const state = playing();
  give(state, "torke");
  state.play!.phase = "discovery";
  assert.match(abilityOptions(state, "p1")[0].reason!, /4 technologies/);
  for (const def of ["market-construction", "harbor-construction", "wall-construction", "fort-construction"]) addItem(state, def, "court:p1");
  const before = state.players.p1.resources.gear ?? 0;
  assert.equal(abilityOptions(state, "p1")[0].reason, null);
  assert.equal(dispatch(state, act("ability", "p1", { character: "torke" })), null);
  assert.equal(state.players.p1.resources.gear, before + 1);
  assert.equal(state.cards.torke.tapped, true);
  assert.equal(state.play!.turn, "p2");
});

test("Wimblewhisker pays mana for a basic resource", () => {
  const state = playing();
  give(state, "wimblewhisker");
  state.play!.phase = "discovery";
  state.players.p1.resources.mana = 1;
  state.players.p1.resources.stone = 0;
  assert.notEqual(dispatch(state, act("ability", "p1", { character: "wimblewhisker", resource: "mana" })), null);
  assert.equal(dispatch(state, act("ability", "p1", { character: "wimblewhisker", resource: "stone" })), null);
  assert.equal(state.players.p1.resources.stone, 1);
  assert.equal(state.players.p1.resources.mana, 0);
});

test("Steen gives stone in the expansion phase only", () => {
  const state = playing();
  give(state, "steen");
  state.play!.phase = "discovery";
  assert.notEqual(dispatch(state, act("ability", "p1", { character: "steen" })), null);
  state.play!.phase = "expansion";
  const before = state.players.p1.resources.stone ?? 0;
  assert.equal(dispatch(state, act("ability", "p1", { character: "steen" })), null);
  assert.equal(state.players.p1.resources.stone, before + 1);
});

test("a hostage cannot use its ability", () => {
  const state = playing();
  give(state, "steen");
  state.cards.steen.hostageOf = "p2";
  state.play!.phase = "expansion";
  assert.notEqual(dispatch(state, act("ability", "p1", { character: "steen" })), null);
});

test("Birchawe borrows Fjarjarl's Seafarer and suppresses it for its original owner", () => {
  const state = playing();
  const army = state.armies.find(candidate => candidate.owner === "p1" && candidate.tile >= 0)!;
  const from = army.tile;
  const to = neighbors(from)[0];
  state.tiles[from].terrain = "ocean";
  state.tiles[to].terrain = "ocean";
  state.world!.rivers = {};
  state.buildings = [];
  army.embarked = true;
  state.cards.birchawe ??= { id: "birchawe", def: "birchawe", owner: "p1", zone: "court:p1", tapped: false } as never;
  state.cards.fjarjarl ??= { id: "fjarjarl", def: "fjarjarl", owner: "p2", zone: "court:p2", tapped: false } as never;
  state.cards.birchawe.owner = "p1";
  state.cards.fjarjarl.owner = "p2";
  state.borrowed = { birchawe: "fjarjarl" };
  state.play!.move = { player: "p1", army: army.id, source: { kind: "character", id: "birchawe" }, speed: 1, moved: false };

  assert.equal(hasChar(state, "p1", "fjarjarl"), true);
  assert.equal(hasChar(state, "p2", "fjarjarl"), false);
  assert.equal(characterAbilityHolder(state, "p1", "fjarjarl"), "birchawe");
  assert.equal(moveTargets(state, state.play!.move!).find(step => step.tile === to)?.cost, 2 / 3);
});

test("Ostraria's power follows the Access Treaties in the court", () => {
  const state = playing();
  give(state, "ostraria");
  assert.equal(characterPower(state, "p1", "ostraria", 0), 0);
  addItem(state, "access-treaty", "court:p1");
  addItem(state, "access-treaty", "court:p1");
  hammersSeasons(state);
  assert.equal(characterPower(state, "p1", "ostraria", 0), 2);
});

test("Horus has gold power as attacker, none as defender", () => {
  const state = playing();
  give(state, "horus");
  state.players.p1.resources.gold = 7;
  assert.equal(characterPower(state, "p1", "horus", 0), 5);
  assert.equal(defenderGenerals(state, "p1").find(source => source.id === "horus")?.power, 0);
});

test("Doropolopolos gives a gear for the first trade to each receiver", () => {
  const state = playing();
  give(state, "doropolopolos");
  onTradeGiven(state, "p1", "p2");
  onTradeGiven(state, "p1", "p2");
  assert.equal(state.players.p1.resources.gear, 1);
});

test("Izz'Ether's detailed trigger still lapses disconnected Trade Treaties", () => {
  const state = playing();
  const trade = addItem(state, "trade-treaty", "court:p2");
  trade.giver = "p1";
  trade.owner = "p2";
  assert.equal(lapsedTrades(state).length, 1);
  give(state, "izz-ether");
  assert.equal(lapsedTrades(state).length, 1);
});

test("Forrow lets you harvest plains", () => {
  const state = playing();
  const army = state.armies.find(candidate => candidate.owner === "p1" && candidate.tile >= 0)!;
  const terrain = state.tiles[army.tile].terrain;
  state.tiles[army.tile].terrain = "plains";
  army.status = undefined;
  assert.ok(!harvestOptions(state, "p1").includes(army.id));
  give(state, "forrow");
  assert.ok(harvestOptions(state, "p1").includes(army.id));
  state.tiles[army.tile].terrain = terrain;
});

test("Goros lets you recruit with gold", () => {
  const state = playing();
  state.players.p1.resources.food = 0;
  state.players.p1.resources.gold = 2;
  assert.equal(recruitPayment(state, "p1"), null);
  give(state, "goros");
  assert.equal(recruitPayment(state, "p1"), "gold");
  state.players.p1.resources.food = 2;
  assert.equal(recruitPayment(state, "p1"), "food");
  assert.equal(recruitPayment(state, "p1", true), "gold");
});

test("Bucephalus reinforces from two tiles away", () => {
  const state = playing();
  const from = 0;
  const near = neighbors(from)[0];
  const far = neighbors(near).find(tile => tile !== from && !neighbors(from).includes(tile))!;
  assert.equal(inReinforceReach(state, "p1", from, far, neighbors), false);
  give(state, "bucephalus");
  assert.equal(inReinforceReach(state, "p1", from, far, neighbors), true);
  assert.ok(Array.isArray(reinforceOptions(state, "p1")));
});

test("Barendam can smite with 2 mana", () => {
  const state = playing();
  give(state, "barendam");
  state.players.p1.resources.mana = 1;
  assert.equal(canSmite(state, "p1", "barendam"), false);
  state.players.p1.resources.mana = 2;
  assert.equal(canSmite(state, "p1", "barendam"), true);
  assert.equal(canSmite(state, "p1", "torke"), false);
});

test("Znort has no flee outside a battle", () => {
  const state = playing();
  give(state, "znort");
  assert.notEqual(dispatch(state, act("flee", "p1", { tile: 0 })), null);
});
