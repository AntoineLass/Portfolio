# Portfolio — Antoine Lassagne

Site statique, sans framework ni dépendance : HTML, CSS et JavaScript.
Bilingue FR/EN, thème sombre/clair, et en fond un circuit imprimé en ASCII
qui réagit au curseur (sonde) et aux clics (un signal parcourt les pistes).
En bas de l'accueil, un compagnon en ASCII — chien robot, robot à chenilles ou
drone FPV, au choix — obéit aux ordres donnés dans son menu (clic sur lui).

## Lancer en local

```sh
python3 -m http.server 8080
# ou : npx serve .
```

Puis ouvrir <http://localhost:8080>. Un serveur local est nécessaire : les
pages chargent des fichiers voisins (polices, scripts), ce qui ne marche pas
toujours en ouvrant le fichier directement.

## Structure

```
index.html              page principale (textes français)
projet.html             gabarit d'une page projet : projet.html?id=<id>
assets/css/style.css    styles + couleurs (variables en haut du fichier)
assets/js/projects.js   données des projets (FR + EN) — à éditer pour les projets
assets/js/i18n.js       version anglaise des textes de index.html + textes des scripts
assets/js/main.js       navigation, thème, grille des projets, contact, coordonnées
assets/js/ascii.js      dessins ASCII des projets (couvertures)
assets/js/board.js      fond : circuit imprimé ASCII interactif (canvas)
assets/js/robot.js      le compagnon de l'accueil (chien, robot ou drone) et sa machine à états
assets/fonts/           JetBrains Mono + IBM Plex Sans, hébergées localement
assets/img/             favicon, image de partage (og.png), médias des projets
```

## Modifier le contenu

- **Textes de la page principale** : le français est directement dans
  `index.html`. Chaque élément traduit porte un attribut `data-i18n="clé"` ;
  la version anglaise se trouve sous la même clé dans `assets/js/i18n.js`.
- **Projets** : tout est dans `assets/js/projects.js` (titre, résumé, texte,
  points clés, tags, liens). L'ordre du tableau est l'ordre d'affichage ;
  `featured: true` place le projet dans la grande grille du haut.
- **Coordonnées** : objet `window.SITE` en haut de `assets/js/main.js`.
  Le lien LinkedIn est masqué tant que `linkedin` est vide.
- **Lien de l'article RS-485** : à ajouter dans `links` du projet
  `rs485-article` une fois publié (un exemple est en commentaire).

## Ajouter des photos à un projet

1. Déposer les images dans `assets/img/projects/<id>/` (idéalement en `.webp`
   ou `.jpg`, ~1600 px de large maximum).
2. Les lister dans `images` du projet :
   ```js
   images: [
     { src: 'assets/img/projects/kydefix/robot.jpg',
       alt: { fr: 'Le robot Nova SM3', en: 'The Nova SM3 robot' },
       caption: { fr: 'Le robot sur le banc', en: 'The robot on the bench' } }
   ]
   ```
   Elles apparaissent dans une galerie (avec visionneuse) sur la page du projet.
3. Optionnel : `cover: { src: '…' }` remplace l'ASCII art par une photo (ou une
   vidéo `.mp4`) sur la carte et en tête de page.

Sans photo, chaque projet garde son illustration en ASCII art.

## Formulaire de contact

Aucun service tiers : le formulaire prépare un e-mail (`mailto:`) avec l'objet
et le message pré-remplis, et l'ouvre dans la messagerie du visiteur. Si rien
ne s'ouvre (pas de client mail configuré), un bouton permet de copier le
message, et l'adresse est affichée à côté avec un bouton « copier ».

Un envoi 100 % côté serveur demanderait un backend (le site est statique) :
si le site est un jour hébergé sur un serveur à soi, un petit script (PHP ou
Node) pourrait recevoir le formulaire à la place du `mailto:`.

## Le compagnon de l'accueil

Un clic sur lui (ou sur « nom · fsm » en bas à droite) ouvre son menu : cinq
ordres — suivre, attendre, s'asseoir, faire un tour, dormir — et le choix du
personnage, mémorisé dans le navigateur. Tout est dans `assets/js/robot.js` :
les dessins (`DOG_*`, `BOT_*`, `DRONE_*`), le tableau `KINDS` (nom, vitesse,
libellés de la machine à états) et la boucle `tick`. Les répliques et les
libellés des ordres sont dans `assets/js/i18n.js` (`petSay`, `petCmds`,
`petAck`).

## Easter egg

Un clic droit sur le compagnon (appui long sur mobile, ou le code Konami au
clavier) ouvre `nova.html` : un petit monde 3D rendu en caractères ASCII, où
l'on pilote un robot quadrupède. Tout tient dans `assets/js/game.js`, sans
bibliothèque : le rendu (tampon de caractères dense avec profondeur, fonds
teintés, contours, ombres) et un petit moteur physique (corps rigides,
contacts par impulsions, pattes en ressorts amortis, commande d'équilibre) —
on peut culbuter, bousculer des caisses et tomber de la carte. Les réglages de
conduite sont regroupés dans l'objet `CFG` ; `nova.html?debug` expose l'état
du jeu dans `window.NOVA` pour les essais.

## Déploiement

Site statique : il suffit de copier `index.html`, `projet.html`, `nova.html` et `assets/`
à la racine du serveur web. La balise
`og:image` de `index.html` pointe vers l'URL absolue du site : à adapter si le
domaine change.

## Accessibilité

- `prefers-reduced-motion` : plus d'animations (fond statique, chien immobile).
- Navigation clavier, lien d'évitement, contrastes vérifiés dans les deux thèmes.
- Le fond et le chien sont décoratifs (`aria-hidden`).
