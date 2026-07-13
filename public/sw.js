/* AgriOS service worker — cache-first shell for offline launch.
   API calls (/api/*) always hit the network. */

const CACHE = "agrios-v1";
const SHELL  = ["/", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (new URL(e.request.url).pathname.startsWith("/api/")) return; // network-only
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const live = fetch(e.request).then((res) => {
        if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || live;
    })
  );
});

/* Push message from server — future FCM integration. */
self.addEventListener("push", (e) => {
  if (!e.data) return;
  try {
    const { title, body, tag = "agrios" } = e.data.json();
    e.waitUntil(
      self.registration.showNotification(title, { body, tag, icon: "/icon.svg" })
    );
  } catch { /* malformed push payload */ }
});
