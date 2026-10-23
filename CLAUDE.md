# Jeux entre potes : consignes pour Claude

Site statique de party games (bluff, soirée) pour Alex et ses potes, en français.
En ligne sur GitHub Pages : https://abaudry10-debug.github.io/games/ (déployé depuis `main`, racine).

## Règles
- HTML/CSS/JS pur, aucun build ni dépendance npm. Chemins toujours relatifs (le site vit sous `/games/`).
- Mobile d'abord, mais responsive. Couleurs via les tokens de `assets/css/base.css` (thème clair et sombre).
- Tout le texte visible est en français.
- Chaque jeu vit dans `jeux/<nom>/` et s'ajoute dans `assets/js/catalogue.js`.
- Réglage « Taux de ressemblance » (1 très faible à 5 très haut) commun aux deux Undercover : `assets/js/ressemblance.js`. Les données portent leur niveau (3, 4 ou 5) ; les niveaux 1 et 2 sont tirés automatiquement.
- Paquets : `assets/js/paquets.js` (fabrique `creerPaquets`). `Paquets` = mots (Undercover, Undercover Dessin, localStorage `jeux.paquets.v1`), `QPaquets` = questions (Quiz Undercover, `jeux.paquets-questions.v1`). Paquets intégrés + paquets/éléments perso. Rien ne va par paires : le tirage calcule la proximité (liens de la banque, thème, paquet, puis orthographe et son pour les mots, mots communs pour les questions) selon le taux de ressemblance. Une question et son contraire = éloignées (lien de niveau 2, et détection automatique).
- Sons et vibrations : `assets/js/fx.js` (sons synthétisés, bouton pour couper le son).
- À chaque changement de fichiers servis : mettre à jour `ASSETS` si besoin et incrémenter `VERSION` dans `sw.js`.
- Tester en local avec `python3 -m http.server` avant de pousser.
- Sauf demande contraire, pousser directement sur `main` (pas de PR) pour que le site se mette à jour.

## Jeux
- `jeux/quiz-undercover/` : chacun désigne un joueur en réponse à une question ; l'imposteur a reçu une question proche mais différente ; « Revoir ma question » dès qu'on a répondu. Questions dans `questions.js` (question + variantes très haut, haut, moyen, et son contraire).
- `jeux/undercover/` : Undercover classique (civils, undercovers, Mr White), modes Mots et Images, avec « Revoir mon mot » dès la distribution. Mots de base dans `mots.js` (paquets gérés par `assets/js/paquets.js`), paires de photos dans `images.js` (Wikimedia Commons, chargées par le téléphone et gardées hors ligne par `sw.js`, crédits dans `credits.html`).
- `jeux/undercover-dessin/` : chacun ajoute un trait au même dessin ; undercovers (mot proche) et Mr White (aucun mot, thème seulement), combinables. Réutilise `../undercover/mots.js` et `../undercover/style.css`.
