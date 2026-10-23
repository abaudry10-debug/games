// Réglage « Taux de ressemblance », commun aux jeux Undercover et Quiz Undercover.
// Niveau 1 = très faible (rien à voir) … niveau 5 = très haut (presque identiques).
const SIM_LEVELS = [
  { n: 1, label: "Très faible", desc: "Aucun rapport entre les deux : l'imposteur se trahit vite, sauf s'il bluffe très bien.",
    ex: { mots: "« Pizza » et « Avion »", images: "Donald Trump et la tour Eiffel", questions: "« Qui cuisine le mieux ? » et « Qui a le plus d'ex ? »" } },
  { n: 2, label: "Faible", desc: "Même grand thème, mais pas grand-chose en commun.",
    ex: { mots: "« Lion » et « Escargot » (deux animaux)", images: "Donald Trump et Lionel Messi (deux personnalités)", questions: "« Qui cuisine le mieux ? » et son contraire « Qui arriverait à brûler des pâtes ? »" } },
  { n: 3, label: "Moyen", desc: "Liés, mais faciles à distinguer en écoutant bien.",
    ex: { mots: "« Banane » et « Mangue »", images: "Big Ben et la tour de Pise", questions: "« Qui cuisine le mieux ? » et « Qui mange le plus ? »" } },
  { n: 4, label: "Haut", desc: "Très proches : il faut des indices fins pour faire la différence.",
    ex: { mots: "« Café » et « Thé », ou « Macron » et « Macaron »", images: "Elon Musk et Mark Zuckerberg", questions: "« Qui cuisine le mieux ? » et « Qui réussirait le mieux un dîner presque parfait ? »" } },
  { n: 5, label: "Très haut", desc: "Presque identiques : même les civils se mettent à douter.",
    ex: { mots: "« Crocodile » et « Alligator »", images: "deux présidents français (Chirac et Mitterrand) ou deux montagnes célèbres (Everest et Cervin)", questions: "« Qui cuisine le mieux ? » et « Qui ferait le meilleur chef dans un restaurant ? »" } }
];

// mode : "mots", "images" ou "questions". Les boutons envoient data-a="sim" data-k="1…5".
function simPicker(level, mode) {
  const cur = SIM_LEVELS.find(s => s.n === level) || SIM_LEVELS[3];
  return `<section class="field">
      <div class="label">Taux de ressemblance</div>
      <div class="seg sim">${SIM_LEVELS.map(s => `<button data-a="sim" data-k="${s.n}" aria-pressed="${s.n === cur.n}"><span class="sim-bars" aria-hidden="true">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= s.n ? "on" : ""}"></i>`).join("")}</span>${s.label}</button>`).join("")}</div>
      <div class="sim-desc"><strong>${cur.label} :</strong> ${cur.desc}<br><span>Exemple : ${cur.ex[mode]}.</span></div>
    </section>`;
}
const simName = level => (SIM_LEVELS.find(s => s.n === level) || SIM_LEVELS[3]).label;
