import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const remote = args.includes("--remote");
const revoke = args.includes("--revoke");
const username = args.find(arg => !arg.startsWith("--"));

if (!username || !/^[A-Za-z0-9_]{3,20}$/.test(username)) {
  console.error("Usage: npm run admin:grant -- <username> [--remote] [--revoke]");
  process.exit(1);
}

const sql = `UPDATE "users" SET "isAdmin" = ${revoke ? 0 : 1}${revoke ? "" : ', "isHoster" = 0'} WHERE "username" = '${username}'`;
const result = spawnSync("npx", ["wrangler", "d1", "execute", "voedgoem", remote ? "--remote" : "--local", "--command", `"${sql}"`], {
  stdio: "inherit",
  shell: true
});
process.exit(result.status ?? 1);
