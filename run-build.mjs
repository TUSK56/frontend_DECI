/**
 * Vercel sometimes runs `vite build` without node_modules/.bin on PATH.
 * This script always invokes the local Vite CLI via node.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const viteCli = path.join(root, "node_modules", "vite", "bin", "vite.js");

if (!existsSync(viteCli)) {
  console.error("run-build.mjs: vite not found at", viteCli);
  console.error("Run npm install in the project root first.");
  process.exit(1);
}

const res = spawnSync(process.execPath, [viteCli, "build"], {
  cwd: root,
  stdio: "inherit",
  env: process.env,
});

process.exit(res.status === null ? 1 : res.status);
