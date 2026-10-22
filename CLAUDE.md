# Jeux entre potes : consignes pour Claude

Site statique de party games (bluff, soirée) pour Alex et ses potes, en français.
En ligne sur GitHub Pages : https://abaudry10-debug.github.io/games/ (déployé depuis `main`, racine).

## Règles
- HTML/CSS/JS pur, aucun build ni dépendance npm. Chemins toujours relatifs (le site vit sous `/games/`).
- Mobile d'abord, mais responsive. Couleurs via les tokens de `assets/css/base.css` (thème clair et sombre).
- Tout le texte visible est en français.
- Chaque jeu vit dans `jeux/<nom>/` et s'ajoute dans `assets/js/catalogue.js`.
- À chaque changement de fichiers servis : mettre à jour `ASSETS` si besoin et incrémenter `VERSION` dans `sw.js`.
- Tester en local avec `python3 -m http.server` avant de pousser.
- Sauf demande contraire, pousser directement sur `main` (pas de PR) pour que le site se mette à jour.

## Jeux
- `jeux/quiz-undercover/` : chacun désigne un joueur en réponse à une question ; l'imposteur a reçu une question proche mais différente. Questions dans `questions.js`.
