import assert from "node:assert/strict";
import { test } from "node:test";
import { ruinsSpots } from "./archeology";
import { kinBotMove } from "./bots";
import { addItem, dealBoardCards } from "./cards";
import { characterPicker, characterRound, eligibleCharacters, naturalOrder } from "./draft";
import { createState, deserialize, dispatch, serialize } from "./engine";
import { eventOptions } from "./events";
import { cleanupExploration, explorationPlacer } from "./exploration";
import { kin } from "./index";
import { hasActionCard } from "./play";
import { relicTapError } from "./relics";
import { setupChoices } from "./setup";
import { explorationWinner } from "./victory";
import { createWorld, TILE_COUNT } from "./world";
import type { Action, KinState } from "./types";

const act = (type: string, player = "p1", extra: Record<string, unknown> = {}): Action =>
  ({ type, actor: { id: player, username: player, isHost: player === "p1" }, ...extra });
const send = (state: KinState, type: string, player = "p1", extra: Record<string, unknown> = {}) =>
  assert.equal(dispatch(state, act(type, player, extra)), null);

function beforeExploration(): KinState {
  const state = createState(42);
  state.phase = "playing";
  state.options.mode = "long";
  state.order = ["p3", "p1", "p2"];
  state.seats = [...state.order];
  for (const id of state.order) state.players[id] = { id, username: id, connected: true, resources: { relic: 2, gold: 10 } };
  state.world = createWorld();
  state.world.step = "done";
  state.world.kinPicks = { p1: "ethereal", p2: "hanshu", p3: "wanderers" };
  state.tiles = Array.from({ length: TILE_COUNT }, () => ({ col: 0, row: 0, terrain: "plains", tapped: false }));
  state.round = 2;
  state.play = { phase: "control", turn: "p1", passes: 0, move: null, barter: null, verdicts: [] };
  state.chapter = {
    current: "new-dawn", leader: null,
    history: [{ chapter: "new-dawn", winner: "p2", round: 2 }], points: { p2: 1 },
    pending: { player: "p2", choices: ["commonwealth", "kingdom", "exploration"] }
  };
  dealBoardCards(state);
  return state;
}

function begin(state = beforeExploration()): KinState {
  send(state, "chooseChapter", "p2", { chapter: "exploration" });
  return state;
}

function finishPlacement(state: KinState) {
  for (let guard = 0; state.exploration?.placing && guard < 10; guard++) {
    send(state, "placeExplorationRuins", explorationPlacer(state)!, { tile: ruinsSpots(state)[0] });
  }
  assert.equal(state.exploration?.placing, false);
}

function game(): KinState {
  const state = begin();
  finishPlacement(state);
  state.blocks = [];
  return state;
}

function endControl(state: KinState) {
  state.play!.phase = "control";
  state.play!.turn = naturalOrder(state)[0];
  state.play!.passes = 0;
  for (const id of naturalOrder(state)) send(state, "pass", id);
}

test("Exploration places nine additional ruins in natural Kin order, not seat order or leader order", () => {
  const state = beforeExploration();
  state.blocks = [{ tile: 30, kind: "ruins" }];
  begin(state);
  assert.equal(state.chapter!.current, "exploration");
  assert.equal(state.chapter!.leader, "p2");
  assert.equal(state.round, 3);
  assert.deepEqual(state.exploration, { target: 9, placed: 0, placing: true });
  assert.equal(state.play!.turn, "p1");
  for (let index = 0; index < 9; index++) {
    const player = ["p1", "p2", "p3"][index % 3];
    assert.equal(explorationPlacer(state), player);
    assert.equal(state.play!.turn, player);
    send(state, "placeExplorationRuins", player, { tile: index });
  }
  assert.equal(state.blocks!.filter(block => block.kind === "ruins").length, 10);
  assert.equal(state.blocks!.some(block => block.tile === 30), true);
  assert.equal(explorationPlacer(state), null);
  assert.equal(state.play!.phase, "event");
  assert.equal(state.play!.turn, "p1");
});

test("Archeology Science and all its cards become public from an unresearched, private, or already public state", () => {
  for (const zone of ["board:research", "court:p3", "board:public"]) {
    const state = beforeExploration();
    const science = state.items.find(item => item.def === "archeology-science")!;
    science.zone = zone;
    science.owner = zone === "court:p3" ? "p3" : null;
    if (zone !== "board:research") {
      addItem(state, "explore", zone === "court:p3" ? zone : "board:phase", science.owner);
      addItem(state, "reclaim", zone === "court:p3" ? zone : "board:phase", science.owner);
      addItem(state, "archeology", "board:phase");
    }
    begin(state);
    assert.equal(science.zone, "board:public");
    assert.equal(science.owner, null);
    for (const def of ["archeology", "explore", "reclaim"]) {
      assert.equal(state.items.filter(item => item.def === def).length, 1);
      assert.equal(state.items.find(item => item.def === def)!.zone, "board:phase");
    }
    for (const player of state.order) {
      assert.equal(hasActionCard(state, player, "explore"), true);
      assert.equal(hasActionCard(state, player, "reclaim"), true);
    }
    assert.deepEqual(state.players.p3.resources, { relic: 2, gold: 10 });
  }
});

test("ruins placement rejects oceans, buildings, armies, existing ruins, invalid tiles and other players without mutation", () => {
  const state = beforeExploration();
  state.tiles[0].terrain = "ocean";
  state.buildings = [{ id: "b1", def: "village", kind: "tile", owner: "p1", tile: 1 }];
  state.armies = [{ id: "a1", owner: "p2", tile: 2, strength: 1 }];
  state.blocks = [{ tile: 3, kind: "ruins" }];
  begin(state);
  const before = serialize(state);
  for (const tile of [0, 1, 2, 3, -1, TILE_COUNT, 1.5, "4", null, NaN]) {
    assert.match(dispatch(state, act("placeExplorationRuins", "p1", { tile })) ?? "", /Choose/);
    assert.equal(serialize(state), before);
  }
  assert.match(dispatch(state, act("placeExplorationRuins", "p2", { tile: 4 })) ?? "", /turn/);
  assert.match(dispatch(state, act("placeExplorationRuins", "spectator", { tile: 4 })) ?? "", /turn/);
  assert.equal(serialize(state), before);
});

test("relic and treasure blocks do not prohibit ruins placement, and existing blocks are preserved", () => {
  const state = beforeExploration();
  state.blocks = [{ tile: 0, kind: "relic" }, { tile: 0, kind: "treasure" }];
  begin(state);
  send(state, "placeExplorationRuins", "p1", { tile: 0 });
  assert.deepEqual(state.blocks!.map(block => block.kind), ["relic", "treasure", "ruins"]);
});

test("placement runs with fewer than nine legal spaces, including zero, without becoming stuck", () => {
  for (const spaces of [0, 1, 4]) {
    const state = beforeExploration();
    for (let index = spaces; index < state.tiles.length; index++) state.tiles[index].terrain = "ocean";
    begin(state);
    assert.equal(state.exploration!.target, spaces);
    finishPlacement(state);
    assert.equal(state.exploration!.placed, spaces);
    assert.equal(state.blocks?.length ?? 0, spaces);
    assert.equal(state.result, undefined);
    assert.equal(state.chapter!.pending, null);
    assert.equal(state.play!.phase, "discovery");
    assert.match(dispatch(state, act("placeExplorationRuins", "p1", { tile: 0 })) ?? "", /No Exploration/);
  }
});

test("ordinary actions, relic taps and force passes are blocked until every setup ruin has been placed", () => {
  const state = begin();
  const before = serialize(state);
  for (const type of ["pass", "forcePass", "activateEvent", "tapRelics", "research", "chooseChapter", "selectionStep", "giveResource"]) {
    assert.match(dispatch(state, act(type)) ?? "", /placing/);
    assert.equal(serialize(state), before);
  }
  assert.match(relicTapError(state, "p1") ?? "", /chapter decision/);
  assert.equal(explorationWinner(state), null);
});

test("Seasons Change waits for placement, then runs exactly once without incrementing the round again", () => {
  const state = beforeExploration();
  const activation = addItem(state, "activation-control", "court:p1", "p1");
  activation.tapped = true;
  state.players.p1.relicsTapped = 2;
  state.armies = [{ id: "a1", owner: "p1", tile: 40, strength: 1, status: "exhausted" }];
  begin(state);
  assert.equal(activation.tapped, true);
  assert.equal(state.players.p1.relicsTapped, 2);
  assert.equal(state.armies[0].status, "exhausted");
  finishPlacement(state);
  assert.equal(activation.tapped, false);
  assert.equal(state.players.p1.relicsTapped, 0);
  assert.equal(state.armies[0].status, undefined);
  assert.equal(state.items.find(item => item.def === "seasons-change")!.tapped, true);
  assert.equal(state.round, 3);
});

test("snapshots expose placement progress and legal tiles to players and spectators while suppressing normal actions", () => {
  const state = begin();
  send(state, "placeExplorationRuins", "p1", { tile: 0 });
  for (const viewer of ["p1", "p2", "spectator"]) {
    const snapshot = kin.snapshot(state, viewer, new Set(state.order)) as {
      world: { turn: string; exploration: { placed: number; target: number; player: string | null; tiles: number[]; ruins: number };
        play: { options: unknown; events: unknown[]; abilities: unknown[]; tacticOptions: unknown[]; autoEventPass: boolean } };
    };
    assert.equal(snapshot.world.turn, "p2");
    assert.equal(snapshot.world.exploration.player, "p2");
    assert.equal(snapshot.world.exploration.placed, 1);
    assert.equal(snapshot.world.exploration.target, 9);
    assert.equal(snapshot.world.exploration.ruins, 1);
    assert.equal(snapshot.world.exploration.tiles.includes(0), false);
    assert.equal(snapshot.world.exploration.tiles.includes(1), true);
    assert.equal(snapshot.world.play.options, null);
    assert.deepEqual(snapshot.world.play.events, []);
    assert.deepEqual(snapshot.world.play.abilities, []);
    assert.deepEqual(snapshot.world.play.tacticOptions, []);
    assert.equal(snapshot.world.play.autoEventPass, false);
  }
  finishPlacement(state);
  const snapshot = kin.snapshot(state, "p1", new Set(state.order)) as {
    world: { exploration: { player: string | null; tiles: number[] } };
  };
  assert.equal(snapshot.world.exploration.player, null);
  assert.deepEqual(snapshot.world.exploration.tiles, []);
});

test("placement persists across serialization and autopilot completes it even with gameplay force-passing disabled", () => {
  const state = begin();
  send(state, "placeExplorationRuins", "p1", { tile: 0 });
  const restored = deserialize(serialize(state));
  assert.deepEqual(restored.exploration, state.exploration);
  assert.equal(kinBotMove(restored, "p1", { forcePass: false }), null);
  for (let guard = 0; restored.exploration!.placing && guard < 9; guard++) {
    const player = explorationPlacer(restored)!;
    const move = kinBotMove(restored, player, { forcePass: false })!;
    assert.equal(move.type, "placeExplorationRuins");
    const before = deserialize(serialize(restored));
    send(restored, String(move.type), player, move);
    send(before, String(move.type), player, move);
    assert.equal(serialize(restored), serialize(before));
  }
  assert.equal(restored.exploration!.placed, 9);
  assert.equal(restored.exploration!.placing, false);
});

test("all court relics count, including pre-existing and tapped relics, but not world relic blocks", () => {
  const state = game();
  state.players.p1.resources.relic = 5;
  state.players.p1.relicsTapped = 5;
  state.players.p2.resources.relic = 4;
  state.players.p3.resources.relic = 3;
  state.blocks = [{ tile: 20, kind: "relic" }];
  assert.equal(explorationWinner(state), "p1");
  state.blocks.push({ tile: 40, kind: "ruins" });
  assert.equal(explorationWinner(state), null);
});

test("normal vassal chains aggregate relics and vassals cannot win independently", () => {
  const state = game();
  state.players.p1.resources.relic = 1;
  state.players.p2.resources.relic = 4;
  state.players.p3.resources.relic = 5;
  addItem(state, "vassal-treaty", "court:p1", "p1", "p2");
  addItem(state, "vassal-treaty", "court:p2", "p2", "p3");
  assert.equal(explorationWinner(state), "p1");
  addItem(state, "vassal-treaty", "court:p3", "p3", "p1");
  assert.equal(explorationWinner(state), null);
});

test("a tie awards the chapter leader even if behind, or their ultimate lord when a vassal", () => {
  const state = game();
  state.players.p1.resources.relic = 5;
  state.players.p3.resources.relic = 5;
  state.players.p2.resources.relic = 0;
  assert.equal(explorationWinner(state), "p2");
  addItem(state, "vassal-treaty", "court:p1", "p1", "p2");
  assert.equal(explorationWinner(state), "p1");
  addItem(state, "vassal-treaty", "court:p2", "p2", "p1");
  state.players.p3.resources.relic = 0;
  assert.equal(explorationWinner(state), "p3");
});

test("a zero-relic tie still chooses the chapter leader, including an indirect lord or no winner for a cycle", () => {
  const state = game();
  for (const player of Object.values(state.players)) player.resources = {};
  assert.equal(explorationWinner(state), "p2");
  addItem(state, "vassal-treaty", "court:p3", "p3", "p2");
  addItem(state, "vassal-treaty", "court:p1", "p1", "p3");
  assert.equal(explorationWinner(state), "p1");
  addItem(state, "vassal-treaty", "court:p2", "p2", "p1");
  assert.equal(explorationWinner(state), null);
});

test("a leader trapped in a vassal cycle cannot win the tie between other eligible players", () => {
  const state = game();
  state.players.p4 = { id: "p4", username: "p4", connected: true, resources: { relic: 2 } };
  state.order.push("p4");
  addItem(state, "vassal-treaty", "court:p1", "p1", "p2");
  addItem(state, "vassal-treaty", "court:p2", "p2", "p1");
  assert.equal(explorationWinner(state), null);
});

test("Exploring the last ruin does not win immediately and its uncollected relic does not affect the end-of-Control winner", () => {
  const state = game();
  state.chapter!.leader = "p1";
  state.players.p1.resources.relic = 1;
  state.players.p2.resources.relic = 3;
  state.players.p3.resources.relic = 2;
  state.blocks = [{ tile: 20, kind: "ruins" }];
  state.armies = [{ id: "a1", owner: "p1", tile: 20, strength: 1 }];
  addItem(state, "quantum-collapse", "board:public");
  const source = addItem(state, "activation-control", "court:p1", "p1");
  state.play!.phase = "control";
  state.play!.turn = "p1";
  send(state, "explore", "p1", { army: "a1", kind: "item", card: source.id, choice: "relic" });
  assert.deepEqual(state.blocks, [{ tile: 20, kind: "relic" }]);
  assert.equal(state.players.p1.resources.relic, 1);
  assert.equal(source.tapped, true);
  assert.equal(state.chapter!.pending, null);
  assert.equal(state.result, undefined);
  for (const player of ["p2", "p3", "p1"]) send(state, "pass", player);
  assert.equal(state.result!.winner, "p2");
  assert.equal(state.result!.chapter, "exploration");
});

test("Archeology continues adding ruins and all of them block victory", () => {
  const state = game();
  state.players.p1.resources.relic = 9;
  assert.equal(eventOptions(state, "p1").includes("archeology"), true);
  send(state, "activateEvent", "p1", { def: "archeology" });
  assert.equal(state.blocks!.filter(block => block.kind === "ruins").length, 1);
  assert.equal(explorationWinner(state), null);
  endControl(state);
  assert.equal(state.result, undefined);
  assert.equal(state.chapter!.pending, null);
  assert.equal(state.round, 4);
});

test("cleanup removes every court relic and tapped count but leaves world blocks, other resources and public science", () => {
  const state = game();
  state.blocks = [{ tile: 20, kind: "relic" }, { tile: 21, kind: "treasure" }, { tile: 22, kind: "ruins" }];
  state.players.p1.relicsTapped = 2;
  const blocks = structuredClone(state.blocks);
  cleanupExploration(state);
  for (const player of Object.values(state.players)) {
    assert.equal(player.resources.relic, 0);
    assert.equal(player.relicsTapped, 0);
    assert.equal(player.resources.gold, 10);
  }
  assert.equal(state.exploration, undefined);
  assert.deepEqual(state.blocks, blocks);
  assert.equal(state.items.find(item => item.def === "archeology-science")!.zone, "board:public");
  for (const player of state.order) assert.equal(hasActionCard(state, player, "explore"), true);
  state.players.p1.resources.relic = 1;
  cleanupExploration(state);
  assert.equal(state.players.p1.resources.relic, 1);
});

test("chapter transitions clean Exploration before starting the next chapter, preserving uncollected blocks", () => {
  const state = game();
  state.players.p2.resources.relic = 5;
  state.blocks = [{ tile: 20, kind: "relic" }];
  state.chapter!.history = [{ chapter: "new-dawn", winner: "p1", round: 2 }];
  state.chapter!.points = { p1: 1 };
  endControl(state);
  assert.deepEqual(state.chapter!.pending, { player: "p2", choices: ["commonwealth", "kingdom"] });
  send(state, "chooseChapter", "p2", { chapter: "kingdom" });
  assert.equal(state.exploration, undefined);
  assert.equal(state.kingdom!.king, "p2");
  assert.deepEqual(state.blocks, [{ tile: 20, kind: "relic" }]);
  for (const player of Object.values(state.players)) assert.equal(player.resources.relic, 0);
});

test("Exploration setup waits for a collapsed leader's redraft and counts the collapse ruins in addition to nine new ones", () => {
  const state = beforeExploration();
  state.chapter!.collapse = "p1";
  state.buildings = [{ id: "b1", def: "village", kind: "tile", owner: "p1", tile: 30 }];
  begin(state);
  assert.equal(state.phase, "draft");
  assert.equal(state.exploration, undefined);
  assert.deepEqual(state.blocks, [{ tile: 30, kind: "ruins" }]);
  send(state, "pickKin", "p1", { kin: "lumon" });
  for (let guard = 0; state.world!.step === "setup" && guard < 50; guard++) {
    const choices = setupChoices(state)!;
    send(state, "setupPlace", "p1", choices.tile !== null ? { side: choices.sides[0] } : { tile: choices.tiles[0] });
  }
  for (let guard = 0; state.world!.step === "characters" && guard < 10; guard++) {
    assert.equal(characterPicker(state), "p1");
    send(state, "pickCharacter", "p1", { character: eligibleCharacters(state, "p1", characterRound(state))[0].id });
  }
  assert.equal(state.phase, "playing");
  assert.equal(state.exploration!.placing, true);
  assert.equal(explorationPlacer(state), "p2");
  finishPlacement(state);
  assert.equal(state.blocks!.filter(block => block.kind === "ruins").length, 10);
  assert.equal(state.blocks!.some(block => block.tile === 30 && block.kind === "ruins"), true);
  assert.equal(state.round, 3);
});

test("aborting during placement removes Exploration state and a later chapter cannot place its ruins", () => {
  const state = begin();
  send(state, "abort");
  assert.equal(state.phase, "lobby");
  assert.equal(state.exploration, undefined);
  assert.match(dispatch(state, act("placeExplorationRuins", "p1", { tile: 0 })) ?? "", /No Exploration/);
});
