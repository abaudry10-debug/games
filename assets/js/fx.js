// Petits effets communs : animation d'entrée des écrans et vibrations aux moments clés.
const fx = {
  calm: () => matchMedia("(prefers-reduced-motion: reduce)").matches,
  enter(el) { if (fx.calm()) return; el.classList.remove("enter"); void el.offsetWidth; el.classList.add("enter"); },
  buzz(pattern) { try { if (pattern && navigator.vibrate && !fx.calm()) navigator.vibrate(pattern); } catch (e) {} }
};
