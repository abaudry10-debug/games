// Petits effets communs : animation d'entrée des écrans, vibrations et sons.
// Les sons sont synthétisés (Web Audio) : rien à télécharger, ça marche hors ligne.
const fx = {
  calm: () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  enter(el) { if (fx.calm()) return; el.classList.remove("enter"); void el.offsetWidth; el.classList.add("enter"); },
  buzz(pattern) { try { if (pattern && navigator.vibrate && !fx.calm()) navigator.vibrate(pattern); } catch (e) {} },

  muted: (() => { try { return localStorage.getItem("jeux.son") === "off"; } catch (e) { return false; } })(),
  ctx: null,
  audio() {
    if (!fx.ctx) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return null; fx.ctx = new A(); }
    if (fx.ctx.state === "suspended") fx.ctx.resume();
    return fx.ctx;
  },
  // Joue une suite de notes : [fréquence de départ, fréquence d'arrivée, début (s), durée (s)].
  notes(list, type = "triangle", vol = .12) {
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
      tick: () => fx.notes([[1400, 1100, 0, .04]], "sine", .05),
      reveal: () => fx.notes([[660, 660, 0, .14], [990, 990, .1, .3]], "triangle", .1),
      elim: () => fx.notes([[320, 110, 0, .45]], "sawtooth", .07),
      win: () => fx.notes([[523, 523, 0, .16], [659, 659, .12, .16], [784, 784, .24, .16], [1047, 1047, .36, .5]], "triangle", .11),
      fail: () => fx.notes([[440, 430, 0, .2], [330, 300, .18, .45]], "triangle", .1),
      alarm: () => fx.notes([[880, 880, 0, .12], [880, 880, .2, .12], [880, 880, .4, .25]], "square", .05)
    };
    if (name && S[name]) S[name]();
  },
  soundButton: () => `<button class="snd" data-sound aria-pressed="${!fx.muted}" aria-label="${fx.muted ? "Activer le son" : "Couper le son"}">${fx.muted
    ? `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`}</button>`
};
// Bouton son (n'importe quelle page) et petit « tic » sur les boutons.
document.addEventListener("click", e => {
  const s = e.target.closest("[data-sound]");
  if (s) {
    fx.muted = !fx.muted;
    try { localStorage.setItem("jeux.son", fx.muted ? "off" : "on"); } catch (err) {}
    s.outerHTML = fx.soundButton();
    if (!fx.muted) fx.sound("tick");
    return;
  }
  const b = e.target.closest(".btn, .seg button, .pick button, .choices button");
  if (b && !b.disabled) fx.sound("tick");
}, true);
