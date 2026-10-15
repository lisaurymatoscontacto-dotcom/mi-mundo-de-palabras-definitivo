import { readFile } from "node:fs/promises";
import { runInNewContext } from "node:vm";
import { describe, expect, it, vi } from "vitest";

const worker = await readFile("apps/web/public/sw.js", "utf8");
function harness(offline = false) {
  const listeners = new Map<string, (event: unknown) => void>();
  const cached = new Response("cached editorial metadata");
  const updated = new Response("updated editorial metadata");
  const match = vi.fn().mockResolvedValue(cached);
  const put = vi.fn().mockResolvedValue(undefined);
  const fetch = offline
    ? vi.fn().mockRejectedValue(new TypeError("Offline"))
    : vi.fn().mockResolvedValue(updated);
  runInNewContext(worker, {
    URL, Response, fetch,
    self: {location: {origin: "https://example.test"}, addEventListener: (name: string, handler: (event: unknown) => void) => listeners.set(name, handler)},
    caches: {match, open: vi.fn().mockResolvedValue({put})},
  });
  const request = (path: string) => new Promise<Response>((resolve) => {
    listeners.get("fetch")!({request: {method: "GET", url: `https://example.test${path}`, mode: "cors"}, respondWith: (response: Promise<Response>) => resolve(response)});
  });
  return {fetch, match, put, request};
}

describe("service worker editorial metadata", () => {
  it.each(["assets.catalog.json", "lexicon.approved.json"])("refreshes %s despite a previously cached version", async (file) => {
    const app = harness();
    expect(await (await app.request(`/content/${file}`)).text()).toBe("updated editorial metadata");
    expect(app.fetch).toHaveBeenCalledOnce();
    expect(app.put).toHaveBeenCalledOnce();
    expect(app.match).not.toHaveBeenCalled();
  });
  it("uses cached decisions when offline", async () => {
    const app = harness(true);
    expect(await (await app.request("/content/assets.catalog.json")).text()).toBe("cached editorial metadata");
    expect(app.fetch).toHaveBeenCalledOnce();
  });
  it("keeps static photos cache-first", async () => {
    const app = harness();
    await app.request("/content/photos/casa/vaso.webp");
    expect(app.match).toHaveBeenCalledOnce();
    expect(app.fetch).not.toHaveBeenCalled();
  });
});