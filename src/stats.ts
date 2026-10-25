// Per-game statistics, computed from the "gameResults" table (one row per player per finished game).
// Columns: role, won, flag, score, extra. Each game decides what flag/score/extra mean:
//   codenames: flag = guessed the black card
//   tetris:    score = player's (or team's) final score, extra = lines cleared
//   thirtyone: score = the player's team score
//   saboteur:  nothing extra
// Every sql expression is an aggregate over the rows of one player.

export interface StatDef {
  key: string;
  label: string;
  format: "number" | "percent";
  sql: string;
}

const rate = (condition: string, of: string) =>
  `ROUND(100.0 * SUM(CASE WHEN ${condition} THEN "won" ELSE 0 END) / NULLIF(SUM(CASE WHEN ${of} THEN 1 ELSE 0 END), 0))`;

const games: StatDef = { key: "games", label: "Games played", format: "number", sql: "COUNT(*)" };
const winRate: StatDef = { key: "winRate", label: "Win rate", format: "percent", sql: rate("1", "1") };

export const GAME_STATS: Record<string, StatDef[]> = {
  codenames: [
    games,
    winRate,
    { key: "operativeRate", label: "Win rate as operative", format: "percent", sql: rate(`"role" = 'operative'`, `"role" = 'operative'`) },
    { key: "spymasterRate", label: "Win rate as spymaster", format: "percent", sql: rate(`"role" = 'spymaster'`, `"role" = 'spymaster'`) },
    { key: "blackCard", label: "Times guessed the black card", format: "number", sql: `SUM("flag")` }
  ],
  tetris: [
    games,
    winRate,
    { key: "bestScore", label: "Best score", format: "number", sql: `MAX("score")` },
    { key: "avgScore", label: "Average score", format: "number", sql: `ROUND(AVG("score"))` },
    { key: "lines", label: "Lines cleared", format: "number", sql: `SUM("extra")` },
    { key: "teamRate", label: "Win rate in teams", format: "percent", sql: rate(`"role" = 'team'`, `"role" = 'team'`) }
  ],
  thirtyone: [
    games,
    winRate,
    { key: "captainRate", label: "Win rate as captain", format: "percent", sql: rate(`"role" = 'captain'`, `"role" = 'captain'`) },
    { key: "playerRate", label: "Win rate as player", format: "percent", sql: rate(`"role" = 'player'`, `"role" = 'player'`) },
    { key: "avgPoints", label: "Average team points", format: "number", sql: `ROUND(AVG("score"))` }
  ],
  saboteur: [
    games,
    winRate,
    { key: "saboteurRate", label: "Win rate as saboteur", format: "percent", sql: rate(`"role" = 'saboteur'`, `"role" = 'saboteur'`) },
    { key: "explorerRate", label: "Win rate as explorer", format: "percent", sql: rate(`"role" = 'explorer'`, `"role" = 'explorer'`) },
    { key: "saboteurGames", label: "Games as saboteur", format: "number", sql: `SUM("role" = 'saboteur')` }
  ]
};
