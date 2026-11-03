import assert from "node:assert/strict";
import { test } from "node:test";
import { createState, dispatch, tilePlacer } from "./engine";
import { eligibleCharacters, characterPicker, characterRound } from "./draft";
import { addItem } from "./cards";
import { DICE } from "./battle";
import { sourcesFor } from "./play";
import { createRng, nextInt } from "./rng";
import { addBuilding, setupChoices } from "./setup";
import { dolomorActivate, dolomorStrike } from "./tactics";
import { tileIndex } from "./world";
import type { Action, BattleSide, KinState } from "./types";

// Battle decision steps: the reaction queue (Dorhor, Iherat, Bulu, Relic Seekers, Taahira, Dolomor Darkeye) and Liangzhuge's prediction.

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
  return state;
}

const HOME = tileIndex(6, 10);
const NEXT = tileIndex(6, 11);

// p1 has an army on HOME and one activation card to tap; p2 has an army on NEXT. Every character is tapped.
function war(seed = 1): KinState {
  const state = playing();
  state.rng = createRng(seed);
  state.buildings = [];
  state.armies = [{ id: "a1", owner: "p1", tile: HOME, strength: 3 }, { id: "a2", owner: "p2", tile: NEXT, strength: 2 }];
  for (const tile of state.tiles) tile.terrain = "plains";
  state.world!.rivers = {};
  for (const card of Object.values(state.cards)) card.tapped = true;
  state.items = state.items.filter(item => !item.zone.startsWith("court:"));
  addItem(state, "activation-control", "court:p1", "p1");
  state.play!.phase = "control";
  state.play!.turn = "p1";
  state.play!.passes = 0;
  return state;
}

function own(state: KinState, id: string, player: string) {
  state.cards[id] ??= { id, def: id, owner: player, zone: `court:${player}`, tapped: false } as never;
  Object.assign(state.cards[id], { owner: player, zone: `court:${player}`, tapped: false, hostageOf: undefined });
}

function third(state: KinState) {
  state.order.push("p3");
  state.players.p3 = { id: "p3", username: "p3", connected: true, resources: {} };
}

const attackWith = (state: KinState, id: string | null, dice: Record<string, number> | string | null = null, extra: Record<string, unknown> = {}) => {
  const general = sourcesFor(state, "p1", "control").find(candidate => candidate.id === (id ?? candidate.id))!;
  const pool = general.power + 3;
  return act("battle", "p1", { kind: general.kind, card: general.id, army: "a1", tile: NEXT, dice: typeof dice === "string" ? { [dice]: pool } : dice ?? { strategic: pool }, ...extra });
};
const respond = (state: KinState, extra: Record<string, unknown> = { dice: { strategic: 2 } }) => dispatch(state, act("battleRespond", "p2", extra));
const answer = (state: KinState, who: string, ...choices: string[]) => dispatch(state, act("reactionRespond", who, { choices }));
const reaction = (state: KinState) => state.play!.reactions?.[0];
const finished = (state: KinState) => state.play!.battle === null && !!state.play!.report && (state.play!.reactions ?? []).length === 0;

const totals = (side: BattleSide) => {
  const sum = { hits: 0, blocks: 0, selfHits: 0, ambush: 0 };
  for (const die of side.dice) {
    const face = DICE[die.kind][die.face - 1];
    sum.hits += face.hits ?? 0;
    sum.blocks += face.blocks ?? 0;
    sum.selfHits += face.self ?? 0;
    sum.ambush += face.ambush ?? 0;
  }
  return sum;
};

test("Dorhor of Norvador: after seeing the dice the attacker picks up to 3 of them to reroll", () => {
  const state = war();
  own(state, "dorhor-of-norvador", "p1");
  assert.equal(dispatch(state, attackWith(state, "dorhor-of-norvador")), null);
  assert.equal(respond(state), null);
  // The battle waits with rolled dice for the attacker's decision.
  const waiting = reaction(state)!;
  assert.equal(waiting.kind, "dorhor");
  assert.equal(waiting.owner, "p1");
  assert.equal(waiting.max, 3);
  assert.equal(state.play!.battle!.round!.stage, "dice");
  const dice = state.play!.battle!.round!.report.attacker.dice.map(die => ({ ...die }));
  assert.equal(waiting.options.length, dice.length);
  assert.equal(finished(state), false);
  assert.notEqual(dispatch(state, act("pass", "p1")), null);
  assert.match(answer(state, "p2", "0") ?? "", /not yours/);
  assert.match(answer(state, "p1", "0", "1", "2", "3") ?? "", /between 0 and 3/);
  assert.match(answer(state, "p1", "9") ?? "", /valid/);
  assert.equal(answer(state, "p1", "0", "1"), null);
  assert.ok(finished(state));
  const side = state.play!.report!.attacker;
  assert.equal(side.dice.length, dice.length);
  assert.deepEqual(side.dice.slice(2), dice.slice(2));
  assert.deepEqual({ hits: side.hits, blocks: side.blocks, selfHits: side.selfHits, ambush: side.ambush }, totals(side));
  assert.equal(state.play!.turn, "p2");
});

test("Dorhor of Norvador: declining keeps the dice, and other generals get no decision", () => {
  const state = war();
  own(state, "dorhor-of-norvador", "p1");
  dispatch(state, attackWith(state, "dorhor-of-norvador"));
  respond(state);
  const dice = state.play!.battle!.round!.report.attacker.dice.map(die => ({ ...die }));
  assert.equal(answer(state, "p1"), null);
  assert.deepEqual(state.play!.report!.attacker.dice, dice);
  const plain = war();
  dispatch(plain, attackWith(plain, null));
  assert.equal(respond(plain), null);
  assert.ok(finished(plain));
});

test("Dorhor of Norvador: the old reroll before the roll is gone", () => {
  const state = war();
  own(state, "dorhor-of-norvador", "p1");
  dispatch(state, attackWith(state, "dorhor-of-norvador", null, { reroll: 2 }));
  assert.equal("reroll" in state.play!.battle!, false);
});

test("Iherat: anyone, also a non-participant, adds 2 ambush dice to one side before the dice are resolved", () => {
  const state = war();
  third(state);
  own(state, "iherat", "p3");
  state.players.p3.resources.mana = 5;
  dispatch(state, attackWith(state, null));
  assert.equal(respond(state), null);
  const waiting = reaction(state)!;
  assert.equal(waiting.kind, "iherat");
  assert.equal(waiting.owner, "p3");
  assert.equal(state.play!.battle!.round!.stage, "dice");
  assert.deepEqual(waiting.options.map(option => option.id), ["attacker", "defender"]);
  assert.match(answer(state, "p1", "attacker") ?? "", /not yours/);
  assert.equal(answer(state, "p3", "defender"), null);
  assert.ok(finished(state));
  const { attacker, defender } = state.play!.report!;
  assert.equal(state.players.p3.resources.mana, 0);
  assert.equal(state.cards.iherat.tapped, true);
  assert.equal(defender.dice.length, 4);
  assert.deepEqual(defender.dice.slice(2).map(die => die.kind), ["ambush", "ambush"]);
  assert.equal(attacker.dice.length, 4);
  // The ambush dice count in full: their hits and blocks are in the outcome that gets resolved.
  assert.deepEqual({ hits: defender.hits, blocks: defender.blocks, selfHits: defender.selfHits, ambush: defender.ambush }, totals(defender));
  assert.equal(attacker.unblocked, Math.max(0, defender.hits + attacker.selfHits - attacker.blocks));
});

test("Iherat is only offered with 5 mana and untapped, and can be declined", () => {
  const poor = war();
  third(poor);
  own(poor, "iherat", "p3");
  poor.players.p3.resources.mana = 4;
  dispatch(poor, attackWith(poor, null));
  assert.equal(respond(poor), null);
  assert.ok(finished(poor));

  const state = war();
  own(state, "iherat", "p2");
  state.players.p2.resources.mana = 5;
  dispatch(state, attackWith(state, null));
  assert.equal(respond(state), null);
  assert.equal(reaction(state)!.owner, "p2");
  assert.equal(answer(state, "p2"), null);
  assert.ok(finished(state));
  assert.equal(state.players.p2.resources.mana, 5);
  assert.equal(state.cards.iherat.tapped, false);
  assert.equal(state.play!.report!.defender.dice.length, 2);
});

test("Bulu (Disloyal): the owner chooses to pay 1 influence or lose him, once unblocked hits reached his army", () => {
  const withAggressive = (seed: number) => {
    const state = war(seed);
    addItem(state, "aggresive-combat", "court:p1", "p1");
    own(state, "bulu", "p1");
    state.players.p1.resources.influence = 1;
    const power = sourcesFor(state, "p1", "control").find(candidate => candidate.id === "bulu")!.power;
    dispatch(state, attackWith(state, "bulu", { aggressive: power + 3 }));
    respond(state);
    return state;
  };
  let paid = 0;
  let left = 0;
  for (let seed = 1; seed <= 200 && (paid === 0 || left === 0); seed++) {
    const state = withAggressive(seed);
    if (reaction(state)?.kind !== "bulu") continue;
    // The damage is done, the ambush has not happened yet.
    assert.equal(reaction(state)!.owner, "p1");
    assert.equal(state.play!.battle!.round!.stage, "ambush");
    assert.ok(state.play!.battle!.round!.report.attacker.unblocked >= 1);
    assert.match(answer(state, "p2", "pay") ?? "", /not yours/);
    assert.match(answer(state, "p1") ?? "", /Choose 1/);
    if (paid === 0) {
      assert.equal(answer(state, "p1", "pay"), null);
      assert.equal(state.players.p1.resources.influence, 0);
      assert.equal(state.cards.bulu.owner, "p1");
      paid++;
    } else {
      assert.equal(answer(state, "p1", "leave"), null);
      assert.equal(state.players.p1.resources.influence, 1);
      assert.equal(state.cards.bulu.owner, "p2");
      assert.equal(state.cards.bulu.zone, "court:p2");
      assert.equal(state.cards.bulu.hostageOf, undefined);
      left++;
    }
    assert.ok(finished(state));
  }
  assert.ok(paid === 1 && left === 1);
});

test("Bulu joins the opponent at once when his owner has no influence to pay with", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const state = war(seed);
    addItem(state, "aggresive-combat", "court:p1", "p1");
    own(state, "bulu", "p1");
    const power = sourcesFor(state, "p1", "control").find(candidate => candidate.id === "bulu")!.power;
    dispatch(state, attackWith(state, "bulu", { aggressive: power + 3 }));
    respond(state);
    assert.equal(reaction(state), undefined);
    if (state.play!.report!.attacker.unblocked >= 1) {
      assert.equal(state.cards.bulu.owner, "p2");
      return;
    }
  }
  assert.fail("no battle with unblocked hits against Bulu");
});

test("Bulu as the defending general: the defender decides", () => {
  for (let seed = 1; seed <= 200; seed++) {
    const state = war(seed);
    addItem(state, "aggresive-combat", "court:p1", "p1");
    own(state, "bulu", "p2");
    state.players.p2.resources.influence = 2;
    dispatch(state, attackWith(state, null, "aggressive"));
    const power = sourcesFor(state, "p2", "control").find(candidate => candidate.id === "bulu")!.power;
    respond(state, { general: "bulu", dice: { strategic: power + 2 } });
    if (reaction(state)?.kind !== "bulu") continue;
    assert.equal(reaction(state)!.owner, "p2");
    assert.equal(answer(state, "p2", "leave"), null);
    assert.equal(state.cards.bulu.owner, "p1");
    return;
  }
  assert.fail("no battle with unblocked hits against Bulu");
});

test("Liangzhuge: a prediction of the hits the opponent rolls blocks them, but not the own self hits", () => {
  const run = (seed: number, predict?: number) => {
    const state = war(seed);
    addItem(state, "aggresive-combat", "court:p1", "p1");
    addItem(state, "aggresive-combat", "court:p2", "p2");
    own(state, "liangzhuge", "p1");
    state.players.p1.resources.influence = 1;
    const power = sourcesFor(state, "p1", "control").find(candidate => candidate.id === "liangzhuge")!.power;
    assert.equal(dispatch(state, attackWith(state, "liangzhuge", { aggressive: power + 3 }, predict === undefined ? {} : { predict })), null);
    assert.equal(respond(state, { dice: { aggressive: 2 } }), null);
    return state;
  };
  for (let seed = 1; seed <= 20; seed++) {
    const base = run(seed).play!.report!;
    if (base.defender.hits === 0 || base.attacker.selfHits === 0) continue;
    const right = run(seed, base.defender.hits);
    const { attacker } = right.play!.report!;
    assert.equal(right.players.p1.resources.influence, 0);
    assert.equal(attacker.unblocked, Math.max(0, attacker.selfHits - attacker.blocks));
    assert.ok(attacker.unblocked < base.attacker.unblocked);
    const wrong = run(seed, base.defender.hits + 1).play!.report!;
    assert.equal(wrong.attacker.unblocked, base.attacker.unblocked);
    // Hits that count are the rolled hits of the opponent, not their self hits.
    const other = run(seed, base.defender.hits + base.defender.selfHits + 1).play!.report!;
    assert.equal(other.attacker.unblocked, base.attacker.unblocked);
    return;
  }
  assert.fail("no suitable seed");
});

test("Dolomor Darkeye: after winning, the player chooses one of the opponent's hidden subterfuge cards to activate", () => {
  let activated = 0;
  let skipped = 0;
  for (let seed = 1; seed <= 300 && (activated < 2 || skipped < 1); seed++) {
    const state = war(seed);
    addItem(state, "aggresive-combat", "court:p1", "p1");
    own(state, "dolomor-darkeye", "p1");
    state.subterfuge = { deck: [], discard: [], hands: { p2: ["bank-heist", "retaliation"] } };
    state.players.p2.resources.gold = 5;
    state.players.p1.resources.gold = 0;
    const power = sourcesFor(state, "p1", "control").find(candidate => candidate.id === "dolomor-darkeye")!.power;
    dispatch(state, attackWith(state, "dolomor-darkeye", { aggressive: power + 3 }));
    assert.equal(respond(state), null);
    const { attacker, defender } = state.play!.report ?? state.play!.battle!.round!.report;
    if (reaction(state)?.kind !== "dolomor") {
      assert.ok(finished(state));
      assert.ok(defender.unblocked <= attacker.unblocked);
      skipped++;
      continue;
    }
    assert.ok(defender.unblocked > attacker.unblocked);
    assert.equal(state.play!.battle!.round!.stage, "after");
    const options = reaction(state)!;
    assert.equal(options.owner, "p1");
    assert.deepEqual(options.options.map(option => option.label), ["Hidden card 1", "Hidden card 2"]);
    assert.match(answer(state, "p2", "0") ?? "", /not yours/);
    if (activated === 0) {
      assert.equal(answer(state, "p1", "0"), null);
      assert.equal(state.players.p1.resources.gold, 5);
      assert.equal(state.players.p2.resources.gold, 0);
      assert.deepEqual(state.subterfuge!.hands.p2, ["retaliation"]);
      assert.deepEqual(state.subterfuge!.discard, ["bank-heist"]);
    } else {
      assert.equal(answer(state, "p1", "1"), null);
      assert.equal(state.players.p2.resources.gold, 5);
      assert.deepEqual(state.subterfuge!.hands.p2, ["bank-heist"]);
      assert.deepEqual(state.subterfuge!.discard, ["retaliation"]);
    }
    assert.ok(finished(state));
    activated++;
  }
  assert.ok(activated === 2 && skipped >= 1);
});

test("Dolomor Darkeye: declining keeps the cards, and the Veil of the Deep or an empty hand gives no choice", () => {
  const fight = (setup: (state: KinState) => void) => {
    for (let seed = 1; seed <= 300; seed++) {
      const state = war(seed);
      addItem(state, "aggresive-combat", "court:p1", "p1");
      own(state, "dolomor-darkeye", "p1");
      state.subterfuge = { deck: [], discard: [], hands: { p2: ["bank-heist"] } };
      setup(state);
      const power = sourcesFor(state, "p1", "control").find(candidate => candidate.id === "dolomor-darkeye")!.power;
      dispatch(state, attackWith(state, "dolomor-darkeye", { aggressive: power + 3 }));
      respond(state);
      const report = state.play!.report ?? state.play!.battle!.round!.report;
      if (report.defender.unblocked > report.attacker.unblocked) return state;
    }
    throw new Error("no won battle");
  };
  const plain = fight(() => undefined);
  assert.equal(reaction(plain)!.kind, "dolomor");
  assert.equal(answer(plain, "p1"), null);
  assert.deepEqual(plain.subterfuge!.hands.p2, ["bank-heist"]);
  assert.ok(finished(plain));
  const veiled = fight(state => addItem(state, "veil-of-the-deep", "court:p2", "p2"));
  assert.ok(finished(veiled));
  assert.deepEqual(veiled.subterfuge!.hands.p2, ["bank-heist"]);
  const empty = fight(state => { state.subterfuge!.hands.p2 = []; });
  assert.ok(finished(empty));
});

test("Dolomor Darkeye on Counterattack lets the player pick an opposing army that loses 3 strength; Retaliation has no effect", () => {
  const state = war();
  state.subterfuge = { deck: [], discard: [], hands: { p2: ["counterattack"] } };
  const next = dolomorActivate(state, "p1", "p2", 0)!;
  assert.equal(next.kind, "dolomor-army");
  assert.equal(next.owner, "p1");
  assert.deepEqual(next.options.map(option => option.id), ["a2"]);
  assert.deepEqual(state.subterfuge.hands.p2, []);
  dolomorStrike(state, "a2");
  assert.equal(state.armies.some(army => army.id === "a2"), false);
  state.subterfuge.hands.p2 = ["retaliation"];
  assert.equal(dolomorActivate(state, "p1", "p2", 0), null);
  assert.deepEqual(state.subterfuge.hands.p2, []);
});

test("Taahira (The Great Hunt): once the tile is cleared the player picks the tile to move to, or declines", () => {
  const hunt = (seed: number) => {
    const state = war(seed);
    state.armies[1].strength = 1;
    third(state);
    own(state, "taahira", "p1");
    addItem(state, "virtue", "court:p1", "p1");
    addItem(state, "peace-treaty", "court:p3", "p3", "p1");
    addItem(state, "trade-treaty", "court:p3", "p3", "p1");
    dispatch(state, attackWith(state, "taahira"));
    assert.equal(respond(state, { dice: { strategic: 1 } }), null);
    return state;
  };
  let moved = 0;
  let stayed = 0;
  for (let seed = 1; seed <= 100 && (moved === 0 || stayed === 0); seed++) {
    const state = hunt(seed);
    if (reaction(state)?.kind !== "taahira") continue;
    const waiting = reaction(state)!;
    assert.equal(waiting.owner, "p1");
    assert.equal(state.play!.battle!.round!.stage, "after");
    assert.equal(state.cards.taahira.tapped, true);
    assert.ok(waiting.options.length > 0);
    assert.match(answer(state, "p1", "-5") ?? "", /valid/);
    if (moved === 0) {
      const tile = waiting.options[waiting.options.length - 1].id;
      assert.equal(answer(state, "p1", tile), null);
      assert.equal(state.armies.find(army => army.id === "a1")!.tile, Number(tile));
      assert.equal(state.cards.taahira.tapped, false);
      moved++;
    } else {
      assert.equal(answer(state, "p1"), null);
      assert.equal(state.armies.find(army => army.id === "a1")!.tile, HOME);
      assert.equal(state.cards.taahira.tapped, true);
      stayed++;
    }
    assert.ok(finished(state));
  }
  assert.ok(moved === 1 && stayed === 1);
});

test("Relic Seekers: the attacker decides before the ambush whether to steal a relic", () => {
  let stole = 0;
  let declined = 0;
  for (let seed = 1; seed <= 300 && (stole === 0 || declined === 0); seed++) {
    const state = war(seed);
    addItem(state, "ambush-combat", "court:p1", "p1");
    addItem(state, "relic-seekers", "court:p1", "p1");
    state.players.p2.resources.relic = 1;
    state.players.p1.resources.relic = 0;
    dispatch(state, attackWith(state, null, "ambush"));
    respond(state);
    if (reaction(state)?.kind !== "steal") continue;
    assert.equal(reaction(state)!.owner, "p1");
    assert.equal(state.play!.battle!.round!.stage, "ambush");
    assert.match(answer(state, "p2", "steal") ?? "", /not yours/);
    if (stole === 0) {
      assert.equal(answer(state, "p1", "steal"), null);
      assert.equal(state.players.p1.resources.relic, 1);
      assert.equal(state.players.p2.resources.relic, 0);
      stole++;
    } else {
      assert.equal(answer(state, "p1"), null);
      assert.equal(state.players.p1.resources.relic, 0);
      assert.equal(state.players.p2.resources.relic, 1);
      declined++;
    }
    assert.ok(finished(state));
  }
  assert.ok(stole === 1 && declined === 1);
});

test("a battle with a reaction pending blocks the other actions until it is answered", () => {
  const state = war();
  own(state, "dorhor-of-norvador", "p1");
  addBuilding(state, { def: "village", owner: "p1", kind: "tile", tile: HOME });
  dispatch(state, attackWith(state, "dorhor-of-norvador"));
  respond(state);
  assert.equal(reaction(state)!.kind, "dorhor");
  assert.notEqual(dispatch(state, act("pass", "p1")), null);
  assert.notEqual(dispatch(state, act("battleRespond", "p2", { dice: { strategic: 2 } })), null);
  assert.equal(answer(state, "p1"), null);
  assert.ok(finished(state));
  assert.match(answer(state, "p1") ?? "", /Nothing/);
});
