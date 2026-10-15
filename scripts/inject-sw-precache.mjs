import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const DIST = resolve(REPO_ROOT, "apps/web/dist");
const INDEX = resolve(DIST, "index.html");
const SW = resolve(DIST, "sw.js");

const index = await readFile(INDEX, "utf8");
const references = [...index.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
  .map((match) => match[1])
  .filter((value) => value.startsWith("/") && !value.startsWith("//"));

const precache = [...new Set([
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-maskable.svg",
  ...references,
])];

let worker = await readFile(SW, "utf8");
const marker = /const PRECACHE = \/\*__MMDP_PRECACHE__\*\/ \[[\s\S]*?\];/;
if (!marker.test(worker)) throw new Error("Service worker precache marker not found.");
worker = worker.replace(marker, `const PRECACHE = /*__MMDP_PRECACHE__*/ ${JSON.stringify(precache, null, 2)};`);
await writeFile(SW, worker, "utf8");
console.log(`Injected ${precache.length} PWA shell assets into dist/sw.js`);
