// Catalogue des jeux affiché sur la page d'accueil.
// Pour ajouter un jeu : créez son dossier dans /jeux/, puis ajoutez une entrée ici.
// Sans "path", la carte s'affiche en « bientôt disponible ».
const GAMES = [
  {
    title: "Quiz Undercover",
    emblem: "???",
    path: "jeux/quiz-undercover/",
    pitch: "Chacun désigne un pote en réponse à une question. L'imposteur a reçu une question différente et doit bluffer pour ne pas se faire griller.",
    facts: ["3 à 12 joueurs", "1 téléphone", "Bluff", "≈ 5 min / manche"]
  },
  {
    title: "Prochain jeu",
    emblem: "…",
    pitch: "En préparation.",
    facts: ["Bientôt"]
  }
];
