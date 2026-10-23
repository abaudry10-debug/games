// Paquets de mots partagés par l'Undercover et l'Undercover Dessin : paquets intégrés (jeux/undercover/mots.js),
// paquets perso, mots ajoutés ou supprimés. Les mots ne vont plus forcément par paires : la proximité entre deux mots
// est calculée (paires connues de la banque, thème, paquet, orthographe et son) puis comparée au taux de ressemblance.
const Paquets = (() => {
  const KEY = "jeux.paquets.v1";
  const THEMES = { nourriture: "Nourriture", animaux: "Animaux", maison: "Maison", vetements: "Vêtements", techno: "Technologie", lieux: "Lieux",
    loisirs: "Loisirs", metiers: "Métiers", nature: "Nature", transports: "Transports", "musique-ecole": "Musique et école", imaginaire: "Imaginaire", soiree: "Soirée" };
  // Score de proximité (0 à 1) attendu pour chaque niveau de ressemblance (1 très faible … 5 très haut).
  const BANDS = { 1: [0, .2], 2: [.3, .5], 3: [.5, .68], 4: [.68, .88], 5: [.88, 2] };
  const LINK = { 3: .6, 4: .8, 5: .95 };
  const ui = { open: null, confirm: null, more: false };
  let D = load(), cache = null;

  function load() { try { const d = JSON.parse(localStorage.getItem(KEY) || "null"); if (d && d.packs) return d; } catch (e) {} return { packs: [], words: [], hidden: {} }; }
  function save() { cache = null; try { localStorage.setItem(KEY, JSON.stringify(D)); } catch (e) {} }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rand = n => Math.floor(Math.random() * n);
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const norm = s => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

  // Prononciation approximative du français, pour rapprocher les mots qui se ressemblent à l'oreille.
  function phon(s) {
    let t = norm(s).replace(/ /g, "");
    for (const [a, b] of [[/ph/g, "f"], [/qu/g, "k"], [/c(?=[eiy])/g, "s"], [/g(?=[eiy])/g, "j"], [/c/g, "k"], [/eau|au/g, "o"],
      [/(ai|ei|i)n(?=[^aeiouy]|$)/g, "1"], [/[ae][nm](?=[^aeiouy]|$)/g, "2"], [/o[nm](?=[^aeiouy]|$)/g, "3"], [/ai|ei|ey/g, "e"],
      [/y/g, "i"], [/h/g, ""], [/(.)\1+/g, "$1"], [/[estdxp]+$/, ""]]) t = t.replace(a, b);
    return t;
  }
  function lev(a, b) {
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  }
  const likeness = (a, b) => (a && b ? 1 - lev(a, b) / Math.max(a.length, b.length) : 0);
  function ortho(x, y) {
    let o = Math.max(likeness(x.n, y.n), likeness(x.ph, y.ph));
    if (Math.min(x.n.length, y.n.length) < 4) o *= .75;
    return o;
  }

  const builtins = () => Object.entries(PACKS).map(([id, name]) => ({ id, name, builtin: true }));
  const allPacks = () => builtins().concat(D.packs.map(p => ({ id: p.id, name: p.name, builtin: false })));
  const packName = id => (allPacks().find(p => p.id === id) || {}).name || "Perso";
  const themeLabel = t => (t && t.startsWith("pack:") ? packName(t.slice(5)) : THEMES[t] || "Culture pop");

  // Construit la liste des mots jouables (paquets actifs) et le réseau des proximités connues.
  function build(isActive) {
    const key = allPacks().map(p => (isActive(p.id) ? 1 : 0)).join("");
    if (cache && cache.key === key) return cache;
    const links = new Map(), themeOf = new Map(), items = [], seen = new Set();
    const link = (a, b, l) => { for (const [x, y] of [[a, b], [b, a]]) { if (!links.has(x)) links.set(x, new Map()); links.get(x).set(y, Math.max(l, links.get(x).get(y) || 0)); } };
    const add = (w, pack, theme) => {
      const n = norm(w), k = pack + "|" + n;
      if (!n || seen.has(k) || (D.hidden[pack] || []).includes(n)) return;
      seen.add(k); items.push({ w, n, ph: phon(w), pack, theme });
    };
    for (const [p, cat, a, b, lvl] of W) { link(norm(a), norm(b), lvl); for (const w of [a, b]) if (!themeOf.has(norm(w))) themeOf.set(norm(w), cat); }
    for (const [p, cat, a, b] of W) if (isActive(p)) { add(a, p, cat); add(b, p, cat); }
    for (const c of D.words) {
      if (c.near) link(norm(c.w), norm(c.near), 4);
      if (isActive(c.pack)) add(c.w, c.pack, themeOf.get(norm(c.w)) || (c.near && themeOf.get(norm(c.near))) || "pack:" + c.pack);
    }
    return (cache = { key, items, links });
  }
  function score(x, y, links) {
    let s = LINK[(links.get(x.n) || new Map()).get(y.n)] || 0;
    if (x.theme === y.theme) s = Math.max(s, .38); else if (x.pack === y.pack) s = Math.max(s, .14);
    // Comparaison d'orthographe seulement si les longueurs permettent d'atteindre le seuil (beaucoup plus rapide).
    const bound = (a, b) => 1 - Math.abs(a.length - b.length) / Math.max(a.length, b.length, 1);
    if (bound(x.n, y.n) >= .72 || bound(x.ph, y.ph) >= .72) {
      const o = ortho(x, y);
      if (o >= .72) s = Math.max(s, .55 + (o - .72) / .28 * .37);
    }
    return s;
  }

  // Tire deux mots dont la proximité correspond au niveau demandé (ou au plus proche possible).
  function pick(isActive, level, recent = []) {
    const { items, links } = build(isActive);
    if (items.length < 2) return null;
    const order = [0, 1, -1, 2, -2, 3, -3, 4, -4].map(d => level + d).filter(l => l >= 1 && l <= 5);
    for (const lvl of order) {
      const [lo, hi] = BANDS[lvl];
      const anchors = shuffle(items).sort((a, b) => recent.includes(a.n) - recent.includes(b.n)).slice(0, 90);
      for (const x of anchors) {
        const c = items.filter(y => y.n !== x.n && (s => s >= lo && s < hi)(score(x, y, links)));
        if (!c.length) continue;
        const fresh = c.filter(y => !recent.includes(y.n)), y = (fresh.length ? fresh : c)[rand((fresh.length ? fresh : c).length)];
        return { a: x.w, b: y.w, na: x.n, nb: y.n, theme: x.theme, themeB: y.theme, level: lvl };
      }
    }
    return null;
  }
  const count = isActive => build(isActive).items.length;

  function wordsOf(id) {
    const hidden = D.hidden[id] || [], out = [], seen = new Set();
    for (const [p, , a, b] of W) if (p === id) for (const w of [a, b]) { const n = norm(w); if (!seen.has(n) && !hidden.includes(n)) { seen.add(n); out.push({ w, n, src: "b" }); } }
    for (const c of D.words) if (c.pack === id) { const n = norm(c.w); if (!seen.has(n)) { seen.add(n); out.push({ w: c.w, n, src: "c", id: c.id }); } }
    return out.sort((a, b) => a.n.localeCompare(b.n, "fr"));
  }
  function addWord(pack, w, near) {
    const has = x => wordsOf(pack).some(o => o.n === norm(x));
    if (!has(w)) D.words.push({ id: Date.now() + "" + rand(1000), pack, w, near: near || "" });
    else if (near) { const c = D.words.find(o => o.pack === pack && norm(o.w) === norm(w)); if (c) c.near = near; else D.words.push({ id: Date.now() + "n", pack, w, near }); }
    if (near && !has(near)) D.words.push({ id: Date.now() + "" + rand(1000) + "b", pack, w: near, near: w });
    if (D.hidden[pack]) D.hidden[pack] = D.hidden[pack].filter(n => n !== norm(w) && n !== norm(near || ""));
    save();
  }
  function newPack(name) { const id = "p" + Date.now().toString(36); D.packs.push({ id, name }); save(); return id; }
  // Ancien format (« paires perso » de l'Undercover) : regroupées dans un paquet « Perso ».
  function importPairs(name, pairs) {
    if (!pairs.length) return;
    const id = (D.packs.find(p => p.name === name) || {}).id || newPack(name);
    for (const [a, b] of pairs) addWord(id, a, b);
  }

  // Ligne « Paquets » des réglages : 3 paquets visibles et « … » pour tout afficher.
  function selector(isActive) {
    const packs = allPacks(), many = packs.length > 4, show = many && !ui.more ? packs.slice(0, 3) : packs;
    return `<div class="seg">${show.map(p => `<button data-a="pack" data-k="${esc(p.id)}" aria-pressed="${isActive(p.id)}">${esc(p.name)}</button>`).join("")}${many
      ? `<button data-pk="more" aria-expanded="${ui.more}">${ui.more ? "Moins" : `… +${packs.length - 3}`}</button>` : ""}</div>`;
  }

  // Conteneur « Paquets » : liste des paquets, ou contenu d'un paquet ouvert.
  function manager() {
    const p = ui.open && allPacks().find(x => x.id === ui.open);
    if (!p) {
      return `<ul class="pk-list">${allPacks().map(x => `<li><button data-pk="open" data-id="${esc(x.id)}"><span>${esc(x.name)}</span>${x.builtin ? "" : `<small>perso</small>`}<i aria-hidden="true">›</i></button></li>`).join("")}</ul>
        <form class="row" data-form="pk-new"><input id="pkname" type="text" maxlength="24" placeholder="Nouveau paquet" autocomplete="off" aria-label="Nom du nouveau paquet"><button class="btn" type="submit">Créer</button></form>`;
    }
    const words = wordsOf(p.id), hidden = (D.hidden[p.id] || []).length;
    return `<div class="pk-head"><button class="pk-back" data-pk="back">← Paquets</button><strong>${esc(p.name)}</strong></div>
      <form class="pk-add" data-form="pk-add">
        <input id="pkw" type="text" maxlength="30" placeholder="Nouveau mot" autocomplete="off" aria-label="Nouveau mot">
        <input id="pkn" type="text" maxlength="30" placeholder="Mot proche (facultatif)" autocomplete="off" aria-label="Mot proche, facultatif">
        <button class="btn" type="submit">Ajouter</button>
      </form>
      ${words.length > 20 ? `<input type="search" data-pk-search placeholder="Rechercher un mot" aria-label="Rechercher un mot">` : ""}
      <div class="players pk-words">${words.map(w => `<span class="chip" data-n="${esc(w.n)}"><span>${esc(w.w)}</span><button data-pk="del" data-n="${esc(w.n)}" data-id="${esc(w.id || "")}" aria-label="Supprimer ${esc(w.w)}">×</button></span>`).join("") || `<p class="note">Aucun mot pour l'instant.</p>`}</div>
      ${p.builtin && hidden ? `<button class="btn ghost quiet" data-pk="restore">Rétablir ${hidden} mot${hidden > 1 ? "s" : ""} supprimé${hidden > 1 ? "s" : ""}</button>` : ""}
      ${p.builtin ? "" : `<button class="btn ghost quiet" data-pk="drop">${ui.confirm === "drop" ? "Confirmer la suppression du paquet" : "Supprimer ce paquet"}</button>`}`;
  }
  // Clics sur les boutons data-pk ; renvoie true si l'écran doit être redessiné.
  function handle(b) {
    const a = b.dataset.pk;
    if (a !== "drop") ui.confirm = null;
    if (a === "more") ui.more = !ui.more;
    else if (a === "open") ui.open = b.dataset.id;
    else if (a === "back") ui.open = null;
    else if (a === "del") {
      if (b.dataset.id) D.words = D.words.filter(c => c.id !== b.dataset.id);
      else (D.hidden[ui.open] = D.hidden[ui.open] || []).push(b.dataset.n);
      save();
    } else if (a === "restore") { delete D.hidden[ui.open]; save(); }
    else if (a === "drop") {
      if (ui.confirm !== "drop") ui.confirm = "drop";
      else { D.packs = D.packs.filter(p => p.id !== ui.open); D.words = D.words.filter(c => c.pack !== ui.open); ui.open = null; ui.confirm = null; save(); }
    } else return false;
    return true;
  }
  // Formulaires du conteneur ; renvoie l'id du champ à refocaliser, ou null si le formulaire n'est pas géré ici.
  function submit(form) {
    const f = form.dataset.form, val = id => (document.getElementById(id).value || "").trim().replace(/\s+/g, " ");
    if (f === "pk-new") { const name = val("pkname"); if (!name) return "pkname"; ui.open = newPack(name); return "pkw"; }
    if (f === "pk-add") { const w = val("pkw"), n = val("pkn"); if (!w) return "pkw"; addWord(ui.open, w, n); return "pkw"; }
    return null;
  }
  // Recherche dans un paquet ouvert : filtre les mots affichés sans redessiner l'écran.
  document.addEventListener("input", e => {
    if (!e.target.matches("[data-pk-search]")) return;
    const q = norm(e.target.value);
    document.querySelectorAll(".pk-words .chip").forEach(c => { c.hidden = !!q && !c.dataset.n.includes(q); });
  });

  return { pick, count, selector, manager, handle, submit, importPairs, themeLabel, norm, ui };
})();
