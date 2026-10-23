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
  },
  {
    title: "Undercover Dessin",
    art: "dessin",
    path: "jeux/undercover-dessin/",
    pitch: "Un trait chacun sur le même dessin. L'imposteur n'a pas le même mot.",
    players: "3 – 10",
    time: "10 min",
    save: "jeux.undercover-dessin.v1"
  },
  {
    title: "Le Menteur",
    art: "menteur",
    path: "jeux/menteur/",
    pitch: "Un thème, une anecdote chacun. Une seule est inventée : qui ment ?",
    players: "3 – 12",
    time: "10 min",
    save: "jeux.menteur.v1"
  }
];
