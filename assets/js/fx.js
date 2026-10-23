// Petits effets communs : animation d'entrée des écrans, vibrations et sons.
// Les sons sont synthétisés (Web Audio) : rien à télécharger, ça marche hors ligne.
const fx = {
  calm: () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  enter(el) { if (fx.calm()) return; el.classList.remove("enter"); void el.offsetWidth; el.classList.add("enter"); },
  buzz(pattern) { try { if (pattern && navigator.vibrate && !fx.calm()) navigator.vibrate(pattern); } catch (e) {} },

  muted: (() => { try { return localStorage.getItem("jeux.son") === "off"; } catch (e) { return false; } })(),
  ctx: null, unlocked: false,
  audio() {
    if (!fx.ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; fx.ctx = new A(); }
    if (fx.ctx.state !== "running") fx.ctx.resume().catch(() => {});
    return fx.ctx;
  },
  // iPhone : l'audio n'est autorisé qu'après un toucher, et le mode silencieux coupe les sons de page.
  // On débloque au premier toucher, on passe en mode « lecture » (audioSession, ou à défaut un son muet en boucle).
  unlock() {
    if (fx.unlocked) return;
    fx.unlocked = true;
    try { if (navigator.audioSession) navigator.audioSession.type = "playback"; } catch (e) {}
    const c = fx.audio(); if (!c) return;
    const b = c.createBuffer(1, 1, 22050), s = c.createBufferSource();
    s.buffer = b; s.connect(c.destination); s.start(0);
    if (!navigator.audioSession && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && "ontouchend" in document) {
      const rate = 8000, n = rate / 2, buf = new Uint8Array(44 + n), v = new DataView(buf.buffer);
      [..."RIFF"].forEach((ch, i) => v.setUint8(i, ch.charCodeAt(0))); v.setUint32(4, 36 + n, true);
      [..."WAVEfmt "].forEach((ch, i) => v.setUint8(8 + i, ch.charCodeAt(0))); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
      v.setUint32(24, rate, true); v.setUint32(28, rate, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true);
      [..."data"].forEach((ch, i) => v.setUint8(36 + i, ch.charCodeAt(0))); v.setUint32(40, n, true); buf.fill(128, 44);
      const el = new Audio(URL.createObjectURL(new Blob([buf], { type: "audio/wav" })));
      el.loop = true; el.setAttribute("playsinline", ""); el.play().catch(() => {});
    }
  },
  // Joue une suite de notes : [fréquence de départ, fréquence d'arrivée, début (s), durée (s)].
  notes(list, type = "triangle", vol = .3) {
    if (fx.muted) return;
    const c = fx.audio(); if (!c) return;
    const t0 = c.currentTime + .01;
    for (const [f1, f2, at, dur] of list) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(f1, t0 + at); o.frequency.exponentialRampToValueAtTime(f2, t0 + at + dur);
      g.gain.setValueAtTime(0.0001, t0 + at); g.gain.exponentialRampToValueAtTime(vol, t0 + at + .015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + at + dur);
      o.connect(g).connect(c.destination); o.start(t0 + at); o.stop(t0 + at + dur + .05);
    }
  },
  sound(name) {
    const S = {
      tick: () => fx.notes([[1400, 1100, 0, .05]], "sine", .14),
      reveal: () => fx.notes([[660, 660, 0, .14], [990, 990, .1, .3]], "triangle", .3),
      elim: () => fx.notes([[320, 110, 0, .45]], "sawtooth", .18),
      win: () => fx.notes([[523, 523, 0, .16], [659, 659, .12, .16], [784, 784, .24, .16], [1047, 1047, .36, .5]], "triangle", .3),
      fail: () => fx.notes([[440, 430, 0, .2], [330, 300, .18, .45]], "triangle", .28),
      alarm: () => fx.notes([[880, 880, 0, .12], [880, 880, .2, .12], [880, 880, .4, .25]], "square", .14)
    };
    if (name && S[name]) S[name]();
  },
  soundButton: () => `<button class="snd" data-sound aria-pressed="${!fx.muted}" aria-label="${fx.muted ? "Activer le son" : "Couper le son"}">${fx.muted
    ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`}</button>`
};
// Déblocage de l'audio au premier toucher, reprise au retour sur la page.
["pointerdown", "touchend", "keydown"].forEach(ev => document.addEventListener(ev, () => { if (!fx.muted) fx.unlock(); }, { capture: true, passive: true }));
document.addEventListener("visibilitychange", () => { if (!document.hidden && fx.ctx) fx.ctx.resume().catch(() => {}); });
// Bouton son (n'importe quelle page) et petit « tic » sur les boutons.
document.addEventListener("click", e => {
  const s = e.target.closest("[data-sound]");
  if (s) {
    fx.muted = !fx.muted;
    try { localStorage.setItem("jeux.son", fx.muted ? "off" : "on"); } catch (err) {}
    s.outerHTML = fx.soundButton();
    if (!fx.muted) { fx.unlock(); fx.sound("tick"); }
    return;
  }
  const b = e.target.closest(".btn, .seg button, .pick button, .choices button");
  if (b && !b.disabled) fx.sound("tick");
}, true);
