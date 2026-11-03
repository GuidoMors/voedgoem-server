import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, deserialize, dispatch, replay, serialize } from "./engine";
import { kin } from "./index";
import { createRng, nextInt, shuffle } from "./rng";
import type { Action, KinState } from "./types";

const actor = (id: string, isHost = false) => ({ id, username: id.toUpperCase(), isHost });
const act = (type: string, id: string, isHost = false, extra: Record<string, unknown> = {}): Action => ({ type, actor: actor(id, isHost), ...extra });

function lobbyWith(count: number): KinState {
  const state = createState(123);
  for (let index = 1; index <= count; index++) assert.equal(dispatch(state, act("join", `p${index}`, index === 1)), null);
  return state;
}

test("rng is deterministic per seed and serializable", () => {
  const a = createRng(42);
  const b = createRng(42);
  assert.deepEqual([nextInt(a, 1000), nextInt(a, 1000), nextInt(a, 1000)], [nextInt(b, 1000), nextInt(b, 1000), nextInt(b, 1000)]);
  const resumed = JSON.parse(JSON.stringify(a));
  assert.equal(nextInt(resumed, 1000000), nextInt(a, 1000000));
  assert.deepEqual(shuffle(createRng(7), [1, 2, 3, 4, 5]), shuffle(createRng(7), [1, 2, 3, 4, 5]));
});

test("up to 10 players can join, the 11th cannot", () => {
  const state = lobbyWith(10);
  assert.equal(state.seats.length, 10);
  assert.match(dispatch(state, act("join", "p11")) ?? "", /taken/);
  assert.equal(kin.info.maxPlayers, 10);
  assert.equal(kin.info.maxUsers, 20);
});

test("joining twice and leaving are validated", () => {
  const state = lobbyWith(2);
  assert.match(dispatch(state, act("join", "p2")) ?? "", /already/);
  assert.equal(dispatch(state, act("leave", "p2")), null);
  assert.match(dispatch(state, act("leave", "p2")) ?? "", /not playing/);
  assert.deepEqual(state.seats, ["p1"]);
});

test("only the host can kick, set options and start", () => {
  const state = lobbyWith(3);
  assert.match(dispatch(state, act("kick", "p2", false, { userId: "p3" })) ?? "", /host/);
  assert.match(dispatch(state, act("setOptions", "p2", false, { mode: "long" })) ?? "", /host/);
  assert.match(dispatch(state, act("start", "p2")) ?? "", /host/);
  assert.equal(dispatch(state, act("kick", "p1", true, { userId: "p3" })), null);
  assert.deepEqual(state.seats, ["p1", "p2"]);
});

test("options accept the three modes and the testing flag only", () => {
  const state = lobbyWith(2);
  for (const mode of ["short", "long", "campaign"]) assert.equal(dispatch(state, act("setOptions", "p1", true, { mode })), null);
  assert.equal(state.options.mode, "campaign");
  assert.match(dispatch(state, act("setOptions", "p1", true, { mode: "epic" })) ?? "", /mode/);
  assert.equal(dispatch(state, act("setOptions", "p1", true, { testing: true })), null);
  assert.equal(state.options.testing, true);
  assert.match(dispatch(state, act("setOptions", "p1", true, { testing: "yes" })) ?? "", /Testing/);
});

test("start needs at least one player and puts the host first", () => {
  const none = lobbyWith(0);
  assert.match(dispatch(none, act("start", "p1", true)) ?? "", /At least 1/);
  const solo = lobbyWith(1);
  assert.equal(dispatch(solo, act("start", "p1", true)), null);
  assert.deepEqual(solo.order, ["p1"]);
  const state = createState(1);
  dispatch(state, act("join", "p2"));
  dispatch(state, act("join", "p1", true));
  dispatch(state, act("join", "p3"));
  assert.equal(dispatch(state, act("start", "p1", true)), null);
  assert.equal(state.phase, "draft");
  assert.deepEqual(state.order, ["p1", "p2", "p3"]);
  assert.match(dispatch(state, act("join", "p4")) ?? "", /started/);
});

test("abort returns to the lobby and stays replayable", () => {
  const state = lobbyWith(2);
  dispatch(state, act("start", "p1", true));
  assert.equal(dispatch(state, act("abort", "p1", true)), null);
  assert.equal(state.phase, "lobby");
  assert.deepEqual(state.order, []);
  assert.equal(state.seats.length, 2);
});

test("event log replays to the same state and survives JSON save/load", () => {
  const state = lobbyWith(4);
  dispatch(state, act("setOptions", "p1", true, { mode: "campaign", testing: true }));
  dispatch(state, act("leave", "p3"));
  dispatch(state, act("start", "p1", true));
  dispatch(state, act("abort", "p1", true));
  assert.equal(state.log.length, 8);
  const rebuilt = replay(123, state.log.map(entry => entry.action));
  assert.equal(serialize(rebuilt), serialize(state));
  const loaded = deserialize(serialize(state));
  assert.deepEqual(loaded, state);
  assert.throws(() => deserialize(JSON.stringify({ version: 99 })), /version/);
});

test("rejected actions do not change state or the log", () => {
  const state = lobbyWith(2);
  const before = serialize(state);
  dispatch(state, act("start", "p2"));
  dispatch(state, act("nonsense", "p1", true));
  assert.equal(serialize(state), before);
});

test("module: disconnecting leaves the lobby, but marks players offline once started", () => {
  const state = kin.create();
  const host = { userId: "p1", username: "P1", isHost: true, isAdmin: false };
  const other = { userId: "p2", username: "P2", isHost: false, isAdmin: false };
  assert.equal(kin.handle(state, host, { type: "join" }, { connected: new Map() }), "save");
  assert.equal(kin.handle(state, other, { type: "join" }, { connected: new Map() }), "save");
  assert.deepEqual(kin.handle(state, other, { type: "start" }, { connected: new Map() }), { error: "Only the host can do that." });
  assert.equal(kin.disconnect(state, "p2"), true);
  assert.deepEqual([...kin.participants(state)], ["p1"]);
  kin.handle(state, other, { type: "join" }, { connected: new Map() });
  kin.handle(state, host, { type: "start" }, { connected: new Map() });
  assert.equal(kin.disconnect(state, "p2"), true);
  assert.equal(state.players.p2.connected, false);
  assert.equal(kin.connect?.(state, "p2"), true);
  const snapshot = kin.snapshot(state, "p1", new Set(["p1"]));
  assert.equal(snapshot.phase, "draft");
  assert.equal(snapshot.seed, null);
});
