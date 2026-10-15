import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const token = "test-family-token-that-is-not-a-secret";
const port = 18787;
const dataDir = await mkdtemp(join(tmpdir(), "mmdp-sync-"));
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, ["apps/sync-api/src/server.js"], {
  env: { ...process.env, PORT: String(port), MMDP_SYNC_DATA_DIR: dataDir, MMDP_SYNC_TOKENS: token, MMDP_SYNC_ORIGINS: "http://localhost:5173" },
  stdio: ["ignore", "pipe", "pipe"],
});

async function waitForHealth() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try { if ((await fetch(`${base}/health`)).ok) return; } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("sync API did not become healthy");
}

try {
  await waitForHealth();
  const unauthorized = await fetch(`${base}/snapshot`);
  if (unauthorized.status !== 401) throw new Error(`expected 401, got ${unauthorized.status}`);

  const snapshot = {
    schemaVersion: 1,
    profiles: [{ id: "child-1", name: "Lia", age: 6, avatar: "🦊", region: "latam", createdAt: new Date().toISOString() }],
    progress: { "child-1": { stars: 3, discovered: ["gato"], golden: [], words: {}, currentLevel: 1, completedLevels: [] } },
    updatedAt: new Date().toISOString(),
  };
  const put = await fetch(`${base}/snapshot`, { method: "PUT", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(snapshot) });
  if (put.status !== 204) throw new Error(`expected PUT 204, got ${put.status}`);
  const get = await fetch(`${base}/snapshot`, { headers: { authorization: `Bearer ${token}` } });
  if (!get.ok) throw new Error(`expected GET 200, got ${get.status}`);
  const restored = await get.json();
  if (restored.progress["child-1"].stars !== 3) throw new Error("snapshot roundtrip mismatch");
  console.log("Family sync API smoke test passed.");
} finally {
  child.kill("SIGTERM");
  await rm(dataDir, { recursive: true, force: true });
}
