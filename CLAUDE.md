# Jeux entre potes : consignes pour Claude

Site statique de party games (bluff, soirée) pour Alex et ses potes, en français.
En ligne sur GitHub Pages : https://abaudry10-debug.github.io/games/ (déployé depuis `main`, racine).

## Règles
- HTML/CSS/JS pur, aucun build ni dépendance npm. Chemins toujours relatifs (le site vit sous `/games/`).
- Mobile d'abord, mais responsive. Couleurs via les tokens de `assets/css/base.css` (thème clair et sombre).
- Tout le texte visible est en français.
- Chaque jeu vit dans `jeux/<nom>/` et s'ajoute dans `assets/js/catalogue.js`.
- Réglage « Taux de ressemblance » (1 très faible à 5 très haut) commun aux deux Undercover : `assets/js/ressemblance.js`. Les données portent leur niveau (3, 4 ou 5) ; les niveaux 1 et 2 sont tirés automatiquement.
- À chaque changement de fichiers servis : mettre à jour `ASSETS` si besoin et incrémenter `VERSION` dans `sw.js`.
- Tester en local avec `python3 -m http.server` avant de pousser.
- Sauf demande contraire, pousser directement sur `main` (pas de PR) pour que le site se mette à jour.

## Jeux
- `jeux/quiz-undercover/` : chacun désigne un joueur en réponse à une question ; l'imposteur a reçu une question proche mais différente ; « Revoir ma question » dès qu'on a répondu. Questions dans `questions.js`.
- `jeux/undercover/` : Undercover classique (civils, undercovers, Mr White), modes Mots et Images, avec « Revoir mon mot » dès la distribution. Paires de mots dans `mots.js`, paires de photos dans `images.js` (Wikimedia Commons, chargées par le téléphone et gardées hors ligne par `sw.js`, crédits dans `credits.html`).
