// Banque de paires d'images du mode Images de l'Undercover (illustrations dessinées pour le jeu, dans img/).
// Format : [paquet, image A, nom A, image B, nom B]. Les noms ne s'affichent qu'en fin de partie.
// Pour ajouter une paire : déposez deux images dans img/ et ajoutez une ligne dans IMG.
const IMG_PACKS = { lieux: "Lieux", situations: "Situations" };
const IMG = [
  ["lieux", "img/tour-eiffel.svg", "Tour Eiffel", "img/tour-de-tokyo.svg", "Tour de Tokyo"],
  ["lieux", "img/pyramides.svg", "Pyramides d'Égypte", "img/chichen-itza.svg", "Pyramide maya"],
  ["lieux", "img/statue-liberte.svg", "Statue de la Liberté", "img/christ-redempteur.svg", "Christ Rédempteur"],
  ["lieux", "img/colisee.svg", "Colisée", "img/arenes.svg", "Arènes de Nîmes"],
  ["lieux", "img/plage.svg", "Plage", "img/piscine.svg", "Piscine"],
  ["lieux", "img/prison.svg", "Prison", "img/frontiere.svg", "Mur frontière"],
  ["lieux", "img/centrale-nucleaire.svg", "Centrale nucléaire", "img/usine.svg", "Usine"],
  ["lieux", "img/las-vegas.svg", "Las Vegas", "img/times-square.svg", "Times Square"],
  ["lieux", "img/big-ben.svg", "Big Ben", "img/tour-de-pise.svg", "Tour de Pise"],
  ["lieux", "img/chateau-disney.svg", "Château de Disney", "img/chateau-fort.svg", "Château fort"],
  ["lieux", "img/taj-mahal.svg", "Taj Mahal", "img/kremlin.svg", "Kremlin"],
  ["lieux", "img/montagne.svg", "Montagne", "img/desert.svg", "Désert"],
  ["situations", "img/rave.svg", "Rave party", "img/boite-de-nuit.svg", "Boîte de nuit"],
  ["situations", "img/mariage.svg", "Mariage", "img/enterrement.svg", "Enterrement"],
  ["situations", "img/manifestation.svg", "Manifestation", "img/supporters.svg", "Supporters au stade"],
  ["situations", "img/explosion-nucleaire.svg", "Explosion nucléaire", "img/eruption.svg", "Éruption volcanique"],
  ["situations", "img/tsunami.svg", "Tsunami", "img/tornade.svg", "Tornade"],
  ["situations", "img/pique-nique.svg", "Pique-nique", "img/barbecue.svg", "Barbecue"],
  ["situations", "img/embouteillage.svg", "Embouteillage", "img/formule-1.svg", "Course de Formule 1"],
  ["situations", "img/decollage-fusee.svg", "Décollage de fusée", "img/decollage-avion.svg", "Décollage d'avion"],
  ["situations", "img/pas-sur-la-lune.svg", "Premier pas sur la Lune", "img/robot-sur-mars.svg", "Robot sur Mars"],
  ["situations", "img/corrida.svg", "Corrida", "img/rodeo.svg", "Rodéo"],
  ["situations", "img/tapis-rouge.svg", "Tapis rouge", "img/defile-de-mode.svg", "Défilé de mode"],
  ["situations", "img/tribunal.svg", "Procès au tribunal", "img/bureau-de-vote.svg", "Bureau de vote"],
  ["situations", "img/feu-de-foret.svg", "Feu de forêt", "img/inondation.svg", "Inondation"]
];
