// Enregistre le service worker (site installable et jouable hors ligne).
(function () {
  if (!("serviceWorker" in navigator)) return;
  const root = new URL("../../", document.currentScript.src);
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(new URL("sw.js", root), { scope: root.pathname }).catch(() => {});
  });
})();
