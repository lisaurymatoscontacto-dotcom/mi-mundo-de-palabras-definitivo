import { readFile, writeFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const DIST = resolve(dirname(fileURLToPath(import.meta.url)), "../apps/web/dist");
const files = (await readdir(DIST, { recursive: true, withFileTypes: true }))
  .filter(e => e.isFile() && e.name !== "sw.js")
  .map(e => resolve(e.parentPath, e.name).slice(DIST.length).replaceAll("\\", "/")).sort();
const precache = ["/", ...files];
const hash = createHash("sha256");
for (const asset of files) hash.update(asset).update(await readFile(resolve(DIST, "." + asset)));
let worker = await readFile(resolve(DIST, "sw.js"), "utf8");
const marker = /const PRECACHE = \/\*__MMDP_PRECACHE__\*\/ \[[\s\S]*?\];/;
if (!marker.test(worker)) throw new Error("Precache marker missing");
worker = worker.replace(marker, "const PRECACHE = /*__MMDP_PRECACHE__*/ " + JSON.stringify(precache, null, 2) + ";");
worker = worker.replace(/const CACHE = "[^"]+";/, 'const CACHE = "mmdp-shell-' + hash.digest("hex").slice(0, 16) + '";');
await writeFile(resolve(DIST, "sw.js"), worker);
console.log("Precached " + precache.length + " shell and local content files.");
