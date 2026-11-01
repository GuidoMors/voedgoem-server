// Per-game statistics, computed from the "gameResults" table (one row per player per finished game).
// Columns: role, won, flag, score, extra. Each game decides what flag/score/extra mean:
//   codenames: flag = guessed the black card
//   tetris:    score = player's (or team's) final score, extra = lines cleared
//   thirtyone: score = the player's team score
//   dworf:     nothing extra
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
    { key: "lines", label: "Lines cleared", format: "number", sql: `SUM("extra")` }
  ],
  blokus: [
    games,
    winRate,
    { key: "bestResult", label: "Fewest unplaced squares", format: "number", sql: `MAX(-"score")` },
    { key: "piecesPlaced", label: "Pieces placed", format: "number", sql: `SUM("extra")` }
  ],
  thirtyone: [
    games,
    winRate,
    { key: "captainRate", label: "Win rate as captain", format: "percent", sql: rate(`"role" = 'captain'`, `"role" = 'captain'`) },
    { key: "playerRate", label: "Win rate as player", format: "percent", sql: rate(`"role" = 'player'`, `"role" = 'player'`) },
    { key: "avgPoints", label: "Average team points", format: "number", sql: `ROUND(AVG("score"))` }
  ],
  dworf: [
    games,
    winRate,
    { key: "cultistRate", label: "Win rate as cultist", format: "percent", sql: rate(`"role" IN ('cultist', 'saboteur')`, `"role" IN ('cultist', 'saboteur')`) },
    { key: "explorerRate", label: "Win rate as explorer", format: "percent", sql: rate(`"role" = 'explorer'`, `"role" = 'explorer'`) },
    { key: "cultistGames", label: "Games as cultist", format: "number", sql: `SUM("role" IN ('cultist', 'saboteur'))` }
  ],
  werewolves: [
    games,
    winRate,
    { key: "werewolfRate", label: "Win rate as Werewolf", format: "percent", sql: rate(`"role" IN ('big-bad-wolf', 'cloaked-wolf', 'wise-wolf', 'throatcutter', 'sniffer')`, `"role" IN ('big-bad-wolf', 'cloaked-wolf', 'wise-wolf', 'throatcutter', 'sniffer')`) },
    { key: "villagerRate", label: "Win rate as Villager", format: "percent", sql: rate(`"role" IN ('cupido', 'elder', 'hunter', 'alchemist', 'old-knight', 'judge', 'little-girl', 'guard', 'bearman', 'seer')`, `"role" IN ('cupido', 'elder', 'hunter', 'alchemist', 'old-knight', 'judge', 'little-girl', 'guard', 'bearman', 'seer')`) },
    { key: "wolfchildRate", label: "Win rate as Wolfchild", format: "percent", sql: rate(`"role" = 'wolfchild'`, `"role" = 'wolfchild'`) },
    { key: "foolRate", label: "Win rate as Fool", format: "percent", sql: rate(`"role" = 'fool'`, `"role" = 'fool'`) },
    { key: "foolWins", label: "Wins as Fool", format: "number", sql: `SUM(CASE WHEN "role" = 'fool' THEN "won" ELSE 0 END)` }
  ]
};
