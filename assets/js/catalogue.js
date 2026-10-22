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
    title: "Undercover",
    emblem: "≠",
    path: "jeux/undercover/",
    pitch: "Tout le monde a le même mot… sauf les undercovers, qui ont un mot proche, et Mr White, qui n'en a aucun. Un indice chacun, puis on vote pour éliminer.",
    facts: ["3 à 20 joueurs", "1 téléphone", "Bluff", "≈ 10 min / partie"]
  },
  {
    title: "Nos 7 ans",
    emblem: "♥ 7",
    path: "jeux/nos-7-ans/",
    pitch: "Un tout petit jeu à deux pour fêter les 7 ans d'Alex et Betti. « Qui de nous deux… ? » : chacun répond en cachette, et on voit si vous êtes sur la même longueur d'onde.",
    facts: ["2 joueurs", "1 téléphone", "Romantique", "≈ 5 min"]
  }
];
