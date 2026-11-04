import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

function discover(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return discover(path);
    return entry.isFile() && /\.test\.(ts|mjs)$/.test(entry.name) ? [path] : [];
  });
}

const tests = ["src", "scripts"].flatMap(directory => discover(join(root, directory))).sort();
if (tests.length === 0) throw new Error("No .test.ts or .test.mjs files found under src or scripts.");

const result = spawnSync(process.execPath, ["--import", "tsx", "--test", ...process.argv.slice(2), ...tests], {
  cwd: root,
  stdio: "inherit"
});
if (result.error) throw result.error;
if (result.signal) throw new Error(`Test runner terminated by ${result.signal}.`);
process.exitCode = result.status ?? 1;
