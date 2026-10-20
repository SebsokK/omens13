# Journal des modifications

*[Read in English](CHANGELOG.md)*

## 0.2.2

- **Fenêtre de Check** : l'interrupteur de l'Omen ajouté par l'Hôte s'appelle maintenant **Facing Evil**, le terme du livret (p.8) déjà affiché sur la carte de chat. Des info-bulles expliquent Facing Evil et le Check sans danger.

## 0.2.1

- **Sacrifice héroïque** (p.9) : quand un personnage à une Blessure de la mort tire un dé Omen (un Omen forcé par l'Hôte compte), le joueur choisit avant de lancer : lancer les dés, ou se sacrifier. Le Check réussit automatiquement, le personnage quitte l'histoire et tous ses dés retournent dans le sac, comme pour Succomber.
- **Équipement non choisi** : clic droit sur un objet pour le masquer ; les objets masqués passent en fin de liste, s'affichent depuis l'en-tête de la section et ne sont pas proposés dans la fenêtre de Check.
- **Fenêtre de Check** : Aspects regroupés (Fondamentaux / Histoire) ; les Aspects sans Notation sont affichés grisés au lieu de disparaître.

## 0.2.0

**Règles (vérifiées avec le livret)**
- **Tromper la mort** : une fois par Acte pour toute la table (et non par personnage), une fois par histoire pour chaque personnage. La Blessure est remplacée par un dé Safe retiré du sac, et le dé Omen retourne dans le sac (il partait auparavant dans la Réserve de l'Hôte). L'annulation rétablit tout exactement.
- **Mort et désespoir** : à la dernière Blessure, le personnage peut encore tromper la mort ou **Succomber** (bouton du Dice Bag, avec confirmation) : tous les dés devant lui retournent dans le sac, y compris un dé Safe de Cheat Death, et il quitte l'histoire.
- **Taille du groupe** : le seuil de mort suit le nombre de personnages choisis dans le Dice Bag (+2 Blessures à 1 personnage, +1 à 2, −1 à 5, −2 puis −1 à 6). Le Flaw permanent reste à 3 Blessures.
- **Check sans danger** : un dé Omen inférieur ou égal à l'Acte donne une Strain sur l'Aspect lancé au lieu d'une Blessure (l'Hôte peut la décocher).
- **Équipement** : un objet intact utilisé pour un Check donne un Edge, un objet cassé ou perdu un Flaw.

**Dice Bag**
- L'Hôte choisit les personnages qui jouent l'histoire (seuls eux sont affichés).
- Bouton **Nouvelle histoire** (Hôte) : remet le sac à zéro et tous les personnages à neuf, pour rejouer un scénario.
- Bouton **Ramener dans l'histoire** (Hôte) pour un personnage qui a succombé.
- Le bouton flottant ouvre *et* ferme le Dice Bag, et reste dans l'écran quand la fenêtre change de taille.

**Fiche de personnage**
- Reconstruite sur la gestion de formulaire native de Foundry et les éditeurs `<prose-mirror>` (Objectif, Notes, descriptions des Perks) : les champs se sauvegardent de façon fiable.
- **Perks** : Possédé / Strain / **Masquer** pour chaque Perk, Perks possédés en haut, Perks masqués grisés en bas et repliables depuis l'en-tête de la section ; Modifier et Supprimer au survol ; la description se déplie dans un encart.
- **Équipement** en étiquettes : clic pour faire un Check avec l'objet, clic droit pour renommer, marquer cassé/perdu (grisé et barré, conservé dans la liste) ou réparé, ou supprimer.
- Nouvelle **fiche de Perk** (nom, image, Possédé/Strain/Masqué, description).
- **Fenêtre de Check** : choix de l'Aspect et de l'objet, boutons 0/1/2 pour les Edges et les Flaws, interrupteurs pour l'Omen forcé par l'Hôte et le Check sans danger.

**Ambiance**
- Écran de titre plein écran chez tous les joueurs quand l'Hôte passe à l'Acte suivant.
- Cartes de chat : les dés sortent du sac un par un, le dé Omen qui blesse brille et pulse, le bandeau de Blessure tremble.
- Un personnage au seuil de mort pulse dans le Dice Bag.
- L'habillage de l'écran de pause tient à chaque pause (hook natif V14).
- Barre de token : Blessures affichées en jauge (valeur / seuil de mort).

**Technique**
- Suppression du code prévu pour d'anciennes versions de Foundry, des hooks obsolètes et du code mort.

## 0.1.x — journal de développement

- **Fiche de personnage** : 5 Aspects Fondamentaux (Courage, Évasion, Combat, Chance, Perception) + 5 Aspects d'Histoire à libellé libre, chacun avec Notation → TN calculé automatiquement, case Strain, et un bouton de Check direct. Sections Perks (liste libre, ajout/suppression), Équipement, Traits et Notes (éditeur ProseMirror).
- **Le Dice Bag** (panneau flottant, pas une fiche de personnage — voir 2e itération plus bas) : sac virtuel avec 8 dés Safe et jusqu'à 13 dés Omen, sélecteur d'Acte (Prologue/1/2/3), suivi de la réserve de l'Hôte vs dés en jeu, et rangée de Blessures pour chaque personnage avec bouton **Tricher la Mort**. Les données sont portées par un Acteur singleton caché de l'onglet Acteurs, avec permission **Propriétaire pour tous** : n'importe quel joueur peut tirer des dés sans dépendre de la présence de l'Hôte en ligne (seules les actions "Ajouter/Retirer du sac" et le changement d'Acte sont réservées à l'Hôte).
- **Moteur de Check** entièrement automatisé : tirage aléatoire dans le sac (2 à 4 d6 selon Edges/Flaws nets), règle des 2 plus hauts/plus bas, comparaison au TN (+ modificateur de difficulté), détection de Blessure (dé Omen ≤ Acte courant), mise à jour automatique de la Bourse et de la fiche, carte de résultat dans le chat.
- Thème graphique **Abyssal Omen** (rouge sombre / noir, polices Epilogue / Libre Caslon Text / JetBrains Mono) appliqué à la fiche, à la Bourse et aux cartes de chat.
- **Assets officiels intégrés** (`assets/branding/`, `assets/textures/`) : logo "13 OMENS" en bandeau sur la fiche et la Bourse, image de la Bourse (icône par défaut de l'Acteur singleton), image `showcase.png` déclarée en `background`/`media` dans `system.json` (visuel affiché sur l'écran de configuration de Foundry), textures papier/post-it en fond de la fiche et de la section Notes, et la **Death Icon** affichée en médaillon sur le portrait d'un personnage à 4/4 Blessures dans le suivi de la Bourse (26e itération).

### Correctifs et évolutions — 2e itération (retours de test en jeu réel)

- **TN qui ne se mettait pas à jour** au changement de Notation d'un Aspect : corrigé, voir 1re itération ci-dessous. Confirmé fonctionnel par l'utilisateur.
- **Fond avec marge noire visible** : `.window-content` de Foundry a un padding par défaut qui laissait un cadre noir autour de la texture papier. Retiré (`padding: 0`), l'espacement est maintenant géré par nos propres conteneurs.
- **Onglets Stats / Notes** : l'en-tête (portrait, nom, traits, Blessures) reste visible en permanence ; le corps de la fiche bascule entre "Stats" (Aspects/Perks/Gear) et "Notes" (éditeur ProseMirror) via deux onglets en haut à droite. Le changement d'onglet est géré en pur CSS/DOM (pas de re-rendu) pour ne jamais interrompre une édition ProseMirror en cours.
- **Portrait agrandi** au format portrait (110×150) plutôt qu'un petit carré. Cliquer dessus ouvre maintenant le sélecteur de fichier (action manquante dans la v0.1, corrigée au passage).
- **Titres de section réduits** (CORE ASPECTS, PERKS, etc.) : traités comme des labels discrets (petit, majuscule, monospace) plutôt que comme de gros titres de page.
- **Dice So Nice intégré** : chaque Check construit un vrai `Roll` Foundry (un terme `1d6` par dé tiré) évalué une seule fois, attaché au message de chat via `rolls`. C'est cette évaluation unique qui déclenche l'animation Dice So Nice automatiquement (hook `createChatMessage`) — le code n'appelle jamais `game.dice3d.showForRoll()` en plus, donc pas de jet en double. Deux colorsets sont enregistrés au hook `diceSoNiceReady` et forcés par dé via `term.options.flavor`/`term.options.appearance` : **Safe Dice** = noir/blanc, **Omen Dice** = rouge/noir. ⚠️ Cette intégration n'a pas pu être testée avec un vrai Dice So Nice installé — l'API exacte (noms de clés `addColorset`, `options.flavor` vs `options.appearance`) peut avoir légèrement changé selon la version du module ; à vérifier à la table et signaler si l'animation ne se déclenche pas ou si les couleurs ne sont pas prises en compte.
- **"La Bourse" renommée "Dice Bag"** partout (fr/en).
- **Dice Bag transformé en panneau flottant** (`Omens13DiceBagApp`, `module/apps/dice-bag-app.mjs`) : ce n'est plus une Actor Sheet — c'est une `ApplicationV2` pure, comme une boîte de dialogue, draggable/redimensionnable par défaut. L'Acteur `bourse` sert toujours de support de données en coulisses (permission Propriétaire pour tous, pour la synchronisation sans code réseau), mais son entrée est masquée de l'onglet Acteurs. Trois façons d'ouvrir le panneau (redondantes exprès, l'API des contrôles de scène n'a pas pu être testée en conditions réelles) :
  1. Bouton dans les contrôles de scène (barre d'outils à gauche du canvas) — **best-effort**, l'API a changé entre versions de Foundry V13/V14 et n'a pas pu être vérifiée en live.
  2. Raccourci clavier **Ctrl+Maj+D** (fiable, indépendant de l'API des contrôles de scène).
  3. Depuis la console ou une macro : `game.omens13.openDiceBag()`.

### Correctifs et évolutions — 3e itération (retours de test en jeu réel)

- **Notation par défaut vide** : ajout d'une Notation "vide" (`unset`, affichée `—`), sans TN associé, placée en tête du menu déroulant et devenue la valeur par défaut de tous les Aspects (Core comme Story) à la création d'un personnage. Le TN affiche `—` tant qu'aucune Notation n'est choisie, et le bouton de Check correspondant est désactivé (avec un message d'avertissement si on force le clic depuis la console) pour éviter un jet avec un TN indéfini.
- **Bouton "Éditer" sur les Story Aspects** : la ligne de titre "Aspects de l'Histoire" a maintenant un bouton crayon qui ouvre une boîte de dialogue listant les 5 emplacements, pour définir les libellés en un seul endroit plutôt qu'en tapant directement dans le tableau. La colonne "Aspect" du tableau Story Aspects est donc redevenue un simple texte (comme pour les Core Aspects), alignée strictement sur la même mise en page.
- **Mise en page des tableaux Core/Story Aspects unifiée et sans troncature** : les deux tableaux utilisent désormais un `table-layout: fixed` avec des largeurs de colonnes identiques et explicites ; le libellé d'Aspect peut revenir à la ligne plutôt que d'être coupé, et le menu déroulant de Notation a été élargi (et sa police légèrement réduite) pour ne plus tronquer "Terrible"/"Excellent" etc.

### Correctifs et évolutions — 4e itération (retours de test en jeu réel)

- **Bloc "Goal" dans l'en-tête** : nouveau champ `system.goal`, sous Traits, édité en ProseMirror (même mécanisme que les Notes). Volontairement compact (plus petit que l'éditeur de Notes) mais jamais tronqué : l'en-tête n'a pas de hauteur fixe ni de `overflow: hidden`, il grandit avec le contenu.
- **Blessures modifiables à la baisse (et à la hausse)** : deux boutons +/- apparaissent à côté du compteur de Blessures de chaque personnage dans le Dice Bag, visibles par le propriétaire du personnage (et l'Hôte). Comme le nombre de dés en Réserve est déjà calculé à partir du total des Blessures de tous les personnages, baisser une Blessure remet automatiquement le dé Omen correspondant en Réserve — aucun code supplémentaire n'était nécessaire pour "adapter les dés", c'était déjà la logique en place.
- **Le Dice Bag "disparu"** : depuis son passage en panneau flottant (voir 2e itération), il ne s'ouvrait plus que sur action manuelle (bouton de contrôle de scène best-effort, Ctrl+Maj+D, ou macro), ce qui le rendait invisible par défaut. Il s'ouvre maintenant automatiquement pour tous les clients au chargement du monde (avec une nouvelle tentative après 2 secondes si l'Hôte n'a pas encore fini de le créer). Il reste fermable/déplaçable/rouvrable normalement ensuite ; il se rouvrira simplement au prochain chargement.

### Correctifs et évolutions — 5e itération (retours de test en jeu réel)

- **Icônes de dés retirées** des tableaux d'Aspects pour gagner de la place : il n'y a plus de colonne dédiée au bouton de jet. Le TN lui-même est maintenant cliquable pour lancer le Check correspondant (surbrillance au survol) ; s'il est vide (Notation non choisie), le clic déclenche le même avertissement qu'avant plutôt qu'un jet.
- **En-têtes Core Aspects / Story Aspects strictement alignés** : la ligne "Core Aspects" porte maintenant un bouton EDIT invisible (même taille que le vrai bouton de "Story Aspects", juste caché) uniquement pour occuper le même espace — les deux en-têtes, et donc les deux tableaux, sont désormais à la même hauteur pixel près.

### Correctifs — 6e itération (retours de test en jeu réel, 20/08/2026)

- **Bouton "Dice Bag" qui ne rouvrait pas le panneau fermé** : le bouton de contrôle de scène appelait `toggle()`, et fournissait à la fois `onChange` ET `onClick` par prudence (le nom exact du callback ayant changé entre versions de Foundry). Si les deux se déclenchent pour un même clic, le `toggle()` s'annule lui-même (ouvre puis referme aussitôt), ce qui ne produit aucun effet visible — probablement la cause du bug signalé. Le bouton appelle maintenant systématiquement `render(true)` (ouverture, jamais de fermeture) : appelé deux fois de suite, ça n'a aucun effet indésirable. Pour fermer le panneau : son propre bouton de fermeture, ou Ctrl+Maj+D (un seul déclenchement garanti, donc toujours en `toggle()`).
- **Confirmation** : ce bouton n'a aucune vérification `game.user.isGM` nulle part dans le code (ni sur sa visibilité, ni sur ses callbacks) — il est censé être visible et fonctionnel pour l'Hôte ET tous les Joueurs. Non vérifié en jeu réel avec un compte Joueur à proprement parler.
- **Icônes de la barre de titre "cassées" (carrés vides)** : `DEFAULT_OPTIONS.classes` (`["omens13", ...]`) s'applique à l'élément extérieur de la fenêtre Foundry, qui contient aussi le chrome natif (titre, boutons minimiser/pop-out/fermer) — pas seulement notre propre contenu. Nos règles CSS génériques pour `button`/`h1` (police "Epilogue") s'appliquaient donc aussi à ces boutons natifs, écrasant leur police d'icônes et affichant des carrés vides à la place des glyphes. Corrigé en excluant `.header-control` (boutons natifs) et `.window-title` (titre natif) de nos règles.

### Correctifs — 7e itération (retours de test en jeu réel, 20/08/2026)

- **Le bouton de contrôle de scène ne rouvrait toujours pas le Dice Bag** (aucune erreur console) malgré le correctif de la 6e itération : impossible d'en identifier la cause exacte sans pouvoir tester en live, donc plutôt que de continuer à deviner l'API des contrôles de scène, **un nouveau bouton flottant "Dice Bag" a été ajouté directement au DOM** (bas droite de l'écran, visible pour tout le monde), avec son propre `addEventListener` — aucune dépendance à une API Foundry incertaine, donc un accès garanti de fonctionner. Le bouton de contrôle de scène et le raccourci Ctrl+Maj+D restent en place en accès redondants.
- **Cartes de résultat de Check reskinnées** : le "contour blanc" venait de la bulle de message par défaut de Foundry (thème clair introduit en V13) qui entourait notre carte déjà sombre. Neutralisée (fond/bordure/ombre supprimés) pour les messages de Check uniquement, identifiés via leur flag `flags.omens13.checkResult`.
- **Titre de la carte réduit** ("Courage", "Ghost Stormers Lore"...) : utilisait la taille par défaut d'un `<h3>` de navigateur, ramené à une taille plus sobre.
- **Filigrane du portrait** : le portrait du personnage qui a fait le jet apparaît maintenant en fond de carte, en transparence, derrière le résultat.

### Correctifs — 8e itération (retours de test en jeu réel, 20/08/2026)

- **Portrait en filigrane refait** dans le style "fond noir + portrait qui se révèle à droite avec un dégradé" (au lieu du filigrane discret en transparence uniforme de la 7e itération) : le portrait est dimensionné sur la hauteur de la carte (pas la largeur), pour en montrer le plus possible, et un dégradé horizontal mange progressivement l'image côté gauche (où sont le texte et les dés) pour la laisser presque intacte côté droit.
- **Confirmé fonctionnel : le bouton flottant Dice Bag**. Repositionné (`right: 320px` au lieu de `16px`) pour se placer entre la barre de macro et la sidebar de chat plutôt que collé au bord droit — valeur estimée sans pouvoir tester en live, à ajuster si besoin.

### Correctifs — 9e itération (retours de test en jeu réel, 20/08/2026)

- **Bouton de contrôle de scène supprimé** : n'a jamais fonctionné de manière fiable en jeu réel malgré deux tentatives de correctif (6e/7e itération) ; retiré du code plutôt que de continuer à deviner l'API. Le bouton flottant DOM (confirmé fonctionnel) et Ctrl+Maj+D restent les deux accès au Dice Bag.
- **Bouton flottant Dice Bag déplaçable à la souris** : plutôt que de continuer à deviner une position en pixels universelle (impossible à faire correctement pour tous les écrans, notamment ultra-wide), le bouton se glisse-dépose désormais librement, et sa position est mémorisée par client (réglage `diceBagFabPosition`, scope "client" — chaque utilisateur a la sienne, persistante entre les sessions). Un clic sans déplacement ouvre le Dice Bag ; un glissé (>4px) déplace le bouton sans l'ouvrir.
- **Portrait des cartes de Check retravaillé** : collé au bord droit (`background-position: right` au lieu de `center`, qui révélait parfois une bordure grise propre à l'image source plutôt que le personnage), et dégradé simplifié à un seul plateau + une seule pente continue (au lieu de plusieurs paliers) pour un blend plus fort et plus progressif côté gauche, sans effet de bande.

### Correctifs — 10e itération (retours de test en jeu réel, 20/08/2026)

- **Filigrane du portrait adouci** : le portrait était trop marqué et gênait la lecture de la carte. L'image porte maintenant une `opacity: 0.38` (portrait entier plus transparent, détail discret plutôt que présence dominante), et le dégradé passe de deux arrêts (plateau opaque + une seule pente) à six arrêts progressifs pour une transition graduelle entre le fond et l'avatar, sans coupure nette.

### Correctifs — 11e itération (retours de test en jeu réel, 20/08/2026)

- **Ligne de coupe du portrait éliminée** : malgré le dégradé progressif de la 10e itération, une arête restait visible côté gauche de l'avatar — cause identifiée : un calque de couleur semi-transparent posé par-dessus une image à opacité fixe reste "plat" (la photo elle-même ne s'estompe pas). Remplacé par un vrai `mask-image` dégradé (8 arrêts) directement sur l'image, qui fait disparaître progressivement les pixels eux-mêmes de gauche (transparent) à droite (opaque) — seule méthode donnant un fondu réellement continu. Le calque de couleur (`.portrait-fade`) est conservé en appoint, allégé, pour lisser la toute petite marge restante contre le fond de la carte. Opacité de base de l'image relevée à 0.55 (compensée par le masque, qui la fait déjà disparaître totalement côté gauche).

### Correctifs — 12e itération (retours de test en jeu réel, 20/08/2026)

- **Étirement du masque du portrait ajusté** : `mask-size` passé de `100% 100%` à `325% 100%` (valeur testée et validée en direct par l'utilisateur via les DevTools) — étire le dégradé du masque bien au-delà de la largeur de la carte, ce qui rend la disparition des pixels de l'image encore plus progressive à l'œil.
- **Bug corrigé : Nom et Traits du personnage non sauvegardés**. Ces deux champs utilisaient encore le binding générique par attribut `name` d'ApplicationV2 (`submitOnChange`), alors que tous les autres champs de la fiche (Aspects, Perks, Gear) avaient déjà été migrés vers un binding manuel explicite (`data-scope` + `actor.update()`) suite à un problème de fiabilité identique constaté plus tôt dans le développement. Nom et Traits suivent maintenant le même mécanisme fiable — ils devraient se sauvegarder normalement.

### Correctifs — 13e itération (retours de test en jeu réel, 20/08/2026)

- **Bug corrigé : tableaux d'Aspects trop larges / colonne Strain hors champ**. Cause : un item de CSS Grid a par défaut un `min-width: auto` basé sur le contenu le plus large de ses descendants (le `<select>` de Notation), et non sur la largeur qui lui est allouée — la grille des deux tableaux grandissait donc au-delà de la fiche, même avec `table-layout: fixed`. Corrigé avec `min-width: 0` sur les colonnes de la grille et sur le `<select>`.
- **Police des libellés d'Aspect changée** pour reprendre celle des champs Perks/Gear (JetBrains Mono, comme partout ailleurs dans les `<input>` du système) à la place de la police serif du corps de fiche, jugée moins lisible ici. Taille légèrement réduite. Le libellé ne passe plus jamais sur deux lignes (une seule ligne, ellipsis en filet de sécurité si un Story Aspect a un nom vraiment long).
- **Ligne d'Aspect entièrement cliquable** : le hover rouge et le clic pour lancer le Check, auparavant limités à la cellule TN, couvrent maintenant toute la ligne — à l'exception du `<select>` de Notation et de la case à cocher Strain, explicitement exclus pour ne jamais déclencher un jet accidentel en changeant l'un ou l'autre.

### Correctifs — 14e itération (retours de test en jeu réel, 20/08/2026)

- **Bug corrigé : la fin de la colonne "Strain" (en-tête + cases à cocher) restait coupée** malgré le correctif de la 13e itération. Cause : le `min-width: 0` posé sur les blocs Aspects supprimait bien le débordement de la grille, mais laissait ensuite les colonnes se comprimer SANS PLANCHER en dessous — au point d'écraser la case Strain si la fenêtre était redimensionnée plus étroite que sa largeur par défaut (760px). Remplacé par un plancher fixe de 260px par bloc Aspect : en dessous de cette largeur, c'est maintenant la fiche entière qui défile horizontalement plutôt que de couper du contenu.
- **Barre de défilement verticale ajoutée**. La fiche déclarait déjà `scrollable: [""]` côté Foundry (mémorisation de la position de scroll entre deux rendus), mais cette option ne fournit pas elle-même l'`overflow` CSS nécessaire pour qu'un scroll soit possible — tout contenu dépassant la hauteur de la fenêtre (beaucoup de Perks/Gear, fenêtre redimensionnée plus petite) était donc invisible, sans aucun moyen d'y accéder. `overflow-y: auto` (et `overflow-x: auto` en filet de sécurité symétrique) ajoutés sur le conteneur racine de la fiche. Le même correctif a été appliqué en prévention au panneau Dice Bag, qui avait exactement le même défaut latent.

### Correctifs — 15e itération (retours de test en jeu réel, 20/08/2026)

- **Barre de défilement thémée en rouge** : le scroll fonctionnait mais gardait le rendu par défaut du navigateur. `scrollbar-color`/`scrollbar-width` (Firefox) + pseudo-éléments `::-webkit-scrollbar*` (Chromium/Electron, le moteur de Foundry) ajoutés pour reprendre la couleur primaire du thème "Abyssal Omen".
- **Bug corrigé : colonne Strain toujours coupée**. Le plancher de 260px posé en 14e itération réglait le débordement de la grille, mais la répartition interne des colonnes laissait trop de place à Rating (34%) alors que "Terrible", le plus long des libellés de Notation, n'en a pas besoin. Rebalancé à Label 40% / Rating 25% / TN 17% / Strain 18% — Strain passe de 10% à 18%, largement de quoi afficher la case à cocher et son en-tête en entier.

### Correctifs — 16e itération (retours de test en jeu réel, 20/08/2026)

- **Encart "Goal" étiré jusqu'au bord du bloc d'en-tête**. L'éditeur ProseMirror ne reprenait pas automatiquement toute la largeur disponible malgré son parent flex column, d'où un espace vide à droite. `width: 100%; box-sizing: border-box;` ajouté sur l'éditeur et son contenu.
- **Bug corrigé : le bouton crayon "Éditer" pouvait chevaucher la dernière ligne du texte du Goal**. Il est positionné en `absolute` en haut à droite, sans espace réservé — un padding à droite du texte a été ajouté (sur Goal, et en prévention sur l'éditeur de Notes qui a le même mécanisme) pour qu'il ne passe plus jamais sous le texte.

### Correctifs — 17e itération (retours de test en jeu réel, 20/08/2026)

- **Encart "Goal" réellement étiré jusqu'au bord droit de l'en-tête, sous le bloc Blessures**. Le correctif de la 16e itération (`width: 100%`) ne suffisait pas : le bloc Goal restait de toute façon confiné à sa propre colonne flex (`.header-fields`), qui s'arrêtait avant la colonne dédiée à Blessures. Le badge Blessures passe maintenant en `position: absolute` (flottant, ancré en haut à droite de l'en-tête) au lieu d'occuper sa propre colonne — `.header-fields` (Nom, Traits, Goal) devient ainsi le seul bloc restant après le portrait et s'étend naturellement jusqu'au bord droit. Nom et Traits réservent l'espace du badge flottant via un padding à droite ; Goal, plus bas, n'en a pas besoin et comble bien l'espace vide signalé.

### Correctifs — 18e itération (retours de test en jeu réel, 20/08/2026)

- **Bug corrigé : Nom et Traits chevauchaient le badge Blessures flottant**. Le `padding-right` ajouté en 17e itération réservait bien l'espace du TEXTE, mais laissait la boîte des `<input>` elle-même (donc leur `border-bottom`, bien visible) s'étendre pleine largeur en dessous du badge. Remplacé par `margin-right`, qui réduit la boîte elle-même — Nom et Traits s'arrêtent maintenant proprement avant le badge, qui ne chevauche plus rien.

### Correctifs — 19e itération (retours de test en jeu réel, 20/08/2026)

- **Bug corrigé (définitivement) : chevauchement Nom/Traits × badge Blessures**. Après deux tentatives par ajustement de marge (padding puis margin, toujours un peu trop juste), le layout de l'en-tête est restructuré : Nom+Traits et le badge Blessures sont maintenant de vrais frères flex côte à côte dans une rangée dédiée (`.name-traits-row`), plutôt que Blessures en position flottante à deviner par-dessus. Un chevauchement entre eux devient structurellement impossible, plus besoin d'ajuster une valeur en pixels. L'encart Goal reste en dessous de cette rangée, dans sa propre ligne, et continue de s'étendre sur toute la largeur (y compris sous Blessures) comme demandé en 17e itération.

### Correctifs — 20e itération (retours de test en jeu réel, 20/08/2026)

- **Perks convertis en Items embarqués (au lieu d'un simple tableau de texte)**. Chaque Perk est désormais un vrai Document Foundry de type `perk` (nom + description ProseMirror + case "Actif"), avec sa propre fiche minimale (utile pour un futur usage en Compendium ou glisser-déposer). Sur la fiche de personnage, chaque Perk s'affiche en accordéon : une ligne toujours visible avec la case à cocher et le nom, un chevron pour déplier/replier la description en dessous. Un Perk nouvellement créé se déplie automatiquement pour saisir directement sa description.
- **Migration automatique des anciens Perks**. Au premier chargement du monde après la mise à jour, chaque personnage ayant encore d'anciens Perks au format tableau (`system.perks`) les voit automatiquement convertis en Items embarqués (nom, description et case "Actif" préservés). Cette migration est réservée à l'Hôte (GM) et ne s'exécute qu'une seule fois par personnage (elle est ignorée si des Items Perk existent déjà). **Point à vérifier en priorité** : que le Perk existant "Eager to Help" (ou équivalent) est bien retrouvé en Item après rechargement du monde.
- Ce changement touche la structure de données (`template.json`, nouveau DataModel `module/data/perk.mjs`, nouvelle fiche d'Item `module/sheets/item-perk-sheet.mjs`) et le contrôleur de la fiche de personnage (résolution du document cible — Actor ou Item — pour les champs manuels et l'éditeur ProseMirror). N'ayant pas pu être testé en jeu avant livraison, merci de valider en particulier : la sauvegarde du nom/case "Actif"/description de chaque Perk, l'ouverture/fermeture de l'accordéon, et la création/suppression d'un Perk.

### Correctifs — 21e itération (retours de test en jeu réel, 20/08/2026)

- **Bug corrigé : impossible de créer un Perk ("type: perk is not a valid type")**. Ce n'était pas un bug de code : `template.json` (qui déclare les types de Document valides) n'est relu par Foundry qu'au lancement d'un monde, pas à un simple rafraîchissement de page. Après un retour à l'écran Setup puis relancement du monde, le type `perk` est correctement reconnu.
- **Accordéon de description resserré**. Les `min-height` globaux des éditeurs ProseMirror (pensés pour les blocs Notes/Goal, plus grands) laissaient un bloc vide énorme pour une description de Perk courte. L'accordéon épouse maintenant la taille réelle du texte, avec un minimum réduit pour rester cliquable si la description est vide.
- **Titre du Perk cliquable, hover rouge, envoi au Chat**. Le nom du Perk est maintenant un texte cliquable (survol rouge, comme les lignes d'Aspect) qui poste une carte de chat thémée (nom + description) dans le tchat au clic — nouveau template `templates/chat/perk-card.hbs`. Comme un même clic ne peut pas à la fois renommer et envoyer au Chat, le renommage passe désormais par une icône crayon séparée à côté du titre, qui fait apparaître temporairement le champ de saisie (Entrée ou clic ailleurs referme le champ).
- **Police des descriptions (Notes/Goal/Perks) harmonisée sur Epilogue**. Aucune police n'avait jamais été fixée explicitement sur le contenu des éditeurs ProseMirror : le CSS coeur de Foundry imposait donc sa police système par défaut plutôt que l'une des polices du thème. Fixée maintenant explicitement sur Epilogue (police de corps de texte du thème) pour tous les éditeurs de la fiche.

### Correctifs — 22e itération (retours de test en jeu réel, 20/08/2026)

- **Cadres retirés autour des Perks**. Retour utilisateur : trop de cadres, composition à faire respirer. La carte encadrée (bordure + coins arrondis) autour de chaque Perk est remplacée par un simple filet de séparation en bas de ligne. La description, elle, n'a plus aucun cadre (ni bordure ni fond) : le texte flotte directement sur le fond de la fiche, légèrement indenté sous le titre pour se lire dans son prolongement visuel plutôt que comme un bloc à part.

### Correctifs — 23e itération (retours de test en jeu réel, 20/08/2026)

- **Boutons des Perks en mode fantôme / hover-only**. Seul le chevron "déplier" reste visible en permanence, mais désormais vraiment dépouillé de tout fond/bordure (un bug de spécificité CSS empêchait ce style depuis la 20e itération malgré la règle déjà présente). Les boutons crayon (renommer) et poubelle (supprimer), ainsi que le crayon "Éditer" de la description, sont maintenant masqués par défaut et n'apparaissent qu'au survol de la ligne concernée.
- **Cadre retiré autour du bloc GEAR**. Même traitement que les Perks (22e itération) : la boîte encadrée qui entourait toute la section Équipement disparaît, ne laissant qu'un peu d'espacement vertical. Chaque objet reste un champ de texte libre (donc individuellement bordé, contrairement aux Perks qui utilisent un titre cliquable) — Perks et Notes gardent leur encadré de section, non concernés par cette demande.

### Correctifs — 24e itération (retours de test en jeu réel, 20/08/2026)

- **Ordre et taille des icônes de Perk réarrangés**. Alignées à droite : Éditer (crayon), Effacer (poubelle, désormais à la même taille que le crayon), puis Déplier (chevron, même taille de boîte mais icône plus discrète). L'ordre précédent (crayon, chevron, poubelle) est remplacé par crayon, poubelle, chevron.
- **Correction du malentendu 23e itération sur GEAR** : la demande visait la présentation interne, pas le cadre de section. GEAR reprend maintenant exactement la présentation des Perks : un seul encadré autour de tout le bloc (comme avant la 23e itération), plus aucun cadre à l'intérieur (chaque ligne perd son fond/bordure de champ, remplacé par un simple filet de séparation entre lignes), et l'icône Effacer n'apparaît qu'au survol de la ligne, comme pour les Perks.

### Correctifs — 25e itération (retours de test en jeu réel, 20/08/2026)

- **Pop-up de Check reskinnée**. Le formulaire portait déjà la classe du thème, mais la fenêtre de la boîte de dialogue elle-même (et donc son pied de page avec les boutons "Draw dice"/"Cancel") ne la portait pas, et restait donc sur l'apparence par défaut de Foundry plutôt que le thème "Abyssal Omen". Corrigé en donnant la classe du thème à la fenêtre entière (même principe que les fiches d'Actor/Item).
- **Retours à la ligne excessifs corrigés**. Les libellés (ex. "Host-forced Omen (Facing Evil)") passaient un mot par ligne faute de place. La disposition passe d'un empilement libellé/champ à une ligne libellé + champ côte à côte, avec une largeur de fenêtre légèrement augmentée — un long libellé tient maintenant sur une ou deux lignes au lieu de six.

### Correctifs — 26e itération (retours de test en jeu réel, 20/08/2026)

- **Annulation d'un Cheat Death**. Un bouton "Annuler" (flèche de retour) remplace le bouton Cheat Death une fois celui-ci utilisé : il rend le dé Safe consommé et réinitialise les deux drapeaux d'usage (par Acte et par Histoire), pour corriger une manipulation faite par erreur. Réservé au propriétaire du personnage, comme le bouton Cheat Death original.
- **Sélecteur d'Acte (Story Act)** : ajout d'une remontée d'erreur explicite (notification + console) sur le changement d'Acte, pour que tout échec silencieux devienne visible au lieu de disparaître sans trace. Je n'ai pas pu reproduire le blocage signalé en local — si le souci persiste après cette mise à jour, un message d'erreur devrait maintenant s'afficher à l'écran (ou dans la console F12) : ce message est nécessaire pour identifier la cause exacte.
- **Tête de mort de Blessure repositionnée**. Elle n'apparaît plus dans la rangée de pips de Blessures (où elle était mal alignée) : elle est retirée de cette rangée (désormais uniquement des pastilles rouges uniformes) et apparaît en médaillon directement sur le portrait du personnage une fois à 4/4 Blessures (portrait grisé + tête de mort superposée).

### Correctifs — 27e itération (retours de test en jeu réel, 21/08/2026)

- **Diagnostic du sélecteur d'Acte (Story Act)** : inspection DOM en direct (merci pour le screenshot !) — les boutons Prologue/1/2/3 portaient l'attribut `disabled` en dur, alors que le code source actuel ne le pose que `{{#unless isGM}}` et que l'utilisateur était bien détecté Hôte pour ce rendu (les boutons "+ Add to bag"/"− Remove from bag", eux-mêmes conditionnés à `isGM`, s'affichaient et fonctionnaient). Ces deux faits ne peuvent cohabiter que si le navigateur affichait une version mise en cache du template `dice-bag.hbs`, antérieure au code livré — un F5 simple ne force pas toujours Foundry à revérifier un fichier de template déjà chargé une fois dans l'onglet. **Un rafraîchissement forcé (Ctrl+Maj+R / Cmd+Maj+R, pas un simple F5) est nécessaire pour être sûr de charger la dernière version.**
- **Numéro de version du système incrémenté (0.1.0 → 0.1.1)**. Il n'avait jamais changé depuis la création du système alors que le code a été mis à jour des dizaines de fois : rien ne signalait au navigateur/à Foundry qu'un fichier avait changé. Ce numéro sera incrémenté à chaque future livraison pour limiter ce genre de faux-négatif ("le correctif ne semble pas s'appliquer" alors qu'il est bien dans le code livré).

### Correctifs — 28e itération (retours de test en jeu réel, 21/08/2026)

- **Vrai bug trouvé pour le sélecteur d'Acte** (le hard refresh de la 27e itération n'a rien changé, ce n'était donc pas du cache) : dans `templates/apps/dice-bag.hbs`, la boucle `{{#each acts as |act|}}` faisait référence à `isGM` et `system.currentAct` **sans le préfixe `../`** nécessaire pour remonter au contexte du template depuis l'intérieur d'une boucle Handlebars — un classique du moteur de templates, déjà géré correctement ailleurs dans le système (`{{#each ../ratings as |r|}}` sur la fiche de personnage) mais oublié sur cette ligne précise. Résultat concret : `isGM` valait `undefined` à l'intérieur de la boucle, donc `{{#unless isGM}}disabled{{/unless}}` posait `disabled` sur les 4 boutons en permanence, pour tout le monde (Hôte inclus) ; et `system.currentAct` valait aussi `undefined`, donc aucun bouton ne pouvait jamais être marqué actif. Corrigé en `../system.currentAct` et `../isGM`.
- **Même bug corrigé par précaution sur les descriptions de Perk** : `{{editor perk.enrichedDescription ... editable=editable}}` (dans la boucle `{{#each perks as |perk|}}`) souffrait du même oubli — `editable` ne référençait pas le contexte général de la fiche mais tentait de le lire sur le Perk courant (qui n'a pas cette propriété), contrairement au même appel `{{editor}}` utilisé pour Goal/Notes hors de toute boucle. Corrigé en `editable=../editable`. Personne n'avait signalé de souci sur ce point précis, mais c'est exactement la même classe de bug — corrigé en même temps par cohérence.

### Correctifs — 29e itération (refonte du Dice Bag, retours de test en jeu réel, 21/08/2026)

- **Section "SAFE DICE" renommée "DICE BAG" et fusionnée avec les dés Omen dans le sac**. Les pastilles blanches (Safe) et rouges (Omen actuellement dans le sac) s'affichent maintenant côte à côte dans la même boîte, pour visualiser d'un coup d'œil le ratio réel de danger au tirage. Quand l'Hôte ajoute un dé Omen au sac ("+ Ajouter au sac"), une pastille rouge apparaît directement dans cette boîte.
- **Ligne "Omen Dice / In The Bag" supprimée**. La Réserve de l'Hôte garde sa propre section ("RESERVE (HOST)"), avec les boutons Ajouter/Retirer du sac inchangés, mais la sous-ligne "In The Bag" a disparu puisque son contenu vit désormais dans la boîte "DICE BAG".
- **Nouvelle 2e ligne par personnage dans le suivi des Blessures**, montrant les dés réellement en jeu devant lui : un petit dé Omen (rouge) par Blessure actuelle, et un dé Safe (blanc) si un Cheat Death a été utilisé cette histoire. Cette ligne n'existe dans l'interface que si elle a du contenu — invisible en début de partie, elle apparaît dès qu'un personnage encaisse sa première Blessure ou triche la mort.

### Correctifs — 30e itération (finitions du Dice Bag, retours de test en jeu réel, 21/08/2026)

- **Plus de pastille "vide" dans la boîte DICE BAG quand un Cheat Death est utilisé**. Les pastilles Safe suivaient jusqu'ici une capacité fixe de 8 (comme une jauge), donc un dé Safe consommé par un Cheat Death laissait une pastille "vide" visible à sa place. Elles fonctionnent maintenant comme les pastilles Omen : longueur dynamique, uniquement les dés réellement dans le sac, aucun emplacement vide affiché.
- **Tooltip "Dice actually in the bag (...)" supprimé** sous la boîte DICE BAG.
- **Tooltip du Story Act rendu dynamique** : au lieu d'un texte fixe rappelant les 3 seuils, il affiche maintenant uniquement le repère correspondant à l'Acte actuellement sélectionné (Prologue → "L'Hôte ajoute toujours 1 dé Omen à la fin du Prologue.", Acte 1 → "1 à 4 dés Omen.", Acte 2 → "5 à 8 dés Omen.", Acte 3 → "9 à 13 dés Omen.").

### Correctifs — 31e itération (dés Omen "inventés" par l'ajustement manuel des Blessures, 21/08/2026)

- **Bug corrigé : ajuster une Blessure à la main pouvait faire dépasser le total physique de 13 dés Omen**. Le nombre affiché en Réserve n'a jamais été une vraie valeur stockée — c'est un calcul (`13 − dés dans le sac − total des Blessures de tous les personnages`) refait à chaque affichage. Les boutons +/- du suivi des Blessures modifiaient uniquement la Blessure du personnage sans jamais toucher au sac ; quand la Réserve calculée était déjà à 0 (par exemple avec les 13 dés Omen dans le Dice Bag), ajouter encore une Blessure aurait dû faire passer ce calcul en négatif — au lieu de ça, il restait simplement affiché à 0, donnant l'impression qu'un 14e dé Omen venait d'apparaître de nulle part.
- **Correctif** : quand une Blessure est ajoutée à la main et que la Réserve n'a plus rien à donner, le dé manquant est maintenant prélevé directement dans le Dice Bag (le compteur de dés dans le sac diminue de 1 en plus de la Blessure). Retirer une Blessure ne change rien à ce comportement — la Réserve remonte simplement d'elle-même, sans risque d'inventer quoi que ce soit dans ce sens-là. Cette logique est centralisée dans une nouvelle fonction `adjustWound()` du moteur (`bourse-engine.mjs`), sur le même principe que la gestion des Blessures causées par un Check (qui décrémentait déjà correctement le sac).

### Correctifs — 32e itération (plafond de Blessures, Strain sur Aspects et Perks, 21/08/2026)

- **Bug corrigé : un personnage pouvait dépasser son maximum de Blessures (ex. 5/4 constaté en jeu)**. Le plafond existait déjà pour l'ajustement manuel des Blessures (boutons +/-) mais pas pour les Blessures causées automatiquement par un Check — corrigé, un personnage ne peut plus jamais dépasser son deathThreshold (4 par défaut), quelle que soit la source de la Blessure.
- **Strain d'Aspect : effet mécanique ajouté**. Cocher la case Strain d'un Aspect (Core ou Story) force désormais au moins 1 Flaw lors du prochain Check sur cet Aspect — le champ Flaws de la pop-up de jet démarre à 1 et ne peut plus redescendre en dessous tant que l'Aspect reste Strained.
- **Strain d'Aspect : effet visuel ajouté**. Toute la ligne d'un Aspect Strained change de look (fond teinté de rouge, nom en rouge), pour repérer d'un coup d'œil quels Aspects sont blessés.
- **Case "possédé" des Perks repensée**. Elle avait exactement le même look que la case Strain d'un Aspect, alors qu'elle représente autre chose (le joueur possède ce Perk). Elle devient un bouton rond rouge quand coché. Cocher un Perk le fait automatiquement remonter en haut de la liste des Perks.
- **Nouvelle case Strain sur les Perks**, ajoutée en bout de ligne (avant le bouton Modifier), toujours visible. Cochée, elle donne le même effet visuel que le Strain d'Aspect (nom en rouge, fond teinté) — mais sans aucun effet mécanique, purement visuel.

### Correctifs — 33e itération (finitions visuelles, 21/08/2026)

- **Cases Strain (Aspects ET Perks) restylées**. La 32e itération avait ajouté ces cases sans leur donner de style propre — elles retombaient sur l'apparence par défaut du thème de formulaires de Foundry (un carré plein doré/jaune une fois coché), très différent du nouveau bouton rond rouge "possédé" juste à côté sur les Perks, et incohérent avec la palette du système. Recodées en carré avec la même couleur d'accent que le bouton "possédé" (rouge plein une fois coché), pour qu'il n'y ait plus aucune trace de l'ancien style par défaut.
- **Texte d'indication supprimé sous l'onglet NOTES** ("Free-form character notes...").
- **Gras retiré des boutons de la barre d'outils ProseMirror** (B, titres, listes...) — ils héritaient d'un `font-weight` en gras du thème de formulaires de Foundry, jamais neutralisé jusqu'ici.
- **Taille des titres (H1/H2/H3...) réduite dans le texte tapé en ProseMirror**. Le H1 en particulier n'avait jamais de taille explicite dans le thème et retombait sur la taille par défaut du navigateur (environ 2x la taille du texte), démesurée dans une zone de texte aussi compacte que les fiches du système.

### Correctifs — 34e itération (retours de test en jeu réel, 21/08/2026)

- **Couleur du bouton rond "possédé" des Perks changée** : il était rouge depuis la 32e itération (même couleur que Strain), il repasse en jaune/doré pour être bien distinct visuellement des cases Strain (qui, elles, restent rouges).
- **Carte de chat Perk retravaillée** : l'icône propre du Perk (peu pertinente, un Perk n'en a en général pas) est retirée. À la place, le portrait du personnage propriétaire apparaît en filigrane, exactement comme sur la carte de résultat d'un Check.
- **Nouvelle carte de chat pour Cheat Death** : jusqu'ici, utiliser Cheat Death ne produisait aucun message de chat, juste un changement silencieux dans le Dice Bag. Une carte de chat thémée (portrait du personnage en filigrane) annonce désormais l'action : « [Nom] cheats Death! Be careful... there is one less Safe Die in the bag now! ».

### Correctifs — 35e itération (retour utilisateur, 21/08/2026)

- **Overlay "Game Paused" reskinné** : l'icône native de Foundry (qui tourne sur elle-même) est remplacée par la tête de mort du système, avec une pulsation douce et un halo rouge. Le texte "Game Paused" devient "Death Awaits..." (traduit "La Mort attend..." côté FR). Reskin appliqué en patchant le DOM de l'overlay coeur de Foundry au moment où il s'affiche — à confirmer en jeu, car cette UI n'a pas pu être testée en dehors d'une session Foundry réelle.

### Correctifs — 36e itération (retour utilisateur, 21/08/2026)

- **Flash de l'ancien logo/texte corrigé sur l'overlay "Game Paused"** : confirmé fonctionnel par l'utilisateur en 35e itération, mais l'ancienne icône et le texte "GAME PAUSED" apparaissaient encore quelques frames avant la bascule vers la tête de mort/« Death Awaits... ». L'icône n'est désormais plus changée par script (source du flash) mais directement en CSS, ce qui l'affiche déjà sous sa forme finale dès le tout premier affichage, sans transition visible. Le texte, qui dépend de la langue active, reste géré par script mais sans le petit délai qui causait le flash.

### Correctifs — 37e itération (retour utilisateur, avec capture d'écran, 21/08/2026)

- **Correction de la 36e itération annulée : l'icône native "GAME PAUSED" était réapparue en permanence**, pas juste le temps d'un flash. La technique CSS pure tentée en 36e itération pour remplacer l'icône ne s'est en réalité pas appliquée du tout dans le jeu. Retour à la méthode de la 35e itération (déjà confirmée fonctionnelle), qui remplace l'icône par script — la tête de mort et « Death Awaits... » s'affichent de nouveau normalement à la mise en pause.

### Correctifs — 38e itération (retour utilisateur, 21/08/2026)

- **Overlay "Game Paused" : le reskin ne survivait pas à un second cycle pause/dépause** — il fonctionnait à la mise en pause initiale, mais un nouveau cycle (dépause puis pause) faisait réapparaître l'icône et le texte natifs de Foundry. Le mécanisme de détection a été rendu beaucoup plus large et fiable (il surveille désormais tout changement pertinent du DOM, plutôt que de dépendre d'un ou deux signaux précis) pour rattraper systématiquement chaque bascule, pas seulement la première.

### Correctifs — 39e itération (retour utilisateur, dés Omen "inventés" via un Check automatique, 21/08/2026)

- **Bug corrigé — un dé Omen pouvait encore "apparaître de nulle part" lors d'une Blessure automatique (suite à un jet de dés), alors que ce bug avait déjà été corrigé pour l'ajustement manuel en 31e itération.** Deux causes distinctes dans `performCheck()` (`bourse-engine.mjs`) : (1) le sac était décrémenté AVANT la vérification du plafond de Blessures (deathThreshold) — un personnage déjà au maximum voyait quand même un dé sortir du sac sans qu'aucune Blessure ne soit enregistrée, faisant apparaître un dé de Réserve en trop ; (2) un dé Omen forcé par l'Hôte (Facing Evil) causant une Blessure ne touchait jamais la Bourse, reproduisant exactement le bug de la 31e itération sans jamais avoir reçu son correctif. Les deux sont corrigés en réécrivant l'étape d'application de la Blessure : le prélèvement dans la Bourse (sac, ou Réserve avec repli sur le sac si elle est déjà vide) n'a lieu QUE si la Blessure est réellement appliquée. Un dé de Blessure venant du sac lors d'un tirage normal n'a, lui, jamais eu ce problème (vérifié algébriquement : le sac et les Blessures varient toujours de +1/-1 en miroir).

### Correctifs — 40e itération (audit des mécaniques vs le livret, 22/08/2026)

- **Facing Evil : un Edge pouvait annuler entièrement le dé Omen forcé par l'Hôte, contrairement au livret ("An Omen Die added in this way must be rolled as part of the Check", p.8).** `performCheck()` ne comptait le dé Omen forcé dans le tirage que s'il restait un Flaw net après annulation par un Edge (`Math.min(facingEvilOmen, netFlaws)`) — un Edge qui annulait exactement ce Flaw faisait disparaître le dé Omen forcé du tirage. Corrigé : le dé Omen forcé est désormais toujours inclus dans le tirage (`Math.min(2, facingEvilOmen)`), un Edge qui l'annule ne fait plus que réduire d'autant le nombre de dés tirés en plus du sac, conformément au livret.
- **3 Blessures ou plus ne forçaient aucun Flaw mécanique sur les Checks, alors que le livret le prévoit explicitement ("they take a Flaw on all Checks", p.9), comme une source de Flaw distincte du Strain d'Aspect.** Le champ `wounds.hasPermanentFlaw` existait déjà mais ne servait qu'à l'affichage (texte rouge, ligne "critical" du Dice Bag). Corrigé en le transmettant à la pop-up de Check (`promptCheckOptions`), qui cumule désormais Strain d'Aspect et 3+ Blessures comme deux sources de Flaw indépendantes (jusqu'à 2 Flaws minimum si les deux sont actives en même temps, plafond du livret).

### Correctifs — 41e itération (Cheat Death, éligibilité et couplage à la Blessure, discuté puis codé avec l'utilisateur, 22/08/2026)

- **Point 4 de l'audit 40e itération, discuté avant tout code** : le livret (p.9) rend un personnage inéligible au Cheat Death "if their roll did not include any Safe Dice" — une condition sur le tirage PRÉCIS qui a causé la Blessure. Le code vérifiait à la place le stock global de dés Safe dans le sac (`safeDiceInBag <= 0`), une condition sans rapport. Résolu en ajoutant un bouton **Cheat Death directement sur la roll card** du Check concerné (`check-result.hbs`), plutôt qu'un drapeau global sur le personnage : `performCheck()` calcule désormais `cheatDeathEligible` (le tirage qui vient de causer CETTE Blessure précise contenait-il au moins un dé Safe parmi tous les dés tirés), figé dans `flags.omens13.checkResult` au moment du Check. Le bouton n'apparaît que si c'est le cas. Ça évite l'ambiguïté d'un simple drapeau "dernier tirage" qui n'aurait pas su distinguer plusieurs Blessures non résolues en attente sur le même personnage.
- **L'état "déjà utilisé cet Acte/cette histoire" ou "plus de dé Safe dans le sac" est réévalué à chaque affichage de la carte** (`activateCheckCardCheatDeath()`, `omens13.mjs`, accroché au même hook `renderChatMessageHTML`/`renderChatMessage` que le reste des cartes de chat 13 Omens), pas figé au moment du Check — le bouton se grise avec une infobulle expliquant pourquoi si l'un des deux s'applique au moment où le joueur regarde/clique, exactement comme `_prepareContext()` du Dice Bag recalcule `canCheatDeath` à chaque rendu.
- **Cheat Death retire désormais réellement la Blessure qu'il remplace, quand il est déclenché depuis la roll card.** Jusqu'ici (bug distinct découvert en discutant du point 4), `cheatDeath()` ne touchait jamais `wounds.value` — la Blessure auto-appliquée par le Check restait affichée même après un Cheat Death, obligeant à un second geste manuel ("-1 Blessure") totalement découplé pour vraiment "annuler" la Blessure. Corrigé en ajoutant un paramètre optionnel `removeWound` à `cheatDeath(actor, bourse, {removeWound})` : quand `true`, la fonction appelle `adjustWound(actor, bourse, -1)` juste après avoir dépensé le dé Safe et posé les drapeaux d'usage — réutilisant la logique de repli sur le sac déjà validée aux 31e/32e/39e itérations plutôt que de dupliquer un `actor.update()` brut (qui aurait risqué de réintroduire un 3e cas de "dés inventés"). Le bouton de la roll card appelle `cheatDeath(actor, bourse, {removeWound: true})` ; **le bouton autonome du Dice Bag continue d'appeler `cheatDeath(actor, bourse)` sans ce paramètre, comportement historique inchangé** — décision explicite de l'utilisateur de le garder comme filet de secours à la discrétion de l'Hôte (par exemple pour une Blessure ajoutée à la main, hors Check), sans le coupler à la Blessure.
- **L'annulation ("Annuler ce Cheat Death") reste volontairement manuelle** : décision explicite de l'utilisateur de ne PAS coupler automatiquement le sens inverse. `undoCheatDeath()` n'a pas changé (redonne le dé Safe, réinitialise les deux drapeaux d'usage) ; si l'Hôte veut aussi restaurer la Blessure annulée par erreur, il clique en plus sur "+1 Blessure" à la main.

### Correctifs — 1re itération

- Les champs Rating/Strain/Label d'Aspect (ainsi que Perks/Gear) sont synchronisés par un gestionnaire d'événement explicite (`actor.update()` avec le chemin exact) plutôt que par le binding générique de formulaire d'ApplicationV2, et le TN affiché est recalculé à chaque rendu directement depuis la table des Notations.
