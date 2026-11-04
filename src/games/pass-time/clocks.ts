export type PassTimeRule =
  | { id: string; type: "clock-two-cards" | "no-hint" | "nothing" | "most" | "draw" }
  | { id: string; type: "no-number"; value: number }
  | { id: string; type: "sum-near"; value: number }
  | { id: string; type: "composition"; black: number; white: number }
  | { id: string; type: "card-count"; count: number }
  | { id: string; type: "turn-number"; numbers: number[] }
  | { id: string; type: "extreme-card"; color: "black" | "white"; extreme: "highest" | "lowest" }
  | { id: string; type: "rotate"; direction: "clockwise" | "counter-clockwise" };

export interface PassTimeClock {
  id: string;
  name: string;
  level: number;
  rules: PassTimeRule[][];
  globalRules?: PassTimeRule[];
}

const rule = <T extends Omit<PassTimeRule, "id">>(id: string, value: T): PassTimeRule => ({ ...value, id } as PassTimeRule);
const makeClock = (id: string, level: number, rules: Record<number, PassTimeRule[]>, name = `Level ${level} clock ${id.split("-").pop()}`, globalRules: PassTimeRule[] = []): PassTimeClock => ({
  id,
  name,
  level,
  rules: Array.from({ length: 6 }, (_, index) => rules[index + 1] ?? []),
  globalRules
});
const at = (segment: number, ...rules: PassTimeRule[]) => [segment, rules] as const;
const sum = (segment: number, value: number, id: string) => at(segment, rule(id, { type: "sum-near", value }));
const count = (segment: number, value: number, id: string) => at(segment, rule(id, { type: "card-count", count: value }));
const noN = (segment: number, value: number, id: string) => at(segment, rule(id, { type: "no-number", value }));
const composition = (segment: number, black: number, white: number, id: string) => at(segment, rule(id, { type: "composition", black, white }));
const extreme = (segment: number, color: "black" | "white", value: "highest" | "lowest", id: string) => at(segment, rule(id, { type: "extreme-card", color, extreme: value }));
const turn = (segment: number, ...numbers: number[]) => at(segment, rule(`turn-${segment}-${numbers.join("-")}`, { type: "turn-number", numbers }));
const rotate = (segment: number, direction: "clockwise" | "counter-clockwise") => at(segment, rule(`rotate-${segment}`, { type: "rotate", direction }));
const draw = (segment: number) => at(segment, rule(`draw-${segment}`, { type: "draw" }));
const simpleClock = (id: string, level: number, entries: readonly (readonly [number, PassTimeRule[]])[], name?: string, globalRules: PassTimeRule[] = []) =>
  makeClock(id, level, Object.fromEntries(entries), name, globalRules);

export const STARTER_CLOCKS: PassTimeClock[] = [
  makeClock("starter-0", 0, {}, "Level 0 · The first tick"),
  simpleClock("starter-1a", 1, [sum(1, 6, "sum-1a-1"), composition(4, 1, 1, "composition-1a-4")], "Level 1 · Mixed measures"),
  simpleClock("starter-1b", 1, [sum(3, 9, "sum-1b-3"), count(4, 3, "count-1b-4")], "Level 1 · Three of a kind"),
  simpleClock("starter-1c", 1, [turn(2, 2), turn(3, 1), sum(6, 24, "sum-1c-6")], "Level 1 · First steps"),
  simpleClock("starter-1d", 1, [composition(1, 0, 1, "composition-1d-1"), count(2, 3, "count-1d-2")], "Level 1 · White and three"),
  simpleClock("starter-2a", 2, [noN(1, 2, "no-2a-1"), noN(3, 5, "no-2a-3"), noN(4, 8, "no-2a-4"), noN(6, 11, "no-2a-6")], "Level 2 · Keep your distance"),
  simpleClock("starter-2b", 2, [], "Level 2 · No hints", [rule("no-hint-2b", { type: "no-hint" })]),
  simpleClock("starter-2c", 2, [noN(3, 8, "no-2c-3"), noN(4, 8, "no-2c-4")], "Level 2 · The twin eights"),
  simpleClock("starter-2d", 2, [noN(1, 2, "no-2d-1"), noN(2, 2, "no-2d-2"), noN(3, 2, "no-2d-3")], "Level 2 · Three is company"),
  simpleClock("starter-3a", 3, [count(2, 2, "count-3a-2"), sum(3, 6, "sum-3a-3"), extreme(4, "white", "lowest", "extreme-3a-4"), extreme(6, "black", "highest", "extreme-3a-6")], "Level 3 · Colors and counts"),
  simpleClock("starter-3b", 3, [turn(1, 1, 2), extreme(4, "black", "highest", "extreme-3b-4"), extreme(6, "white", "lowest", "extreme-3b-6")], "Level 3 · The opening pair"),
  simpleClock("starter-3c", 3, [], "Level 3 · Two each", [rule("clock-two-3c", { type: "clock-two-cards" })]),
  simpleClock("starter-4a", 4, [
    extreme(1, "black", "highest", "extreme-4a-1"),
    extreme(6, "black", "lowest", "extreme-4a-6")
  ], "Level 4 · Black clockwork", [rule("clock-two-4a", { type: "clock-two-cards" })]),
  simpleClock("starter-4b", 4, [
    composition(1, 1, 1, "composition-4b-1"),
    turn(2, 2),
    turn(5, 3),
    composition(6, 1, 1, "composition-4b-6")
  ], "Level 4 · Around the clock", [rule("clock-two-4b", { type: "clock-two-cards" })]),
  makeClock("starter-4c", 4, { 2: [rule("sum-4c-2", { type: "sum-near", value: 15 })], 4: [rule("extreme-4c-4", { type: "extreme-card", color: "white", extreme: "lowest" })] }, "Level 4 · Two and fifteen", [rule("clock-two-4c", { type: "clock-two-cards" })]),
  simpleClock("starter-5a", 5, [at(1, rule("most-5a", { type: "most" })), noN(3, 8, "no-5a-3"), noN(4, 8, "no-5a-4")], "Level 5 · Most of the time"),
  simpleClock("starter-5b", 5, [turn(1, 12), extreme(3, "white", "lowest", "extreme-5b-3"), extreme(4, "black", "lowest", "extreme-5b-4")], "Level 5 · The final card"),
  simpleClock("starter-5c", 5, [sum(6, 20, "sum-5c-6"), extreme(4, "white", "highest", "extreme-5c-4")], "Level 5 · High and low"),
  simpleClock("starter-6a", 6, [draw(2), draw(5), turn(6, 12)], "Level 6 · Early arrivals"),
  simpleClock("starter-6b", 6, [draw(1), composition(2, 2, 2, "composition-6b-2"), at(6, extreme(6, "black", "highest", "extreme-6b-6")[1][0], extreme(6, "white", "lowest", "extreme-6b-6w")[1][0])], "Level 6 · Drawn together"),
  simpleClock("starter-6c", 6, [draw(1), draw(3), draw(5)], "Level 6 · Three draws"),
  simpleClock("starter-6d", 6, [draw(1), noN(3, 8, "no-6d-3"), noN(4, 8, "no-6d-4")], "Level 6 · Draw and dodge"),
  simpleClock("starter-7a", 7, [rotate(1, "clockwise"), rotate(2, "clockwise"), rotate(5, "counter-clockwise"), rotate(6, "counter-clockwise")], "Level 7 · Turning gears"),
  simpleClock("starter-7b", 7, [rotate(2, "clockwise"), at(4, rule("nothing-7b", { type: "nothing" })), sum(6, 19, "sum-7b-6")], "Level 7 · Nothing but time")
];

export function validClock(value: unknown): value is PassTimeClock {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const clock = value as PassTimeClock;
  if (typeof clock.id !== "string" || !clock.id || clock.id.length > 80 || typeof clock.name !== "string" || !clock.name.trim() || clock.name.length > 80) return false;
  if (!Number.isInteger(clock.level) || clock.level < 0 || clock.level > 10) return false;
  if (!Array.isArray(clock.rules) || clock.rules.length !== 6) return false;
  if (clock.globalRules !== undefined && !Array.isArray(clock.globalRules)) return false;
  const ids = new Set<string>();
  let draws = 0;
  let most = 0;
  let rotationCount = 0;
  let noHintCount = 0;
  let hasNothing = false;
  for (const item of clock.globalRules ?? []) {
    if (!item || typeof item !== "object" || typeof item.id !== "string" || !item.id || ids.has(item.id)
      || (item.type !== "clock-two-cards" && item.type !== "no-hint")) return false;
    ids.add(item.id);
    if (item.type === "no-hint") noHintCount++;
  }
  for (const segment of clock.rules) {
    if (!Array.isArray(segment)) return false;
    let rotations = 0;
    for (const item of segment) {
      if (!item || typeof item !== "object" || typeof item.id !== "string" || !item.id || ids.has(item.id)) return false;
      if (item.type === "clock-two-cards" || item.type === "no-hint") return false;
      ids.add(item.id);
      switch (item.type) {
        case "nothing": case "most": case "draw":
          if (item.type === "draw") draws++;
          if (item.type === "most") most++;
          if (item.type === "nothing") hasNothing = true;
          break;
        case "no-number": case "sum-near":
          if (!Number.isInteger(item.value) || item.value < 1 || item.value > 24) return false;
          break;
        case "composition":
          if (!Number.isInteger(item.black) || !Number.isInteger(item.white) || item.black < 0 || item.white < 0 || item.black + item.white < 1 || item.black + item.white > 24) return false;
          break;
        case "card-count":
          if (!Number.isInteger(item.count) || item.count < 1 || item.count > 24) return false;
          break;
        case "turn-number":
          if (!Array.isArray(item.numbers) || item.numbers.length === 0 || item.numbers.some(number => !Number.isInteger(number) || number < 1 || number > 24)) return false;
          break;
        case "extreme-card":
          if ((item.color !== "black" && item.color !== "white") || (item.extreme !== "highest" && item.extreme !== "lowest")) return false;
          break;
        case "rotate":
          if (item.direction !== "clockwise" && item.direction !== "counter-clockwise") return false;
          rotations++;
          rotationCount++;
          break;
        default: return false;
      }
    }
    if (rotations > 1) return false;
  }
  return draws <= 12 && most <= 1 && noHintCount <= 1 && (!hasNothing || rotationCount > 0);
}

export function normalizeClock(value: PassTimeClock, id: string): PassTimeClock {
  return {
    id,
    name: value.name.trim(),
    level: value.level,
    rules: value.rules.map(segment => segment.map(item => ({ ...item }))),
    globalRules: (value.globalRules ?? []).map(item => ({ ...item }))
  };
}
