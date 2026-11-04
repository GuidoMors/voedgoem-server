const TERRAIN = new Set(["ocean", "mountain", "forest", "farmland", "plains", "snow", "desert"]);
const BUILDING_COLUMNS = ["Step", "Building", "Location", "Terrain", "Adjacent terrain", "River", "Minimum distance", "Road to", "Road length", "Dedication", "Placement"];

export function parseStartingSetup(lines, source, blueprints) {
  const fail = message => { throw new Error(`${source}: Starting setup: ${message}`); };
  const tables = new Map();
  let table;
  for (const line of lines) {
    if (!line.trim().startsWith("|")) { table = undefined; continue; }
    const cells = line.trim().replace(/^\||\|$/g, "").split("|").map(cell => cell.trim());
    if (cells.every(cell => /^:?-{2,}:?$/.test(cell))) continue;
    if (!table) {
      if (tables.has(cells[0])) fail(`duplicate ${cells[0]} table`);
      table = { columns: cells, rows: [] };
      tables.set(cells[0], table);
    } else {
      if (cells.length !== table.columns.length) fail(`expected ${table.columns.length} cells in ${cells.join(" | ")}`);
      table.rows.push(cells);
    }
  }
  const rows = (name, columns, required) => {
    const found = tables.get(name);
    if (!found) {
      if (required) fail(`missing ${name} table`);
      return [];
    }
    if (found.columns.join("|") !== columns.join("|")) fail(`expected columns: ${columns.join(" | ")}`);
    return found.rows;
  };
  for (const name of tables.keys()) if (!["Step", "Army count", "Extra"].includes(name)) fail(`unknown table ${name}`);
  const number = (value, label, min = 0) => {
    if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < min) fail(`${label} must be an integer >= ${min}, got "${value}"`);
    return Number(value);
  };
  const yesNo = (value, label) => {
    if (!["yes", "no"].includes(value)) fail(`${label} must be yes or no, got "${value}"`);
    return value === "yes";
  };
  const terrains = value => {
    const list = value === "-" ? [] : value.split(",").map(entry => entry.trim());
    for (const terrain of list) if (!TERRAIN.has(terrain)) fail(`unknown terrain "${terrain}"`);
    return list;
  };
  const buildings = [];
  for (const row of rows("Step", BUILDING_COLUMNS, true)) {
    const [step, building, location, terrain, adjacentTerrain, river, minDistance, roadTo, roadLength, dedication, placement] = row;
    if (!/^[a-z][a-z0-9-]*$/.test(step) || ["world", "ark-board"].includes(step) || buildings.some(entry => entry.step === step)) fail(`invalid or duplicate step "${step}"`);
    const blueprint = blueprints.find(card => card.id === building);
    if (!blueprint) fail(`unknown building "${building}"`);
    const world = location === "world";
    if (!(world ? ["⬢", "◼"] : ["⨺"]).includes(blueprint.stats.shape)) fail(`${step}: building shape does not fit location "${location}"`);
    if (!["choose", "automatic"].includes(placement)) fail(`${step}: placement must be choose or automatic`);
    const host = buildings.find(entry => entry.step === location);
    if (!world && (location === "ark-board" ? !buildings.some(entry => entry.building === "the-ark") : !host || host.location !== "world")) fail(`${step}: location must reference an earlier world step or an existing ark-board`);
    const entry = {
      step, building, location, terrain: terrains(terrain), adjacentTerrain: terrains(adjacentTerrain),
      river: yesNo(river, "River"), minDistance: number(minDistance, "Minimum distance"),
      roadTo: roadTo === "-" ? null : roadTo, roadLength: number(roadLength, "Road length"),
      dedication: yesNo(dedication, "Dedication"), placement
    };
    if (world && entry.terrain.length === 0) fail(`${step}: world buildings need Terrain`);
    if (!world && (entry.terrain.length || entry.river || entry.minDistance || entry.roadTo || entry.roadLength || entry.dedication)) fail(`${step}: world-only rules cannot be used on a slice building`);
    if ((world || location === "ark-board") && entry.adjacentTerrain.length) fail(`${step}: Adjacent terrain requires a world-hosted slice`);
    if (entry.dedication && (building !== "village" || placement !== "choose")) fail(`${step}: Dedication requires a chosen village`);
    if (entry.roadTo && !buildings.some(other => other.step === entry.roadTo && other.location === "world")) fail(`${step}: Road to must reference an earlier world step`);
    if (!!entry.roadTo !== (entry.roadLength > 0)) fail(`${step}: Road to and positive Road length must be provided together`);
    buildings.push(entry);
  }
  if (!buildings.length) fail("at least one building step is required");
  const armies = rows("Army count", ["Army count", "Strength", "Location"], true).map(([count, strength, location]) => {
    if (!buildings.some(entry => entry.step === location && entry.location === "world")) fail(`army location "${location}" must reference a world step`);
    return { count: number(count, "Army count"), strength: number(strength, "Strength", 1), location };
  });
  let otherFactionTreaties = false;
  const extras = new Set();
  for (const [extra, enabled] of rows("Extra", ["Extra", "Enabled"], false)) {
    if (extra !== "other-faction-treaties" || extras.has(extra)) fail(`unknown or duplicate extra "${extra}"`);
    extras.add(extra);
    otherFactionTreaties = yesNo(enabled, extra);
  }
  return { buildings, armies, otherFactionTreaties };
}
