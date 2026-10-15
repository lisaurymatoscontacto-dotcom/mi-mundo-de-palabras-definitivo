import { createServer } from "node:http";
import { createHash, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";

const PORT = Number(process.env.PORT || 8787);
const DATA_DIR = resolve(process.env.MMDP_SYNC_DATA_DIR || "./data/sync");
const MAX_BODY_BYTES = Number(process.env.MMDP_SYNC_MAX_BYTES || 1_000_000);
const TOKENS = (process.env.MMDP_SYNC_TOKENS || "").split(",").map((token) => token.trim()).filter(Boolean);
const ALLOWED_ORIGINS = (process.env.MMDP_SYNC_ORIGINS || "").split(",").map((origin) => origin.trim()).filter(Boolean);

function hashToken(token) { return createHash("sha256").update(token).digest("hex"); }
const tokenHashes = TOKENS.map((token) => Buffer.from(hashToken(token), "hex"));

function authorizedToken(req) {
  const match = /^Bearer\s+(.+)$/i.exec(req.headers.authorization || "");
  if (!match || tokenHashes.length === 0) return null;
  const digest = Buffer.from(hashToken(match[1]), "hex");
  for (const allowed of tokenHashes) {
    if (allowed.length === digest.length && timingSafeEqual(allowed, digest)) return digest.toString("hex");
  }
  return null;
}

function corsHeaders(req) {
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_ORIGINS.includes(origin)) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  };
}

function send(req, res, status, body) {
  const headers = { ...corsHeaders(req) };
  if (body !== undefined && body !== null) headers["Content-Type"] = "application/json";
  res.writeHead(status, headers);
  res.end(body ?? "");
}

function snapshotPath(tokenHash) { return join(DATA_DIR, `${tokenHash}.json`); }

function validateSnapshot(value) {
  return Boolean(value)
    && typeof value === "object"
    && value.schemaVersion === 1
    && Array.isArray(value.profiles)
    && Boolean(value.progress)
    && typeof value.progress === "object"
    && !Array.isArray(value.progress)
    && typeof value.updatedAt === "string"
    && !Number.isNaN(Date.parse(value.updatedAt));
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error("payload too large"), { statusCode: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}

async function writeSnapshot(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(temporary, path);
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (req.method === "OPTIONS") {
      if (req.headers.origin && ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(req.headers.origin)) {
        send(req, res, 403, JSON.stringify({ error: "origin_not_allowed" }));
      } else send(req, res, 204);
      return;
    }
    if (url.pathname === "/health" && req.method === "GET") {
      send(req, res, 200, JSON.stringify({ ok: true, service: "mmdp-sync", version: 1 }));
      return;
    }
    if (url.pathname !== "/snapshot") {
      send(req, res, 404, JSON.stringify({ error: "not_found" }));
      return;
    }
    const tokenHash = authorizedToken(req);
    if (!tokenHash) {
      send(req, res, 401, JSON.stringify({ error: "unauthorized" }));
      return;
    }
    const path = snapshotPath(tokenHash);
    if (req.method === "GET") {
      try { send(req, res, 200, await readFile(path, "utf8")); }
      catch (error) {
        if (error?.code === "ENOENT") send(req, res, 204);
        else throw error;
      }
      return;
    }
    if (req.method === "PUT") {
      let parsed;
      try { parsed = JSON.parse(await readBody(req)); }
      catch (error) {
        if (error?.statusCode === 413) throw error;
        send(req, res, 400, JSON.stringify({ error: "invalid_json" }));
        return;
      }
      if (!validateSnapshot(parsed)) {
        send(req, res, 422, JSON.stringify({ error: "invalid_snapshot" }));
        return;
      }
      await writeSnapshot(path, parsed);
      send(req, res, 204);
      return;
    }
    send(req, res, 405, JSON.stringify({ error: "method_not_allowed" }));
  } catch (error) {
    const status = Number(error?.statusCode || 500);
    if (status >= 500) console.error("sync-api error", error);
    send(req, res, status, JSON.stringify({ error: status === 413 ? "payload_too_large" : "internal_error" }));
  }
});

server.listen(PORT, () => {
  console.log(`Mi Mundo de Palabras sync API listening on :${PORT}`);
  if (!TOKENS.length) console.warn("MMDP_SYNC_TOKENS is empty: all /snapshot requests will be rejected.");
});
