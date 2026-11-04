import assert from "node:assert/strict";
import { test } from "node:test";
import { werewolves } from "./index";

const host = { userId: "host", username: "Host", isHost: true, isAdmin: false };
const context = { connected: new Map([["host", "Host"], ["gm", "GM"]]) };

function playing() {
  const state = werewolves.create();
  state.phase = "playing";
  state.day = 3;
  state.gmId = "gm";
  state.gmName = "GM";
  state.townName = "Test town";
  state.events = ["Private game history"];
  state.privateResults = { host: { secret: true } };
  state.settings.moonCards = true;
  return state;
}

test("lynch voting continues until exactly one player remains unsaved", () => {
  for (const count of [2, 4]) {
    for (const mayorId of ["p0", "p1"]) {
      const state = playing();
      state.seats = Object.fromEntries(Array.from({ length: count }, (_, i) => [
        `p${i}`, { id: `p${i}`, username: `Player ${i}`, order: i, alive: true, role: "seer" as const }
      ]));
      state.mayorId = mayorId;
      state.steps = [{ id: "start", kind: "lynch-start", actorMode: "gm", phase: "day", day: 3, prompt: "Vote" }];
      const gm = { ...host, userId: "gm", isHost: false };
      assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
      let votes = 0;
      while (state.lynchRemaining.length > 1) {
        const current = state.steps[0];
        assert.equal(current.kind, "lynch-spare");
        const targetId = state.lynchRemaining.find(id => id !== current.voterId)!;
        const player = { ...host, userId: current.voterId!, isHost: false };
        assert.equal(werewolves.handle(state, player, { type: "select_action", value: { targetId } }, context), "save");
        assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
        votes++;
      }
      assert.equal(votes, count - 1);
      assert.equal(state.steps[0].kind, "lynch-result");
      assert.equal(state.steps[0].targetId, state.lynchRemaining[0]);
      assert.equal(state.steps[0].data?.targetId, state.lynchRemaining[0]);
      assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
      assert.equal(state.lynchTarget, state.lynchRemaining[0]);
    }
  }
});

test("a lynched Fool reveals publicly, receives a separate victory announcement, and play continues", () => {
  for (const strict of [false, true]) {
    const state = playing();
    state.settings.moonCards = false;
    state.currentMoon = strict ? "strict-sentence" : null;
    state.seats = {
      fool: { id: "fool", username: "Jester", order: 0, alive: true, role: "fool" },
      wolf: { id: "wolf", username: "Wolf", order: 1, alive: true, role: "wise-wolf" },
      mayor: { id: "mayor", username: "Mayor", order: 2, alive: true, role: "seer" }
    };
    state.mayorId = "mayor";
    state.steps = [{ id: "lynch", kind: "lynch-result", phase: "day", day: 3, actorMode: "gm", prompt: "Lynch", targetId: "fool" }];
    const gm = { ...host, userId: "gm", isHost: false };
    const confirm = () => assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
    confirm();
    assert.equal(state.steps[0].kind, "fool-reveal");
    assert.equal(state.seats.fool.publiclyRevealed, undefined);
    assert.deepEqual(state.individualWinners, []);
    confirm();
    assert.equal(state.steps[0].kind, "fool-win");
    for (const viewer of ["gm", "mayor", "wolf", "spectator"]) {
      const seats = werewolves.snapshot(state, viewer, new Set()).seats as { id: string; role?: string; publiclyRevealed: boolean }[];
      assert.equal(seats.find(seat => seat.id === "fool")?.role, "fool");
      assert.equal(seats.find(seat => seat.id === "fool")?.publiclyRevealed, true);
    }
    confirm();
    assert.deepEqual(state.individualWinners, ["fool"]);
    assert.equal(state.seats.fool.alive, true);
    assert.equal(state.phase, "playing");
    assert.equal(state.steps.some(step => step.kind === "lynch-kill" || step.kind === "death-reveal"), false);
    assert.equal(state.steps[0].kind, strict ? "strict-sentence-check" : "day-check-after-lynch");
    assert.ok(state.events.some(event => event.includes("Jester, the Fool, wins individually")));
    if (!strict) {
      confirm();
      assert.equal(state.phase, "playing");
      assert.equal(state.seats.fool.publiclyRevealed, true);
    }
  }
});

test("a victorious Fool mayor must appoint another active player during the victory step", () => {
  const state = snifferGame(false, false);
  state.seats.sniffer.role = "fool";
  state.mayorId = "sniffer";
  state.steps = [{ id: "lynch", kind: "lynch-result", phase: "day", day: 3, actorMode: "gm", prompt: "Lynch", targetId: "sniffer" }];
  const gm = { ...host, userId: "gm", isHost: false };
  const fool = { ...host, userId: "sniffer", isHost: false };
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "fool-win");
  assert.equal(werewolves.snapshot(state, "sniffer", new Set()).canAct, true);
  assert.equal(typeof werewolves.handle(state, gm, { type: "confirm_step" }, context), "object");
  assert.deepEqual(werewolves.handle(state, fool, { type: "select_action", value: { targetId: "sniffer" } }, context), { error: "You must choose another player." });
  assert.equal(werewolves.handle(state, fool, { type: "select_action", value: { targetId: "target" } }, context), "save");
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.mayorId, "target");
  assert.equal(state.seats.sniffer.alive, true);
  assert.ok(state.individualWinners.includes("sniffer"));
  const seat = (werewolves.snapshot(state, "target", new Set()).seats as { id: string; alive: boolean; inactive: boolean }[])
    .find(player => player.id === "sniffer");
  assert.equal(seat?.alive, false);
  assert.equal(seat?.inactive, true);
});

test("victorious Fools are out of play and cannot be targeted, vote, or die", () => {
  const state = snifferGame(false, false);
  state.seats.fool = { id: "fool", username: "Fool", role: "fool", alive: true, publiclyRevealed: true, order: 3 };
  state.individualWinners = ["fool"];
  const gm = { ...host, userId: "gm", isHost: false };
  const snapshot = werewolves.snapshot(state, "fool", new Set());
  const seats = snapshot.seats as { id: string; alive: boolean; inactive: boolean }[];
  assert.deepEqual(seats.find(player => player.id === "fool")?.alive, false);
  assert.equal(seats.find(player => player.id === "fool")?.inactive, true);
  for (const kind of ["wolf-target", "old-knight-target", "guard-check", "seer-check", "sniffer-check",
    "little-girl-check", "hunter-shot", "big-bad-wolf", "silence-target", "new-mayor",
    "executioner-tie", "lynch-result", "wolfchild-target", "aid-target", "ghost-choice"]) {
    state.steps = [{ id: "ability", kind, actorMode: "role", actorId: "sniffer", role: "sniffer", phase: "night", day: 3, prompt: "Choose", data: { candidates: ["fool"] } }];
    const before = structuredClone(state);
    assert.deepEqual(werewolves.handle(state, gm, { type: "gm_action", value: { targetId: "fool" } }, context),
      { error: "The victorious Fool is out of play and cannot be targeted." });
    assert.deepEqual(state, before);
  }
  for (const value of [
    { targetIds: ["fool", "target"] }, { usePoison: true, poisonTarget: "fool" },
    { usePotion: true, saveTarget: "fool" }
  ]) {
    state.steps = [{ id: "multi", kind: "alchemist-actions", actorMode: "role", actorId: "sniffer", phase: "night", day: 3, prompt: "Choose" }];
    assert.deepEqual(werewolves.handle(state, gm, { type: "gm_action", value }, context),
      { error: "The victorious Fool is out of play and cannot be targeted." });
  }
  state.steps = [{ id: "start", kind: "lynch-start", actorMode: "gm", phase: "day", day: 3, prompt: "Vote" }];
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.lynchRemaining.includes("fool"), false);
  assert.equal(werewolves.snapshot(state, "fool", new Set()).canAct, false);
  state.steps = [{ id: "death", kind: "death-reveal", actorMode: "gm", phase: "day", day: 3, prompt: "Death", targetId: "fool", data: { reason: "heartbreak" } }];
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.seats.fool.alive, true);
  assert.equal(state.deaths.length, 0);
  state.seats.child = { id: "child", username: "Child", role: "wolfchild", alive: true, order: 4 };
  state.wolfchildTarget = "fool";
  assert.equal((werewolves.snapshot(state, "child", new Set()).viewer as { faction: string }).faction, "werewolf");
});

test("Werewolf faction victory includes dead wolves and converted Wolfchildren in results and match records", () => {
  const state = playing();
  state.seats = {
    wolf: { id: "wolf", username: "Wolf", role: "wise-wolf", alive: true, order: 0 },
    deadWolf: { id: "deadWolf", username: "Dead wolf", role: "sniffer", alive: false, order: 1 },
    child: { id: "child", username: "Child", role: "wolfchild", alive: false, order: 2 },
    villager: { id: "villager", username: "Villager", role: "seer", alive: false, order: 3 },
    fool: { id: "fool", username: "Fool", role: "fool", alive: true, order: 4 }
  };
  state.mayorId = "wolf";
  state.wolfchildTarget = "villager";
  state.steps = [{ id: "check", kind: "day-check", phase: "day", day: 3, actorMode: "gm", prompt: "Check" }];
  assert.equal(werewolves.handle(state, { ...host, userId: "gm", isHost: false }, { type: "confirm_step" }, context), "save");
  assert.equal(state.winner, "werewolves");
  assert.deepEqual([...state.winners].sort(), ["child", "deadWolf", "wolf"]);
  const results = werewolves.snapshot(state, "gm", new Set()).results as { id: string; won: boolean }[];
  assert.deepEqual(results.filter(player => player.won).map(player => player.id).sort(), ["child", "deadWolf", "wolf"]);
  const record = werewolves.takeResult?.(state);
  assert.deepEqual(record?.players.filter(player => player.won).map(player => player.userId).sort(), ["child", "deadWolf", "wolf"]);
});

test("Wolfchild wins with the faction they belonged to at death, not their target's later status", () => {
  for (const converted of [false, true]) {
    for (const winner of ["villagers", "werewolves"] as const) {
      const state = playing();
      state.seats = {
        child: { id: "child", username: "Child", role: "wolfchild", alive: true, order: 0 },
        target: { id: "target", username: "Target", role: "guard", alive: !converted, order: 1 },
        wolf: { id: "wolf", username: "Wolf", role: "wise-wolf", alive: true, order: 2 },
        mayor: { id: "mayor", username: "Mayor", role: "seer", alive: true, order: 3 }
      };
      state.mayorId = "mayor";
      state.wolfchildTarget = "target";
      if (converted) state.deaths.push({ userId: "target", reason: "lynching", order: 0 });
      state.steps = [{ id: "death", kind: "death-reveal", phase: "day", day: 3, actorMode: "gm", prompt: "Death", targetId: "child", data: { reason: "lynching" } }];
      const gm = { ...host, userId: "gm", isHost: false };
      assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
      assert.equal(state.deaths.find(death => death.userId === "child")?.factionAtDeath, converted ? "werewolf" : "villager");
      state.seats.target.alive = false;
      if (!converted) state.deaths.push({ userId: "target", reason: "lynching", order: state.deaths.length });
      assert.equal((werewolves.snapshot(state, "child", new Set()).viewer as { faction: string }).faction, converted ? "werewolf" : "villager");
      state.seats.wolf.alive = winner === "werewolves";
      state.seats.mayor.alive = winner === "villagers";
      state.mayorId = winner === "villagers" ? "mayor" : "wolf";
      state.steps = [{ id: "check", kind: "day-check", phase: "day", day: 3, actorMode: "gm", prompt: "Check" }];
      assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
      assert.equal(state.winner, winner);
      assert.equal(state.winners.includes("child"), converted === (winner === "werewolves"));
      assert.equal(werewolves.takeResult?.(state)?.players.find(player => player.userId === "child")?.won, converted === (winner === "werewolves"));
      const legacy = structuredClone(state);
      delete legacy.deaths.find(death => death.userId === "child")!.factionAtDeath;
      assert.equal((werewolves.snapshot(legacy, "child", new Set()).viewer as { faction: string }).faction, converted ? "werewolf" : "villager");
    }
  }
});

test("undrafted pool roles receive GM-only no-op night steps; excluded and dead roles do not", () => {
  const state = playing();
  state.settings.rolePool = ["wise-wolf", "seer", "cupido", "wolfchild", "old-knight", "guard", "sniffer", "throatcutter", "alchemist", "little-girl"];
  state.seats = {
    wolf: { id: "wolf", username: "Wolf", role: "wise-wolf", alive: true, order: 0 },
    seer: { id: "seer", username: "Seer", role: "seer", alive: false, order: 1 },
    mayor: { id: "mayor", username: "Mayor", role: "elder", alive: true, order: 2 }
  };
  state.mayorId = "mayor";
  state.steps = [{ id: "name", kind: "town-name", phase: "before-first-night", day: 1, actorMode: "mayor", prompt: "Name", required: true }];
  state.submissions.name = { mayor: { name: "Pretend town" } };
  const gm = { ...host, userId: "gm", isHost: false };
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "go-to-sleep");
  const pretend = state.steps.filter(step => step.kind === "pretend-role");
  assert.deepEqual(pretend.map(step => step.role), ["cupido", "wolfchild", "old-knight", "guard", "sniffer", "throatcutter", "alchemist", "little-girl"]);
  assert.equal(state.steps.some(step => step.role === "seer"), false);
  for (const step of pretend) {
    assert.equal(step.actorMode, "gm");
    assert.equal(step.required, undefined);
    assert.match(step.prompt, /Pretend/);
    state.steps = [step, { id: "next", kind: "discussion", actorMode: "gm", phase: "day", day: 1, prompt: "Next" }];
    for (const viewer of ["wolf", "mayor", "spectator"]) {
      const snapshot = werewolves.snapshot(state, viewer, new Set());
      assert.equal(snapshot.canAct, false);
      assert.equal(snapshot.privatePrompt, null);
      assert.equal(snapshot.currentStep, null);
      assert.equal(JSON.stringify(snapshot.publicStep).includes("Pretend"), false);
    }
    const before = structuredClone(state);
    assert.deepEqual(werewolves.handle(state, gm, { type: "gm_action", value: { targetId: "mayor" } }, context),
      { error: "Pretend steps have no choices. Confirm the step to continue." });
    assert.deepEqual(state, before);
    assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
    assert.equal(state.steps[0].id, "next");
    assert.deepEqual(state.actions, before.actions);
    assert.deepEqual(state.privateResults, before.privateResults);
    assert.deepEqual(state.night, before.night);
    assert.deepEqual(state.events, before.events);
    assert.deepEqual(state.seats, before.seats);
  }
});

test("undrafted daytime Bearman, Big Bad Wolf, and Judge steps are pretend only", () => {
  const state = snifferGame(false, false);
  state.settings.moonCards = false;
  state.settings.rolePool = ["sniffer", "seer", "bearman", "big-bad-wolf", "judge"];
  const gm = { ...host, userId: "gm", isHost: false };
  state.steps = [{ id: "dawn", kind: "night-deaths", phase: "day", day: 3, actorMode: "gm", prompt: "Dawn" }];
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.deepEqual(state.steps.filter(step => step.kind === "pretend-role").map(step => step.role), ["bearman", "big-bad-wolf"]);
  werewolves.migrate?.(state);
  assert.deepEqual(state.steps.filter(step => step.kind === "pretend-role").map(step => step.role), ["bearman", "big-bad-wolf"]);
  state.steps = [{ id: "lynch", kind: "lynch-result", phase: "day", day: 3, actorMode: "gm", prompt: "Lynch", targetId: "target" }];
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "pretend-role");
  assert.equal(state.steps[0].role, "judge");
  assert.equal(state.steps[1].kind, "lynch-kill");
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "lynch-kill");
  assert.equal(state.seats.target.alive, true);
});

test("pretend scheduling repeats nightly only for undrafted pool roles and never repeats first-night choices", () => {
  for (const status of ["undrafted", "excluded", "dead"] as const) {
    const state = playing();
    state.settings.rolePool = ["seer", "wise-wolf", "cupido", "wolfchild", ...(status === "excluded" ? [] : ["guard" as const])];
    state.seats = {
      mayor: { id: "mayor", username: "Mayor", role: "seer", alive: true, order: 0 }
    };
    if (status === "dead") state.seats.guard = { id: "guard", username: "Guard", role: "guard", alive: false, order: 1 };
    state.mayorId = "mayor";
    state.steps = [{ id: "end", kind: "day-end", phase: "day", day: 3, actorMode: "gm", prompt: "End" }];
    const gm = { ...host, userId: "gm", isHost: false };
    assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
    assert.equal(state.steps.some(step => step.role === "guard"), status === "undrafted");
    assert.equal(state.steps.some(step => step.role === "cupido" || step.role === "wolfchild"), false);
    assert.equal(state.steps.some(step => step.kind === "seer-check"), true);
    assert.equal(state.steps.some(step => step.kind === "pretend-role" && step.role === "wise-wolf"), true);
    assert.equal(state.steps.some(step => step.kind === "wolf-target"), false);
  }
});

test("Throatcutter only targets Villagers, including Wolfchild before conversion, on every recording path", () => {
  for (const converted of [false, true]) {
    const state = playing();
    state.seats = {
      cutter: { id: "cutter", username: "Cutter", role: "throatcutter", alive: true, order: 0 },
      wolf: { id: "wolf", username: "Wolf", role: "wise-wolf", alive: true, order: 1 },
      child: { id: "child", username: "Child", role: "wolfchild", alive: true, order: 2 },
      target: { id: "target", username: "Target", role: "seer", alive: !converted, order: 3 },
      guard: { id: "guard", username: "Guard", role: "guard", alive: true, order: 4 },
      fool: { id: "fool", username: "Fool", role: "fool", alive: true, order: 5 }
    };
    state.mayorId = "guard";
    state.wolfchildTarget = "target";
    state.steps = [{ id: "silence", kind: "silence-target", phase: "night", day: 3, actorMode: "role", role: "throatcutter", actorId: "cutter", prompt: "Silence", optional: true }];
    const gm = { ...host, userId: "gm", isHost: false };
    const cutter = { ...host, userId: "cutter", isHost: false };
    const expected = converted ? ["guard"] : ["child", "target", "guard"];
    const own = werewolves.snapshot(state, "cutter", new Set());
    assert.deepEqual((own.privatePrompt as { data: { eligibleTargetIds: string[] } }).data.eligibleTargetIds, expected);
    assert.deepEqual((werewolves.snapshot(state, "gm", new Set()).currentStep as { data: { eligibleTargetIds: string[] } }).data.eligibleTargetIds, expected);
    assert.equal(werewolves.snapshot(state, "wolf", new Set()).privatePrompt, null);
    for (const targetId of ["cutter", "wolf", "fool", ...(converted ? ["child"] : [])]) {
      for (const actor of [gm, cutter]) {
        const before = structuredClone(state);
        assert.deepEqual(werewolves.handle(state, actor, { type: actor === gm ? "gm_action" : "select_action", value: { targetId } }, context),
          { error: "The Throatcutter can only target Villager-aligned players." });
        assert.deepEqual(state, before);
      }
      state.overrides.silence = { targetId };
      assert.deepEqual(werewolves.handle(state, gm, { type: "confirm_step" }, context),
        { error: "The Throatcutter can only target Villager-aligned players." });
      delete state.overrides.silence;
    }
    assert.equal(werewolves.handle(state, cutter, { type: "select_action", value: { targetId: converted ? "guard" : "child" } }, context), "save");
    assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
    assert.equal(state.silencedId, converted ? "guard" : "child");
    assert.equal(state.throatcutterUsed, true);
  }
});

test("Throatcutter can still pass without using their ability", () => {
  const state = snifferGame(false, false);
  state.seats.sniffer.role = "throatcutter";
  state.steps[0] = { ...state.steps[0], kind: "silence-target", role: "throatcutter", optional: true };
  const gm = { ...host, userId: "gm", isHost: false };
  assert.equal(werewolves.handle(state, gm, { type: "gm_action", value: { pass: true } }, context), "save");
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.throatcutterUsed, false);
  assert.equal(state.silencedId, null);
});

test("Throatcutter victim is revealed publicly before dawn deaths and marked only for that day", () => {
  const state = snifferGame(false, false);
  state.seats.sniffer.role = "throatcutter";
  state.steps = [
    { id: "cut", kind: "silence-target", phase: "night", day: 3, actorMode: "role", role: "throatcutter", actorId: "sniffer", prompt: "Choose" },
    { id: "dawn", kind: "night-deaths", phase: "day", day: 3, actorMode: "gm", prompt: "Dawn" }
  ];
  state.submissions = { cut: { sniffer: { targetId: "target" } } };
  const gm = { ...host, userId: "gm", isHost: false };
  const targetSeat = (viewer: string) => (werewolves.snapshot(state, viewer, new Set()).seats as { id: string; silenced: boolean; throatCut: boolean }[]).find(player => player.id === "target")!;
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "throatcutter-reveal");
  assert.equal(state.steps[1].kind, "night-deaths");
  assert.match(state.steps[0].prompt, /Target/);
  assert.equal(targetSeat("spectator").silenced, false);
  assert.equal(targetSeat("gm").throatCut, false);
  werewolves.migrate?.(state);
  werewolves.migrate?.(state);
  assert.equal(state.steps.filter(step => step.kind === "throatcutter-reveal").length, 1);
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "night-deaths");
  for (const viewer of ["gm", "sniffer", "target", "spectator"]) {
    assert.equal(targetSeat(viewer).silenced, true);
    assert.equal(targetSeat(viewer).throatCut, true);
  }
  assert.ok(state.events.some(event => event.includes("Target has their throat cut")));
  state.steps = [{ id: "end", kind: "day-end", phase: "day", day: 3, actorMode: "gm", prompt: "End" }];
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(targetSeat("spectator").throatCut, false);
  assert.equal(targetSeat("spectator").silenced, false);
  assert.equal(state.steps.some(step => step.kind === "throatcutter-reveal"), false);
});

test("pending older games gain a Throatcutter reveal but passes do not", () => {
  for (const cut of [false, true]) {
    const state = snifferGame(false, false);
    state.steps = [{ id: "dawn", kind: "night-deaths", phase: "day", day: 3, actorMode: "gm", prompt: "Dawn" }];
    if (cut) {
      state.silencedId = "target";
      state.actions.silence = { targetId: "target", day: 3 };
    }
    werewolves.migrate?.(state);
    assert.equal(state.steps[0].kind, cut ? "throatcutter-reveal" : "night-deaths");
  }
});

test("Cupido's confirmed assignment immediately wakes both lovers privately before the next night step", () => {
  const state = snifferGame(true, false);
  state.seats.cupido = { id: "cupido", username: "Cupido", role: "cupido", alive: true, order: 2 };
  state.steps.unshift({ id: "love", kind: "lovers", phase: "night", day: 3, actorMode: "role", role: "cupido", actorId: "cupido", required: true, prompt: "Choose lovers" });
  state.submissions.love = { cupido: { targetIds: ["sniffer", "target"] } };
  const gm = { ...host, userId: "gm", isHost: false };
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "lovers-meet");
  assert.equal(state.steps[1].kind, "sniffer-check");
  for (const id of ["sniffer", "target"]) {
    const snapshot = werewolves.snapshot(state, id, new Set());
    assert.equal((snapshot.privatePrompt as { kind: string }).kind, "lovers-meet");
    assert.deepEqual(snapshot.lovers, ["sniffer", "target"]);
    assert.equal(snapshot.canAct, false);
  }
  for (const id of ["cupido", "spectator"]) {
    const snapshot = werewolves.snapshot(state, id, new Set());
    assert.equal(snapshot.privatePrompt, null);
    assert.equal(snapshot.lovers, null);
    assert.equal((snapshot.publicStep as { kind: string }).kind, "night");
  }
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "sniffer-check");
  assert.deepEqual(state.lovers, ["sniffer", "target"]);
});

test("Wolfchild assignment privately wakes the imitated player and requires shared acknowledgement", () => {
  const state = snifferGame(true, false);
  state.seats.sniffer.role = "wolfchild";
  state.steps[0] = { ...state.steps[0], kind: "wolfchild-target", role: "wolfchild" };
  const gm = { ...host, userId: "gm", isHost: false };
  const target = { ...host, userId: "target", isHost: false };
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "feeling-watched");
  assert.equal(state.steps[0].actorId, "target");
  const own = werewolves.snapshot(state, "target", new Set());
  assert.equal(own.canAct, true);
  assert.equal((own.privatePrompt as { kind: string }).kind, "feeling-watched");
  assert.equal(own.wolfchildTarget, "target");
  assert.equal(JSON.stringify(own.privatePrompt).includes("sniffer"), false);
  assert.equal(werewolves.snapshot(state, "sniffer", new Set()).canAct, false);
  assert.equal(werewolves.snapshot(state, "sniffer", new Set()).privatePrompt, null);
  const stranger = werewolves.snapshot(state, "spectator", new Set());
  assert.equal(stranger.privatePrompt, null);
  assert.equal(stranger.wolfchildTarget, null);
  assert.equal((stranger.publicStep as { kind: string }).kind, "night");
  const before = structuredClone(state);
  assert.deepEqual(werewolves.handle(state, gm, { type: "confirm_step" }, context), { error: "Wait for the player to confirm seeing the result." });
  assert.deepEqual(state, before);
  assert.equal(werewolves.handle(state, gm, { type: "gm_action", value: { acknowledged: true } }, context), "save");
  assert.deepEqual(werewolves.snapshot(state, "target", new Set()).action, { acknowledged: true });
  assert.equal(werewolves.handle(state, target, { type: "select_action", value: { acknowledged: false } }, context), "save");
  assert.deepEqual(werewolves.handle(state, gm, { type: "confirm_step" }, context), { error: "Wait for the player to confirm seeing the result." });
  assert.equal(werewolves.handle(state, target, { type: "select_action", value: { acknowledged: true } }, context), "save");
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "wolf-target");
  assert.equal(werewolves.snapshot(state, "target", new Set()).wolfchildTarget, "target");
  state.seats.sniffer.alive = false;
  assert.equal(werewolves.snapshot(state, "target", new Set()).wolfchildTarget, null);
  assert.equal(werewolves.snapshot(state, "gm", new Set()).wolfchildTarget, "target");
});

test("the host can exit an active Werewolves game, clearing match data and preserving settings", () => {
  const state = playing();
  const settings = structuredClone(state.settings);
  assert.equal(werewolves.handle(state, host, { type: "abort" }, context), "save");
  assert.deepEqual(state, { ...werewolves.create(), settings });
  assert.equal(werewolves.takeResult?.(state), null);
});

test("a non-host GM, admin, player or spectator cannot exit Werewolves", () => {
  for (const actor of [
    { ...host, userId: "gm", isHost: false },
    { ...host, userId: "admin", isHost: false, isAdmin: true },
    { ...host, userId: "player", isHost: false },
    { ...host, userId: "spectator", isHost: false }
  ]) {
    const state = playing();
    const before = structuredClone(state);
    assert.deepEqual(werewolves.handle(state, actor, { type: "abort" }, context), { error: "Only the host can exit the game." });
    assert.deepEqual(state, before);
  }
});

test("exit is rejected outside an active Werewolves game", () => {
  for (const phase of ["lobby", "results"] as const) {
    const state = werewolves.create();
    state.phase = phase;
    const before = structuredClone(state);
    assert.deepEqual(werewolves.handle(state, host, { type: "abort" }, context), { error: "No game is in progress." });
    assert.deepEqual(state, before);
  }
});

test("the GM records individual wolf choices inline without overriding the whole pack", () => {
  const state = playing();
  state.seats = {
    wolf: { id: "wolf", username: "Wolf", order: 0, alive: true, role: "wise-wolf" },
    other: { id: "other", username: "Other", order: 1, alive: true, role: "sniffer" },
    villager: { id: "villager", username: "Villager", order: 2, alive: true, role: "seer" }
  };
  state.steps = [{ id: "wolves", phase: "night", day: 3, kind: "wolf-target", prompt: "Choose", actorMode: "wolves" }];
  const gm = { ...host, userId: "gm", isHost: false };
  state.overrides.wolves = { pass: true };
  assert.equal(werewolves.handle(state, gm, { type: "gm_action", value: { forUserId: "wolf", vote: { targetId: "villager" } } }, context), "save");
  assert.deepEqual(state.submissions.wolves.wolf, { userId: "wolf", targetId: "villager" });
  assert.equal(state.overrides.wolves, undefined);
  assert.equal(werewolves.handle(state, gm, { type: "gm_action", value: { forUserId: "other", vote: { pass: true } } }, context), "save");
  assert.deepEqual(state.submissions.wolves.other, { userId: "other", pass: true });
  assert.equal(state.submissions.wolves.wolf.targetId, "villager");
  const before = structuredClone(state);
  assert.equal(typeof werewolves.handle(state, gm, { type: "gm_action", value: { forUserId: "villager", vote: { pass: true } } }, context), "object");
  assert.deepEqual(state, before);
  assert.equal(werewolves.handle(state, host, { type: "gm_action", value: { forUserId: "wolf", vote: { pass: true } } }, context), "ignore");
});

test("confirmed steps retain immutable GM-only history without rewinding gameplay", () => {
  const state = playing();
  state.seats = {
    p1: { id: "p1", username: "Alice", order: 0, alive: true, role: "seer" },
    p2: { id: "p2", username: "Bob", order: 1, alive: true, role: "wise-wolf" }
  };
  state.steps = [
    { id: "nominate", kind: "mayor-nominations", actorMode: "living", phase: "before-first-night", day: 1, prompt: "Who runs?" },
    { id: "speeches", kind: "mayor-speeches", actorMode: "gm", phase: "before-first-night", day: 1, prompt: "Speeches" }
  ];
  state.submissions.nominate = { p1: { candidate: true }, p2: { candidate: false } };
  const gm = { ...host, userId: "gm", isHost: false };
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].id, "speeches");
  assert.deepEqual(state.mayorCandidates, ["p1"]);
  assert.equal(state.submissions.nominate, undefined);
  assert.equal(state.stepHistory?.length, 1);
  assert.equal(state.stepHistory![0].submissions.p1.candidate, true);
  state.seats.p1.username = "Renamed";
  assert.equal(state.stepHistory![0].names.p1, "Alice");
  const connected = new Set(["p1", "p2", "gm"]);
  assert.equal((werewolves.snapshot(state, "gm", connected).stepHistory as unknown[]).length, 1);
  assert.equal(werewolves.snapshot(state, "p1", connected).stepHistory, undefined);
  assert.equal(werewolves.snapshot(state, "spectator", connected).stepHistory, undefined);
  const restored = JSON.parse(JSON.stringify(state));
  assert.deepEqual(restored.stepHistory, state.stepHistory);
  const count = state.stepHistory!.length;
  assert.equal(werewolves.handle(state, host, { type: "confirm_step" }, context), "ignore");
  assert.equal(state.stepHistory!.length, count);
  assert.equal(werewolves.handle(state, host, { type: "abort" }, context), "save");
  assert.equal(state.stepHistory, undefined);
});

function snifferGame(firstNight: boolean, wolfTarget: boolean) {
  const state = playing();
  state.firstNight = firstNight;
  state.mayorId = "sniffer";
  state.seats = {
    sniffer: { id: "sniffer", username: "Sniffer", order: 0, alive: true, role: "sniffer" },
    target: { id: "target", username: "Target", order: 1, alive: true, role: wolfTarget ? "wise-wolf" : "seer" }
  };
  state.steps = [
    { id: "sniff", kind: "sniffer-check", actorMode: "role", actorId: "sniffer", role: "sniffer", phase: "night", day: 3, prompt: "Check a player", required: true },
    { id: "wolves", kind: "wolf-target", actorMode: "wolves", phase: "night", day: 3, prompt: "Choose a target", required: true }
  ];
  state.submissions.sniff = { sniffer: { targetId: "target" } };
  return state;
}

test("Sniffer result is private and acknowledgement never auto-advances", () => {
  const state = snifferGame(true, false);
  const gm = { ...host, userId: "gm", isHost: false };
  const sniffer = { ...host, userId: "sniffer", isHost: false };
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  const resultStep = state.steps[0];
  assert.equal(resultStep.kind, "sniffer-result");
  assert.deepEqual(resultStep.data, { result: "role", role: "seer", targetId: "target" });
  const connected = new Set(["gm", "sniffer", "target"]);
  const own = werewolves.snapshot(state, "sniffer", connected);
  assert.equal(own.canAct, true);
  assert.deepEqual((own.privatePrompt as { data: unknown }).data, resultStep.data);
  for (const id of ["target", "spectator"]) {
    const snapshot = werewolves.snapshot(state, id, connected);
    assert.equal(snapshot.privatePrompt, null);
    assert.equal(snapshot.currentStep, null);
    assert.equal(snapshot.canAct, false);
    assert.deepEqual(snapshot.privateResults, {});
    assert.equal(snapshot.gmPrivateResults, undefined);
  }
  const before = structuredClone(state);
  assert.equal(werewolves.handle(state, { ...sniffer, userId: "target" }, { type: "select_action", value: { acknowledged: true } }, context), "ignore");
  assert.deepEqual(state, before);
  assert.equal(werewolves.handle(state, sniffer, { type: "select_action", value: { acknowledged: false } }, context), "save");
  assert.equal(werewolves.handle(state, sniffer, { type: "select_action", value: { acknowledged: true } }, context), "save");
  assert.equal(state.steps[0].id, resultStep.id);
  const gmStep = werewolves.snapshot(state, "gm", connected).currentStep as { submissions: Record<string, { acknowledged: boolean }> };
  assert.equal(gmStep.submissions.sniffer.acknowledged, true);
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].id, "wolves");
});

test("Sniffer acknowledgement is required and later-night checks reveal Werewolf roles", () => {
  const state = snifferGame(false, true);
  const gm = { ...host, userId: "gm", isHost: false };
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "sniffer-result");
  assert.equal(state.steps[0].data?.role, "wise-wolf");
  assert.equal(state.steps[0].required, true);
  const before = structuredClone(state);
  assert.deepEqual(werewolves.handle(state, gm, { type: "confirm_step" }, context), { error: "Wait for the Sniffer to confirm seeing the result." });
  assert.deepEqual(state, before);
  assert.equal(werewolves.handle(state, { ...host, userId: "sniffer", isHost: false }, { type: "select_action", value: { acknowledged: true } }, context), "save");
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].id, "wolves");
});

test("first-night Werewolf checks show thumbs-down before reconsidering", () => {
  const state = snifferGame(true, true);
  const gm = { ...host, userId: "gm", isHost: false };
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "sniffer-result");
  assert.deepEqual(state.steps[0].data, { result: "thumbs-down", targetId: "target" });
  assert.equal(state.steps[1].kind, "sniffer-check");
  assert.deepEqual(werewolves.handle(state, gm, { type: "confirm_step" }, context), { error: "Wait for the Sniffer to confirm seeing the result." });
  assert.equal(werewolves.handle(state, gm, { type: "gm_action", value: { acknowledged: true } }, context), "save");
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "sniffer-check");
  assert.equal(state.steps[0].required, true);
});

test("only participating wolves see the pack's roles during target selection", () => {
  const state = snifferGame(false, true);
  state.steps.shift();
  state.seats.villager = { id: "villager", username: "Villager", order: 2, alive: true, role: "seer" };
  state.seats.child = { id: "child", username: "Child", order: 3, alive: true, role: "wolfchild" };
  state.seats.dead = { id: "dead", username: "Dead wolf", order: 4, alive: false, role: "throatcutter" };
  state.seats.away = { id: "away", username: "Absent wolf", order: 5, alive: true, role: "cloaked-wolf" };
  state.absentId = "away";
  state.absentThroughNight = state.day;
  const connected = new Set(Object.keys(state.seats));
  const seatsFor = (id: string) => werewolves.snapshot(state, id, connected).seats as {
    id: string; role?: string; packRevealed?: boolean; publiclyRevealed: boolean;
  }[];
  for (const id of ["sniffer", "target"]) {
    const seats = seatsFor(id);
    assert.deepEqual(seats.filter(player => player.packRevealed).map(player => player.id), ["sniffer", "target"]);
    assert.equal(seats.find(player => player.id === "target")?.role, "wise-wolf");
    for (const hidden of ["villager", "child", "dead", "away"]) {
      assert.equal(seats.find(player => player.id === hidden)?.role, undefined);
    }
    assert.equal(seats.some(player => player.publiclyRevealed), false);
  }
  for (const id of ["villager", "child", "dead", "away", "spectator"]) {
    assert.equal(seatsFor(id).some(player => player.packRevealed), false);
    assert.equal(seatsFor(id).find(player => player.id === "sniffer")?.role, undefined);
  }
  state.wolfchildTarget = "dead";
  assert.equal(seatsFor("sniffer").find(player => player.id === "child")?.role, "wolfchild");
  assert.equal(seatsFor("child").find(player => player.id === "sniffer")?.packRevealed, true);
  state.steps[0].kind = "night-deaths";
  assert.equal(seatsFor("sniffer").some(player => player.packRevealed), false);
  assert.equal(seatsFor("sniffer").find(player => player.id === "target")?.role, undefined);
});

test("visible role badges receive current factions without exposing hidden factions", () => {
  const state = snifferGame(false, false);
  state.seats.child = { id: "child", username: "Child", order: 2, alive: true, role: "wolfchild", publiclyRevealed: true };
  state.seats.fool = { id: "fool", username: "Fool", order: 3, alive: true, role: "fool", publiclyRevealed: true };
  state.wolfchildTarget = "target";
  const seatsFor = (id: string) => werewolves.snapshot(state, id, new Set()).seats as { id: string; faction?: string }[];
  assert.equal(seatsFor("spectator").find(player => player.id === "child")?.faction, "villager");
  assert.equal(seatsFor("spectator").find(player => player.id === "fool")?.faction, "neutral");
  assert.equal(seatsFor("spectator").find(player => player.id === "sniffer")?.faction, undefined);
  assert.equal(seatsFor("gm").find(player => player.id === "sniffer")?.faction, "werewolf");
  assert.equal(seatsFor("gm").find(player => player.id === "target")?.faction, "villager");
  state.seats.target.alive = false;
  assert.equal(seatsFor("spectator").find(player => player.id === "child")?.faction, "werewolf");
  assert.equal(seatsFor("child").find(player => player.id === "child")?.faction, "werewolf");
});

test("pack attacks reject wolves and converted Wolfchildren on every recording path", () => {
  const state = snifferGame(false, true);
  state.steps.shift();
  state.seats.child = { id: "child", username: "Child", order: 2, alive: true, role: "wolfchild" };
  state.seats.villager = { id: "villager", username: "Villager", order: 3, alive: true, role: "seer" };
  state.wolfchildTarget = "villager";
  const gm = { ...host, userId: "gm", isHost: false };
  const wolf = { ...host, userId: "sniffer", isHost: false };
  for (const targetId of ["sniffer", "target"]) {
    for (const [actor, message] of [
      [wolf, { type: "select_action", value: { targetId } }],
      [gm, { type: "gm_action", value: { targetId } }],
      [gm, { type: "gm_action", value: { forUserId: "sniffer", vote: { targetId } } }]
    ] as const) {
      const before = structuredClone(state);
      assert.deepEqual(werewolves.handle(state, actor, message, context), { error: "Werewolves cannot attack another Werewolf." });
      assert.deepEqual(state, before);
    }
  }
  assert.equal(werewolves.snapshot(state, "child", new Set()).canAct, false);
  assert.equal(werewolves.handle(state, wolf, { type: "select_action", value: { targetId: "child" } }, context), "save");
  assert.equal(werewolves.handle(state, gm, { type: "gm_action", value: { targetId: "child" } }, context), "save");
  state.seats.villager.alive = false;
  assert.equal(werewolves.snapshot(state, "child", new Set()).canAct, true);
  const before = structuredClone(state);
  assert.deepEqual(werewolves.handle(state, gm, { type: "confirm_step" }, context), { error: "Werewolves cannot attack another Werewolf." });
  assert.deepEqual(state, before);
  assert.deepEqual(werewolves.handle(state, wolf, { type: "select_action", value: { targetId: "child" } }, context),
    { error: "Werewolves cannot attack another Werewolf." });
  assert.equal(werewolves.handle(state, gm, { type: "gm_action", value: { pass: true } }, context), "save");
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.night.wolfTarget, null);
});

test("night deaths begin daytime at dawn before death reveals and the win check", () => {
  const state = snifferGame(false, false);
  state.settings.moonCards = false;
  state.steps = [{ id: "town", kind: "town-name", phase: "before-first-night", day: 3, actorMode: "mayor", prompt: "Name the town", required: true }];
  state.overrides.town = { name: "Dawn town" };
  const gm = { ...host, userId: "gm", isHost: false };
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "go-to-sleep");
  assert.equal(state.steps[0].prompt, "Tell everyone to close their eyes and go to sleep.");
  assert.equal(state.steps[0].actorMode, "gm");
  assert.equal(werewolves.snapshot(state, "target", new Set()).canAct, false);
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps.find(step => step.kind !== "pretend-role")?.kind, "seer-check");
  const dawn = state.steps.find(item => item.kind === "night-deaths")!;
  assert.equal(dawn.phase, "day");
  assert.equal(state.steps.at(-1)?.id, dawn.id);
  assert.equal(state.steps.filter(item => item.phase === "night").some(item => item.kind === "night-deaths"), false);
  state.steps = [dawn];
  state.night.wolfTarget = "target";
  const snapshot = werewolves.snapshot(state, "target", new Set());
  assert.equal((snapshot.publicStep as { phase: string }).phase, "day");
  assert.equal((snapshot.publicStep as { kind: string }).kind, "night-deaths");
  const beforePreview = structuredClone(state);
  const upcoming = werewolves.snapshot(state, "gm", new Set()).upcomingSteps as { phase: string; current?: boolean; steps: string[] }[];
  assert.equal(upcoming[0].phase, "day");
  assert.equal(upcoming[0].current, true);
  assert.ok(upcoming[0].steps.includes("Discussion"));
  assert.ok(upcoming[0].steps.includes("Check faction win conditions"));
  assert.equal(upcoming[1].phase, "night");
  assert.deepEqual(state, beforePreview);
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "death-reveal");
  assert.equal(state.steps[0].phase, "day");
  assert.equal(state.steps[1].kind, "day-check");
  assert.equal(state.nightActive, false);
  const after = werewolves.snapshot(state, "gm", new Set()).upcomingSteps as { current?: boolean }[];
  assert.equal(after.some(group => group.current), false);
});

test("existing queued night-death steps migrate to daytime", () => {
  const state = snifferGame(false, false);
  state.steps = [{ id: "dawn", kind: "night-deaths", phase: "night", day: 3, actorMode: "gm", prompt: "Resolve deaths" }];
  werewolves.migrate?.(state);
  assert.equal(state.steps[0].phase, "day");
});

test("GM and player individual choices synchronize privately in both directions", () => {
  const state = snifferGame(false, false);
  state.seats.sniffer.role = "wolfchild";
  state.steps = [{ id: "imitate", kind: "wolfchild-target", phase: "night", day: 3, actorMode: "role", actorId: "sniffer", role: "wolfchild", required: true, prompt: "Choose an imitation target" }];
  const gm = { ...host, userId: "gm", isHost: false };
  const player = { ...host, userId: "sniffer", isHost: false };
  const connected = new Set(["gm", "sniffer", "target"]);
  assert.equal(werewolves.handle(state, gm, { type: "gm_action", value: { targetId: "target" } }, context), "save");
  assert.deepEqual(werewolves.snapshot(state, "sniffer", connected).action, { targetId: "target" });
  for (const id of ["target", "spectator"]) assert.equal(werewolves.snapshot(state, id, connected).action, null);
  assert.equal(werewolves.handle(state, player, { type: "select_action", value: { targetId: "sniffer" } }, context), "save");
  assert.equal(state.overrides.imitate, undefined);
  const current = werewolves.snapshot(state, "gm", connected).currentStep as { submissions: Record<string, { targetId: string }> };
  assert.equal(current.submissions.sniffer.targetId, "sniffer");
  assert.deepEqual(werewolves.snapshot(state, "sniffer", connected).action, { targetId: "sniffer", userId: "sniffer" });
  assert.equal(werewolves.handle(state, gm, { type: "gm_action", value: { targetId: "target" } }, context), "save");
  assert.deepEqual(werewolves.snapshot(state, "sniffer", connected).action, { targetId: "target" });
});

test("Seer result stays private and blocks advancement until the Seer acknowledges", () => {
  for (const hidden of [false, true]) {
    const state = snifferGame(false, false);
    state.seats.sniffer.role = "seer";
    state.seats.target.role = hidden ? "cloaked-wolf" : "hunter";
    state.steps[0] = { ...state.steps[0], kind: "seer-check", role: "seer" };
    const gm = { ...host, userId: "gm", isHost: false };
    const seer = { ...host, userId: "sniffer", isHost: false };
    assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
    const result = state.steps[0];
    assert.equal(result.kind, "seer-result");
    assert.equal(result.required, true);
    assert.deepEqual(result.data, hidden
      ? { result: "thumbs-down", targetId: "target" }
      : { result: "role", role: "hunter", targetId: "target" });
    const connected = new Set(["gm", "sniffer", "target"]);
    assert.deepEqual((werewolves.snapshot(state, "sniffer", connected).privatePrompt as { data: unknown }).data, result.data);
    for (const id of ["target", "spectator"]) {
      const snapshot = werewolves.snapshot(state, id, connected);
      assert.equal(snapshot.privatePrompt, null);
      assert.deepEqual(snapshot.privateResults, {});
      assert.equal(snapshot.currentStep, null);
    }
    const before = structuredClone(state);
    assert.deepEqual(werewolves.handle(state, gm, { type: "confirm_step" }, context), { error: "Wait for the Seer to confirm seeing the result." });
    assert.deepEqual(state, before);
    assert.equal(werewolves.handle(state, { ...seer, userId: "target" }, { type: "select_action", value: { acknowledged: true } }, context), "ignore");
    assert.equal(werewolves.handle(state, seer, { type: "select_action", value: { acknowledged: false } }, context), "save");
    state.overrides[result.id] = { acknowledged: false };
    assert.deepEqual(werewolves.handle(state, gm, { type: "confirm_step" }, context), { error: "Wait for the Seer to confirm seeing the result." });
    assert.equal(werewolves.handle(state, seer, { type: "select_action", value: { acknowledged: true } }, context), "save");
    assert.equal(state.steps[0].id, result.id);
    assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
    assert.equal(state.steps[0].id, "wolves");
  }
});

test("GM and player can both toggle private result acknowledgement", () => {
  for (const kind of ["seer-result", "sniffer-result"]) {
    const state = snifferGame(false, false);
    state.seats.sniffer.role = kind === "seer-result" ? "seer" : "sniffer";
    state.steps[0] = { ...state.steps[0], kind, role: state.seats.sniffer.role };
    const gm = { ...host, userId: "gm", isHost: false };
    const player = { ...host, userId: "sniffer", isHost: false };
    const connected = new Set(["gm", "sniffer"]);
    assert.equal(werewolves.handle(state, gm, { type: "gm_action", value: { acknowledged: true } }, context), "save");
    assert.deepEqual(werewolves.snapshot(state, "sniffer", connected).action, { acknowledged: true });
    assert.equal(werewolves.handle(state, player, { type: "select_action", value: { acknowledged: false } }, context), "save");
    assert.equal(state.overrides.sniff, undefined);
    assert.deepEqual(werewolves.handle(state, gm, { type: "confirm_step" }, context), { error: `Wait for the ${kind === "seer-result" ? "Seer" : "Sniffer"} to confirm seeing the result.` });
    assert.equal(werewolves.handle(state, gm, { type: "gm_action", value: { acknowledged: true } }, context), "save");
    assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
    assert.equal(state.steps[0].id, "wolves");
  }
});

test("Little Girl privately learns current-night destinations and acknowledges the listening step", () => {
  for (const visited of [true, false]) {
    const state = snifferGame(false, false);
    state.seats.sniffer.role = "little-girl";
    state.steps[0] = { ...state.steps[0], kind: "little-girl-check", role: "little-girl" };
    state.nightVisitors = visited ? ["target"] : [];
    state.stepHistory = [{
      step: { ...state.steps[0], id: "seer", kind: "seer-check", actorId: "target", role: "seer" },
      chosen: { targetId: "sniffer" }, submissions: {}, override: null, names: {}
    }, {
      step: { ...state.steps[0], id: "old", day: 2, kind: "seer-check", actorId: "target" },
      chosen: { targetId: "target" }, submissions: {}, override: null, names: {}
    }];
    const gm = { ...host, userId: "gm", isHost: false };
    assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
    const result = state.steps[0];
    assert.equal(result.kind, "little-girl-result");
    assert.deepEqual(result.data, { targetId: "target", visited, visitedIds: visited ? ["sniffer"] : [] });
    const own = werewolves.snapshot(state, "sniffer", new Set());
    assert.deepEqual((own.privatePrompt as { data: unknown }).data, result.data);
    assert.equal(werewolves.snapshot(state, "target", new Set()).privatePrompt, null);
    assert.deepEqual(werewolves.handle(state, gm, { type: "confirm_step" }, context), { error: "Wait for the Little Girl to confirm seeing the result." });
    assert.equal(werewolves.handle(state, { ...host, userId: "sniffer", isHost: false }, { type: "select_action", value: { acknowledged: true } }, context), "save");
    assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
    assert.equal(state.steps[0].id, "wolves");
  }
});

test("Guard has a private result step with shared acknowledgement buttons", () => {
  const state = snifferGame(false, true);
  state.seats.sniffer.role = "guard";
  state.steps[0] = { ...state.steps[0], kind: "guard-check", role: "guard" };
  const gm = { ...host, userId: "gm", isHost: false };
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.steps[0].kind, "guard-result");
  assert.deepEqual(state.steps[0].data, { targetId: "target", result: "thumbs-up" });
  assert.equal(werewolves.snapshot(state, "target", new Set()).privatePrompt, null);
  assert.deepEqual(werewolves.handle(state, gm, { type: "confirm_step" }, context), { error: "Wait for the Guard to confirm seeing the result." });
  assert.equal(werewolves.handle(state, gm, { type: "gm_action", value: { acknowledged: true } }, context), "save");
  assert.deepEqual(werewolves.snapshot(state, "sniffer", new Set()).action, { acknowledged: true });
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
});

test("night-death preview lists only actual deaths, with protection and potion notes below", () => {
  for (const scenario of ["miss", "saved", "protected", "knight-saved", "elder", "poison"] as const) {
    const state = playing();
    state.settings.moonCards = false;
    state.seats = {
      wolf: { id: "wolf", username: "Wolf", order: 0, alive: true, role: "wise-wolf" },
      victim: { id: "victim", username: "Victim", order: 1, alive: true, role: scenario === "elder" ? "elder" : "seer" },
      knight: { id: "knight", username: "Knight", order: 2, alive: true, role: "old-knight" },
      other: { id: "other", username: "Other", order: 3, alive: true, role: "guard" }
    };
    state.mayorId = "other";
    state.steps = [{ id: "dawn", kind: "night-deaths", phase: "day", day: 3, prompt: "Resolve", actorMode: "gm" }];
    state.night.wolfTarget = "victim";
    state.night.oldKnightTarget = scenario === "protected" || scenario === "knight-saved" ? "victim" : "other";
    state.night.alchemistSaveTarget = scenario === "saved" ? "victim" : scenario === "knight-saved" ? "knight" : null;
    state.night.poisonTarget = scenario === "poison" ? "other" : null;
    const before = structuredClone(state);
    const preview = werewolves.snapshot(state, "gm", new Set()).nightDeathPreview as {
      deaths: { id: string; reason: string }[]; notes: string[];
    };
    assert.deepEqual(state, before);
    const expected = scenario === "saved" || scenario === "elder" ? []
      : scenario === "protected" ? ["knight", "wolf"]
      : scenario === "knight-saved" ? ["wolf"]
      : scenario === "poison" ? ["victim", "other"] : ["victim"];
    assert.deepEqual(preview.deaths.map(death => death.id).sort(), expected.sort());
    if (scenario === "protected") {
      assert.equal(preview.deaths.find(death => death.id === "knight")?.reason, "Old Knight's Last Stand");
    }
    if (scenario === "protected" || scenario === "knight-saved") {
      assert.equal(preview.deaths.find(death => death.id === "wolf")?.reason, "Old Knight's Revenge");
    }
    assert.equal(preview.notes.some(note => note.includes("did not stop")), !["protected", "knight-saved"].includes(scenario));
    assert.equal(preview.notes.some(note => note.includes("saved by")), ["saved", "knight-saved"].includes(scenario));
    const elderNote = "The Werewolves targeted Victim, the Elder, who was not devoured because the Elder cannot be killed by their attack.";
    assert.equal(preview.notes.includes(elderNote), scenario === "elder");
    assert.equal(werewolves.snapshot(state, "wolf", new Set()).nightDeathPreview, undefined);
    assert.equal(werewolves.handle(state, { ...host, userId: "gm", isHost: false }, { type: "confirm_step" }, context), "save");
    if (scenario === "elder") {
      assert.ok((state.actions.nightResolutionSummary?.events as string[]).includes(elderNote));
    }
    assert.deepEqual(state.steps.filter(step => step.kind === "death-reveal").map(step => step.targetId).sort(), expected.sort());
    for (const death of preview.deaths) {
      assert.equal(state.steps.find(step => step.kind === "death-reveal" && step.targetId === death.id)?.data?.reason, death.reason);
    }
  }
});

test("Bearman report previews living seating neighbours, excluding the Cloaked Wolf", () => {
  const state = playing();
  state.settings.rolePool.push("bearman");
  state.mayorId = "bear";
  state.seats = {
    bear: { id: "bear", username: "Bear", role: "bearman", alive: true, order: 0 },
    dead: { id: "dead", username: "Dead", role: "wise-wolf", alive: false, order: 1 },
    right: { id: "right", username: "Right", role: "cloaked-wolf", alive: true, order: 2 },
    left: { id: "left", username: "Left", role: "wolfchild", alive: true, order: 3 }
  };
  state.steps = [{ id: "bear", kind: "bearman-growl", phase: "day", day: 3, actorMode: "gm", prompt: "Report" }];
  const report = () => (werewolves.snapshot(state, "gm", new Set()).gmActions as { bearman: { growl: boolean; reasons: string[]; neighbors: string[] } }).bearman;
  assert.equal(report().growl, false);
  assert.deepEqual(report().neighbors, ["left", "right"]);
  assert.ok(report().reasons.some(reason => reason.includes("Cloaked Wolf counts as a Villager")));
  state.wolfchildTarget = "dead";
  assert.equal(report().growl, true);
  assert.ok(report().reasons.some(reason => reason.includes("Left") && reason.includes("Werewolf-aligned")));
  assert.equal(werewolves.snapshot(state, "right", new Set()).gmActions, undefined);
  assert.equal(werewolves.snapshot(state, "right", new Set()).publicActions.bearGrowl, null);
  const gm = { ...host, userId: "gm", isHost: false };
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.deepEqual(werewolves.snapshot(state, "right", new Set()).publicActions.bearGrowl, { growl: true });
});

test("Bearman report is removed after death or when not in the pool", () => {
  for (const inPool of [true, false]) {
    const state = playing();
    state.settings.rolePool = inPool ? ["bearman", "seer"] : ["seer"];
    state.seats = {
      bear: { id: "bear", username: "Bear", role: "bearman", alive: true, order: 0 },
      mayor: { id: "mayor", username: "Mayor", role: "seer", alive: true, order: 1 }
    };
    state.mayorId = "mayor";
    state.steps = [
      { id: "death", kind: "death-reveal", phase: "day", day: 3, actorMode: "gm", prompt: "Death", targetId: "bear", data: { reason: "Werewolves" } },
      { id: "bear", kind: "bearman-growl", phase: "day", day: 3, actorMode: "gm", prompt: "Report" },
      { id: "discussion", kind: "discussion", phase: "day", day: 3, actorMode: "gm", prompt: "Discuss" }
    ];
    if (inPool) {
      assert.equal(werewolves.handle(state, { ...host, userId: "gm", isHost: false }, { type: "confirm_step" }, context), "save");
      assert.equal(state.seats.bear.alive, false);
    } else {
      werewolves.migrate?.(state);
    }
    assert.equal(state.steps.some(step => step.kind === "bearman-growl"), false);
  }
});

test("revealed death causes are public while Buried still hides roles", () => {
  for (const buried of [true, false]) {
    const state = snifferGame(false, false);
    state.buried = buried;
    state.steps = [{ id: "death", kind: "death-reveal", phase: "day", day: 3, actorMode: "gm", prompt: "Reveal", targetId: "target", data: { reason: "Alchemist's poison" } }];
    assert.equal(werewolves.handle(state, { ...host, userId: "gm", isHost: false }, { type: "confirm_step" }, context), "save");
    for (const id of ["gm", "sniffer", "spectator"]) {
      const snapshot = werewolves.snapshot(state, id, new Set());
      const deaths = snapshot.deaths as { reason: string; role?: string }[];
      assert.equal(deaths[0].reason, "Alchemist's poison");
      assert.equal(deaths[0].role, buried ? undefined : "seer");
      assert.ok((snapshot.events as string[]).some(event => event.includes("dies (Alchemist's poison)")));
    }
  }
});

test("heartbreak death causes name the lover in public events and existing death records", () => {
  const state = snifferGame(false, false);
  state.lovers = ["sniffer", "target"];
  state.seats.sniffer.alive = false;
  state.mayorId = "target";
  state.steps = [{ id: "heartbreak", kind: "death-reveal", phase: "day", day: 3, actorMode: "gm", prompt: "Reveal", targetId: "target", data: { reason: "heartbreak" } }];
  assert.equal(werewolves.handle(state, { ...host, userId: "gm", isHost: false }, { type: "confirm_step" }, context), "save");
  assert.equal(state.deaths[0].reason, "heartbreak");
  for (const id of ["gm", "target", "spectator"]) {
    const snapshot = werewolves.snapshot(state, id, new Set());
    assert.equal((snapshot.deaths as { reason: string }[])[0].reason, "heartbreak — in love with Sniffer");
    assert.ok((snapshot.events as string[]).some(event => event.includes("heartbreak — in love with Sniffer")));
  }
});

test("a determined lynch result cannot be changed by the GM or a stale override", () => {
  const state = snifferGame(false, false);
  state.steps = [{ id: "lynch", kind: "lynch-result", phase: "day", day: 3, actorMode: "gm", prompt: "Last player", targetId: "target", required: true }];
  const gm = { ...host, userId: "gm", isHost: false };
  assert.deepEqual(werewolves.handle(state, gm, { type: "gm_action", value: { targetId: "sniffer" } }, context),
    { error: "The lynch target is already determined and cannot be changed." });
  state.overrides.lynch = { targetId: "sniffer" };
  assert.equal(werewolves.handle(state, gm, { type: "confirm_step" }, context), "save");
  assert.equal(state.lynchTarget, "target");
  assert.equal(state.steps[0].kind, "pretend-role");
  assert.equal(state.steps[0].role, "judge");
  assert.equal(state.steps[1].targetId, "target");
});
