import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { CARDS, START_SETUPS } from "../src/games/kin/cards.data.ts";
import { parseStartingSetup } from "./kin-setup.mjs";

const directory = new URL("../../voedgoem/src/games/kin/rulebook/", import.meta.url);
const blueprints = CARDS.filter(card => card.kind === "blueprint");
const sections = readdirSync(directory).filter(file => /^12-[1-9]\d*-kin-/.test(file)).map(file => {
  const text = readFileSync(new URL(file, directory), "utf8").replace(/\r/g, "");
  const section = text.split(/^#{1,2} Starting setup\s*$/m)[1]?.split(/^#{1,2} /m)[0];
  assert.ok(section, `${file} needs a Starting setup section`);
  assert.ok(section.includes("// Each faction also claims their faction effect cards, faction building blueprint."), file);
  return { file, section };
});
const source = sections.find(entry => entry.file.includes("kin-the-ethereal")).section;
const parse = text => parseStartingSetup(text.split("\n"), "test.md", blueprints);

test("all ten Markdown setups match their generated runtime definitions", () => {
  assert.equal(sections.length, 10);
  const actual = sections.map(({ section }) => parse(section));
  assert.deepEqual(actual.map(value => JSON.stringify(value)).sort(), Object.values(START_SETUPS).map(value => JSON.stringify(value)).sort());
});

test("editing Markdown changes terrain, placement, armies and extras", () => {
  const edited = source
    .replace("| plains, snow |", "| desert |")
    .replace("| no | 3 |", "| yes | 4 |")
    .replace("| 1 | 1 | village |", "| 2 | 4 | village |")
    .replace("| other-faction-treaties | yes |", "| other-faction-treaties | no |");
  const result = parse(edited);
  assert.deepEqual(result.buildings[0].terrain, ["desert"]);
  assert.equal(result.buildings[0].river, true);
  assert.equal(result.buildings[0].minDistance, 4);
  assert.deepEqual(result.armies, [{ count: 2, strength: 4, location: "village" }]);
  assert.equal(result.otherFactionTreaties, false);
  const ark = sections.find(entry => entry.file.includes("kin-archive-ark")).section;
  const moved = parse(ark.replace("| worksite | worksite | ark-board |", "| worksite | worksite | ark |"));
  assert.equal(moved.buildings[1].location, "ark");
  assert.equal(moved.buildings[1].placement, "automatic");
});

test("invalid setup edits fail with the source and a useful error", () => {
  for (const [from, to, error] of [
    ["| plains, snow |", "| tundra |", /unknown terrain/],
    ["| no | 3 |", "| maybe | 3 |", /River must be yes or no/],
    ["| no | 3 |", "| no | -1 |", /Minimum distance/],
    ["| worksite | worksite | village |", "| worksite | worksite | missing |", /location must reference/],
    ["| village | village | world |", "| village | missing | world |", /unknown building/],
    ["| village | village | world |", "| village | worksite | world |", /shape does not fit/],
    ["| university | university |", "| worksite | university |", /duplicate step/],
    ["| 1 | 1 | village |", "| 1 | 0 | village |", /Strength/],
    ["| 1 | 1 | village |", "| 1 | 1 | worksite |", /army location/],
    ["| Minimum distance |", "| Minimum gap |", /expected columns/],
    ["| no | choose |", "| no | random |", /placement/],
    ["| other-faction-treaties |", "| unknown-extra |", /unknown or duplicate extra/]
  ]) {
    assert.throws(() => parse(source.replace(from, to)), error);
    assert.throws(() => parse(source.replace(from, to)), /test\.md: Starting setup:/);
  }
});
