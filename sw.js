// Service worker : réseau d'abord, cache en secours (mode hors ligne).
// Après l'ajout d'un jeu, ajoutez ses fichiers à ASSETS et changez VERSION.
const VERSION = "v1";
const CACHE = "jeux-entre-potes-" + VERSION;
const ASSETS = [
  "./", "index.html", "manifest.webmanifest",
  "assets/css/base.css", "assets/js/catalogue.js", "assets/js/pwa.js",
  "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/apple-touch-icon.png",
  "jeux/quiz-undercover/", "jeux/quiz-undercover/index.html", "jeux/quiz-undercover/style.css",
  "jeux/quiz-undercover/questions.js", "jeux/quiz-undercover/game.js"
];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then(res => { if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
});
