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

async function cachedAsset(request) {
  const url = new URL(request.url);
  // These public, bundled files have one representation. Vary: Origin from
  // a host must not hide precached JS/CSS from crossorigin module requests.
  return caches.match(request, { cacheName: CACHE, ignoreVary: url.origin === self.location.origin && PRECACHE.includes(url.pathname) });
}

async function assetResponse(request) {
  const url = new URL(request.url);
  // Refresh editorial decisions online, retaining the last local catalog offline.
  // Cache-first metadata would keep existing installations on obsolete visuals.
  if (url.origin === self.location.origin && [
    "/content/assets.catalog.json", "/content/lexicon.approved.json",
  ].includes(url.pathname)) {
    try {
      return await cacheSuccessful(request, await fetch(request));
    } catch {
      return (await caches.match(request))
        || new Response("", { status: 503, statusText: "Offline" });
    }
  }
  const cached = await cachedAsset(request);
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
