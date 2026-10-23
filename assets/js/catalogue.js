// Catalogue des jeux affiché sur la page d'accueil.
// Pour ajouter un jeu : créez son dossier dans /jeux/, ajoutez une entrée ici et son illustration dans ART (index.html).
// save : clé localStorage du jeu ; si une partie y est en cours, la carte propose « Reprendre ».
const GAMES = [
  {
    title: "Quiz Undercover",
    art: "quiz",
    path: "jeux/quiz-undercover/",
    pitch: "Une question, un nom. L'imposteur n'a pas la même question.",
    players: "3 – 12",
    time: "5 min"
  },
  {
    title: "Undercover",
    art: "undercover",
    path: "jeux/undercover/",
    pitch: "Un mot ou une photo chacun. Sauf l'undercover… et Mr White.",
    players: "3 – 20",
    time: "10 min",
    save: "jeux.undercover.v1"
  }
];
