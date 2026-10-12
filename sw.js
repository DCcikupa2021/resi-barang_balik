/**
 * sw.js — Service Worker PWA (PRD FR-08).
 * Strategi:
 *  - App shell  : cache-first (file statis jarang berubah; update lewat versi CACHE)
 *  - Supabase   : network-first + fallback cache (data terakhir tetap tampil offline)
 *  - CDN (Tailwind/SweetAlert2/html5-qrcode/Fonts): lewat saja (biar HTTP cache browser)
 * SELALU naikkan versi CACHE saat rilis perubahan!
 */
const CACHE = "resi-pwa-v2";
const SHELL = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "config.js",
  "manifest.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
  "icons/favicon-32.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Data Supabase: network-first, fallback ke cache kalau offline/gagal
  if (url.hostname.endsWith(".supabase.co")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Same-origin (app shell): cache-first, fallback network
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req, { ignoreSearch: req.mode === "navigate" }).then(
        (cached) =>
          cached ||
          fetch(req).then((res) => {
            if (res.ok && req.mode !== "navigate") {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
            }
            return res;
          })
      )
    );
    return;
  }

  // Lainnya (CDN dsb): biarkan jaringan
});
