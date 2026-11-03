// Generates the card definitions of the Kin game (action, event, technology, blueprint, faction effect, treaty, ban and activation
// cards) from the rulebook, for both the server and the client. Characters and buildings have their own generators.
// Run after editing a card: node scripts/gen-cards.mjs   (reads the markdown in voedgoem/src/games/kin/rulebook)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const source = join(here, "..", "..", "voedgoem", "src", "games", "kin", "rulebook");
const outputs = [
  join(here, "..", "src", "games", "kin", "cards.data.ts"),
  join(here, "..", "..", "voedgoem", "src", "games", "kin", "cards.data.ts")
];

const KIN_FILES = {
  "12-1-kin-the-ethereal.md": "ethereal",
  "12-2-kin-dynasty-of-hanshu.md": "hanshu",
  "12-3-kin-wanderers.md": "wanderers",
  "12-4-kin-pride-of-lumon.md": "lumon",
  "12-5-kin-beastmen-tribes.md": "beastmen",
  "12-6-kin-archive-ark.md": "ark",
  "12-7-kin-hammers-of-the-ash.md": "hammers",
  "12-8-kin-seven-streams-syndicate.md": "syndicate",
  "12-9-kin-children-of-the-great-tree.md": "tree",
  "12-10-kin-deep-ones.md": "deepones"
};
// Names used in a starting setup that are not a technology of 08-technologies.md.
const TECH_ALIASES = { "election-research": "council-science" };

const slug = name => name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const read = file => readFileSync(join(source, file), "utf8").replace(/\r/g, "").split("\n");
const plain = text => text.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, a, b) => b ?? a).replace(/\*\*/g, "");

// Splits a file into sections: a heading (level 1 or 2) and the lines under it.
function sections(file) {
  const out = [];
  let current = { level: 0, head: "", body: [] };
  for (const line of read(file)) {
    const head = /^(#{1,2}) (.*)$/.exec(line);
    if (head) {
      out.push(current);
      current = { level: head[1].length, head: head[2].trim(), body: [] };
    } else current.body.push(line);
  }
  out.push(current);
  return out;
}

// "> Label: text" lines. A line without a label continues the previous field.
function fields(body) {
  const found = {};
  let last = null;
  for (const raw of body) {
    const line = raw.replace(/^>\s?/, "").trim();
    if (!line) { last = null; continue; }
    const match = /^([A-Za-z][A-Za-z' ]*?):\s*(.*)$/.exec(line);
    if (match) {
      last = match[1].toLowerCase();
      found[last] = found[last] ? `${found[last]} ${match[2]}` : match[2];
    } else if (last) found[last] += `${line.startsWith("- ") ? "\n" : " "}${line}`;
  }
  return found;
}

const tags = head => head.split("|").map(s => s.trim());
const cards = [];
const add = card => {
  if (cards.some(other => other.id === card.id)) throw new Error(`Duplicate card id ${card.id}`);
  cards.push(card);
};

// Tables with a "Technology required" column tell which cards are public at the start of the game.
function startTable(file, nameColumn, techColumn) {
  const table = new Map();
  for (const line of read(file)) {
    if (!line.startsWith("|") || /^\|\s*-/.test(line) || /Technology required/.test(line)) continue;
    const cells = line.split("|").slice(1, -1).map(s => s.trim());
    table.set(slug(cells[nameColumn]), cells[techColumn] === "");
  }
  return table;
}
const startOf = (table, name) => {
  const id = slug(name);
  if (table.has(id)) return table.get(id);
  for (const [key, value] of table) if (key.startsWith(`${id}-`)) return value;
  return false;
};

const eventStart = startTable("04-events.md", 1, 0);
for (const { level, head, body } of sections("04-events.md")) {
  const [name, tag] = tags(head);
  if (level !== 2 || tag !== "event card") continue;
  const f = fields(body);
  add({ id: slug(name), kind: "event", name, text: f["short description"] ?? "", kin: null, start: startOf(eventStart, name) });
}

const actionStart = startTable("05-actions.md", 2, 1);
for (const { level, head, body } of sections("05-actions.md")) {
  const [name, tag] = tags(head);
  if (level !== 2 || tag !== "action card") continue;
  const f = fields(body);
  add({ id: slug(name), kind: "action", name, text: f["short description"] ?? "", kin: null, phase: f.phase.toLowerCase(), start: startOf(actionStart, name) });
}

function blueprint(name, tag, f, kin) {
  const shape = tag.split("|")[0];
  return {
    id: slug(name), kind: "blueprint", name, text: "", kin,
    stats: {
      shape: shape.trim(),
      icons: (tag.split("|")[1] ?? "").split(",").map(s => s.trim()).filter(Boolean),
      cost: f["resource cost"] ?? "",
      buildPower: Number.isNaN(Number(f["build power cost"] ?? 0)) ? null : Number(f["build power cost"] ?? 0),
      garrison: Number.isNaN(Number(f.garrison ?? 0)) ? null : Number(f.garrison ?? 0),
      conditions: f["build conditions"] ?? "",
      effects: (f.effects ?? "").trim()
    }
  };
}

for (const { level, head, body } of sections("06-buildings.md")) {
  const [name, type, ...rest] = tags(head);
  if (level !== 2 || type !== "building blueprint") continue;
  add({ ...blueprint(name, rest.join("|"), fields(body), null), start: ["village", "city", "worksite", "barracks", "road"].includes(slug(name)) });
}

const startTechs = {};
for (const [file, kin] of Object.entries(KIN_FILES)) {
  let inEffects = false;
  for (const { level, head, body } of sections(file)) {
    if (level === 1) inEffects = /^Faction Effects/i.test(head);
    if (head === "Starting setup") {
      const line = body.find(l => /Claim the following technolog/i.test(l));
      const names = line ? line.replace(/^.*technologies?:\s*/i, "").replace(/\.\s*$/, "").split(",") : [];
      startTechs[kin] = names.map(n => slug(n)).map(id => TECH_ALIASES[id] ?? id);
    }
    if (level !== 2) continue;
    const [name, type, ...rest] = tags(head);
    if (type === "building blueprint") {
      add({ ...blueprint(name, rest.join("|"), fields(body), kin), start: false });
      continue;
    }
    if (!inEffects) continue;
    const f = fields(body);
    const kind = type === "action card" || type === "event card" ? type.split(" ")[0] : "passive";
    add({
      id: slug(name), kind: "faction", name, text: f["short description"] ?? "", kin, form: kind,
      core: tags(head).slice(1).some(t => /core/i.test(t)),
      ...(kind === "action" ? { phase: (f.phase ?? "").toLowerCase() } : {})
    });
  }
}

// Technologies. Their "Cards:" line lists the cards that are claimed with them.
const activationCards = new Map();
function parseGrants(text) {
  if (/activation card/i.test(text)) {
    const archetype = /(Discovery|Expansion|Control|Universal)/i.exec(plain(text))[1].toLowerCase();
    const power = Number(/power\s*(\d+)/i.exec(plain(text))[1]);
    const id = `activation-${archetype}`;
    activationCards.set(id, { archetype, power });
    return [id];
  }
  return plain(text).split(",").map(part => {
    const match = /^\s*(.+?)\s+(?:event card|action card|building blueprint)\.?\s*$/.exec(part);
    if (!match) throw new Error(`Cannot read the cards "${part}"`);
    return slug(match[1]);
  });
}

for (const { level, head, body } of sections("08-technologies.md")) {
  const [name, tag] = tags(head);
  if (level !== 2 || tag !== "technology card") continue;
  const f = fields(body);
  add({ id: slug(name), kind: "technology", name, text: f.effect ?? "", kin: null, gearCost: Number(f["gear cost"]), grants: f.cards ? parseGrants(f.cards) : [] });
}

for (const [id, { archetype, power }] of activationCards) {
  const label = archetype[0].toUpperCase() + archetype.slice(1);
  add({ id, kind: "activation", name: `${label} Activation Card`, kin: null, archetype, power, text: `Counts as a ${archetype} character of power ${power}: tap it to activate an action card of its archetype.` });
}

// Treaties and bans keep their labelled rules.
const LABELS = ["before barter offer", "condition", "effect", "breaking", "penalty for breaking", "extra rules"];
let part = "";
for (const { level, head, body } of sections("10-treaties.md")) {
  if (level === 1) { part = head; continue; }
  const kind = part === "Bans" ? "ban" : "treaty";
  if (level !== 2) continue;
  const f = fields(body);
  const lines = LABELS.filter(label => f[label]).map(label => [label[0].toUpperCase() + label.slice(1), plain(f[label])]);
  add({ id: slug(head), kind, name: head, text: "", kin: null, lines });
}

const ids = new Set(cards.map(c => c.id));
for (const card of cards) for (const grant of card.grants ?? []) if (!ids.has(grant)) throw new Error(`${card.id} grants unknown card ${grant}`);
for (const [kin, list] of Object.entries(startTechs)) for (const id of list) if (!ids.has(id)) throw new Error(`${kin} starts with unknown technology ${id}`);

const body = `// Generated by voedgoem-server/scripts/gen-cards.mjs from the rulebook. Do not edit by hand.
export type CardKind = "action" | "event" | "technology" | "blueprint" | "faction" | "treaty" | "ban" | "activation";
export type CardPhase = "discovery" | "expansion" | "control";
export type CardArchetype = "discovery" | "expansion" | "control" | "universal";

export interface CardDef {
  id: string;
  kind: CardKind;
  name: string;
  // The short description or ruletext shown on the card.
  text: string;
  // Kin id for a faction effect or faction building, or null.
  kin: string | null;
  // Action cards, and faction effects that are action cards: the phase they are activated in.
  phase?: CardPhase;
  // Public cards that begin on the building board or the phase board.
  start?: boolean;
  // Faction effects: a passive ability, or an action or event card.
  form?: "passive" | "action" | "event";
  core?: boolean;
  gearCost?: number;
  // Cards claimed together with a technology.
  grants?: string[];
  archetype?: CardArchetype;
  power?: number;
  stats?: { shape: string; icons: string[]; cost: string; buildPower: number | null; garrison: number | null; conditions: string; effects: string };
  // Treaties and bans: the labelled rules.
  lines?: [string, string][];
}

export const CARDS: readonly CardDef[] = ${JSON.stringify(cards, null, 2)};

// Kin id -> technologies claimed in the starting setup.
export const START_TECHS: Record<string, string[]> = ${JSON.stringify(startTechs, null, 2)};

export const cardById = (id: string) => CARDS.find(card => card.id === id);
`;
for (const out of outputs) writeFileSync(out, body);
const count = Object.groupBy ? Object.entries(Object.groupBy(cards, c => c.kind)).map(([k, v]) => `${v.length} ${k}`).join(", ") : String(cards.length);
console.log(`${cards.length} cards written (${count}).`);
