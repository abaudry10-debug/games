// Service worker : réseau d'abord, cache en secours (mode hors ligne).
// Après l'ajout d'un jeu, ajoutez ses fichiers à ASSETS et changez VERSION.
const VERSION = "v7";
const CACHE = "jeux-entre-potes-" + VERSION;
// Photos de l'Undercover (Wikimedia Commons) : cache à part, gardé d'une version à l'autre (seules les nouvelles photos sont téléchargées).
const PHOTOS = "jeux-entre-potes-photos";
const PHOTO_DIR = "jeux/undercover/";
try { importScripts(PHOTO_DIR + "images.js"); } catch (e) {}
const PHOTO_URLS = typeof IMG === "undefined" ? [] : IMG.flatMap(m => [m[1], m[3]]).map(src => new URL(src, self.registration.scope + PHOTO_DIR).href);
const ASSETS = [
  "./", "index.html", "manifest.webmanifest",
  "assets/css/base.css", "assets/js/catalogue.js", "assets/js/pwa.js",
  "assets/icons/icon-192.png", "assets/icons/icon-512.png", "assets/icons/apple-touch-icon.png",
  "jeux/quiz-undercover/", "jeux/quiz-undercover/index.html", "jeux/quiz-undercover/style.css",
  "jeux/quiz-undercover/questions.js", "jeux/quiz-undercover/game.js",
  "jeux/undercover/", "jeux/undercover/index.html", "jeux/undercover/style.css",
  "jeux/undercover/mots.js", "jeux/undercover/images.js", "jeux/undercover/game.js", "jeux/undercover/credits.html"
];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
// Télécharge les photos manquantes, trois à la fois pour ménager Wikimedia ; si la vignette n'existe pas, garde l'original sous la même adresse.
async function cachePhotos() {
  const c = await caches.open(PHOTOS), keep = new Set(PHOTO_URLS);
  for (const req of await c.keys()) if (!keep.has(req.url)) await c.delete(req);
  const todo = [];
  for (const url of PHOTO_URLS) if (!(await c.match(url))) todo.push(url);
  const one = async url => {
    for (const u of [url, url.replace("/thumb/", "/").replace(/\/[^/]+$/, "")]) {
      try { const res = await fetch(u, { mode: "cors" }); if (res.ok) return c.put(url, res); } catch (e) {}
    }
  };
  await Promise.all([0, 1, 2].map(async () => { while (todo.length) await one(todo.shift()); }));
}
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE && k !== PHOTOS).map(k => caches.delete(k)))));
  e.waitUntil(cachePhotos());
  self.clients.claim();
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (PHOTO_URLS.includes(e.request.url)) {
    e.respondWith(caches.open(PHOTOS).then(c => c.match(e.request).then(r => r || fetch(e.request).then(res => { if (res.ok) c.put(e.request, res.clone()); return res; }))));
    return;
  }
  e.respondWith(
    fetch(e.request)
      .then(res => { if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); } return res; })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
});
