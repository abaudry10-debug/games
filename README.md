# Jeux entre potes

Catalogue de jeux de soirée, pensé d'abord pour le mobile, installable comme une app et jouable hors ligne.
Site 100 % statique (HTML, CSS, JS), sans build ni dépendance, hébergé sur GitHub Pages.

En ligne : https://abaudry10-debug.github.io/games/

## Structure

```
index.html                 Catalogue (page d'accueil)
assets/css/base.css        Styles communs (couleurs, typo, boutons)
assets/js/catalogue.js     Liste des jeux affichés sur l'accueil
assets/js/pwa.js           Active le mode app / hors ligne
assets/icons/              Icônes de l'app
jeux/quiz-undercover/      Premier jeu
  index.html               Page du jeu
  questions.js             Banque de questions (à enrichir librement)
  game.js                  Logique du jeu
  style.css                Styles propres au jeu
jeux/undercover/           Undercover classique (civils, undercovers, Mr White)
  mots.js                  Banque de paires de mots (à enrichir librement)
  images.js                Banque de paires de photos du mode Images (Wikimedia Commons)
  credits.html             Auteurs et licences des photos
sw.js                      Service worker (cache hors ligne)
manifest.webmanifest       Nom et icône de l'app installée
```

## Ajouter des questions au Quiz Undercover

Éditez `jeux/quiz-undercover/questions.js` : une ligne par question, au format
`["paquet", "question de l'équipe", "question de l'imposteur"]`.
Les paquets disponibles sont `classique`, `soiree` et `epice`.

## Ajouter des mots à l'Undercover

Éditez `jeux/undercover/mots.js` : une ligne par paire, au format `["paquet", "mot", "mot proche"]`.
Les paquets disponibles sont `classique`, `soiree` et `culture`.

Pour le mode Images, ajoutez une ligne dans `jeux/undercover/images.js` :
`["paquet", "URL de vignette upload.wikimedia.org", "nom", "URL", "nom"]` (paquets `perso`, `lieux` et `situations`).
N'utilisez que des photos sous licence libre de Wikimedia Commons : `credits.html` affiche leurs auteurs.

## Ajouter un nouveau jeu

1. Créez un dossier `jeux/<nom-du-jeu>/` avec son `index.html` (copiez celui du Quiz Undercover comme base).
2. Ajoutez une entrée dans `assets/js/catalogue.js`.
3. Ajoutez ses fichiers à la liste `ASSETS` de `sw.js` et changez `VERSION` (par ex. `v2`).

## Publier une mise à jour

Poussez sur la branche `main` : GitHub Pages republie le site en une à deux minutes.
Changez `VERSION` dans `sw.js` à chaque mise à jour pour que les téléphones récupèrent la nouvelle version.

## Tester en local

```
python3 -m http.server 8000
```
puis ouvrez http://localhost:8000
