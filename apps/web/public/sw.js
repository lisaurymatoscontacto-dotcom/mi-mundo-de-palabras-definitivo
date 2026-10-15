const CACHE = "mmdp-shell-v2";
const PRECACHE = /*__MMDP_PRECACHE__*/ [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-maskable.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys
        .filter((key) => key.startsWith("mmdp-shell-") && key !== CACHE)
        .map((key) => caches.delete(key)),
    )),
  );
  self.clients.claim();
});

async function cacheSuccessful(request, response) {
  if (!response || (!response.ok && response.type !== "opaque")) return response;
  const cache = await caches.open(CACHE);
  await cache.put(request, response.clone());
  return response;
}

async function navigationResponse(request) {
  try {
    const response = await fetch(request);
    return await cacheSuccessful(request, response);
  } catch {
    return (await caches.match(request))
      || (await caches.match("/"))
      || new Response("Sin conexión", { status: 503, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
}

async function assetResponse(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    return await cacheSuccessful(request, response);
  } catch {
    return new Response("", { status: 503, statusText: "Offline" });
  }
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.mode === "navigate") {
    event.respondWith(navigationResponse(event.request));
    return;
  }
  event.respondWith(assetResponse(event.request));
});
