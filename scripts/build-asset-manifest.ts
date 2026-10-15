import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { CANDIDATE_WORDS } from "../packages/core/src/candidate.words";
import { createAssetProductionManifest } from "../packages/core/src/asset-production";

async function main() {
  const output = resolve("packages/core/src/generated/assets.production.json");
  const manifest = createAssetProductionManifest(CANDIDATE_WORDS);

  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify({
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    count: manifest.length,
    tasks: manifest,
  }, null, 2)}\n`, "utf8");

  console.log(`Asset production manifest: ${manifest.length} tasks -> ${output}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
