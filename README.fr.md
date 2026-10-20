# 13 Omens — Système Foundry VTT (non-officiel)

*[Read in English](README.md)*

![13 Omens](assets/branding/showcase.png)

![La fiche de personnage, le Dice Bag et une carte de Check en jeu](assets/omens13sc.png)

> **Ce système a été entièrement conçu avec l'aide d'une IA** (Claude, Anthropic), sous la direction de SebsokK. Si ça vous pose un problème, personne ne vous oblige à l'utiliser.

Système Foundry VTT V13/V14 pour le jeu de rôle d'horreur narratif **13 Omens** (Paizo Inc., preview PZO62000E / PZO64001E). Non affilié à Paizo Inc.

## Installation

**Depuis Foundry** : *Systèmes de jeu → Installer un système*, puis collez l'URL du manifeste :

```
https://raw.githubusercontent.com/SebsokK/omens13/main/system.json
```

**À la main** : copiez le dossier `omens13/` dans `Data/systems/omens13` de vos données Foundry, redémarrez Foundry et créez un monde avec le système **13 Omens**.

Compatible avec Foundry V13 et V14.

## Fonctionnalités

### Fiche de personnage
- **5 Aspects Fondamentaux et 5 Aspects de l'Histoire** : choisissez une Notation, le TN se remplit tout seul. Les noms des Aspects de l'Histoire se définissent dans une seule fenêtre (ils changent à chaque histoire). Un clic sur la ligne d'un Aspect lance un Check.
- **Strain** sur chaque Aspect : un Aspect en Strain lance toujours avec au moins un Flaw.
- **Perks** : cochez ceux que le personnage possède (ils remontent en haut), **masquez** ceux qui ne sont pas choisis (grisés en bas, repliables depuis l'en-tête de la section). Un clic sur le nom d'un Perk l'envoie au chat ; Modifier et Supprimer apparaissent au survol ; la description se déplie en dessous.
- **Équipement** en étiquettes : un clic sur un objet lance un Check avec lui, un clic droit permet de le renommer, de le marquer **cassé ou perdu** (grisé et barré, conservé au cas où il serait réparé ou retrouvé) ou de le supprimer.
- Traits, Objectif et Notes avec l'éditeur de texte de Foundry.

### Les Checks
- La fenêtre de Check permet de choisir l'**Aspect**, la **difficulté**, l'**objet utilisé**, les **Edges et Flaws** (boutons 0/1/2), et deux interrupteurs : **Facing Evil** (l'Hôte ajoute un dé Omen au Check) et **Check sans danger** (Harmless).
- Les Flaws obligatoires sont appliqués automatiquement : Aspect en Strain, et 3 Blessures ou plus (une source distincte).
- Un objet intact donne un Edge, un objet cassé un Flaw.
- Les dés sont tirés au hasard dans le sac commun, on garde les deux plus hauts ou les deux plus bas, et on compare au TN. Un dé Omen inférieur ou égal à l'Acte en cours inflige une Blessure (une seule par Check au maximum), ou une Strain sur un Check sans danger.
- La carte de chat montre chaque dé (Safe ou Omen, tiré du sac ou ajouté par Facing Evil) ; le dé Omen qui blesse brille en rouge.
- Compatible **Dice So Nice** : dés Safe en noir et blanc, dés Omen en rouge.

### Le Dice Bag
Un panneau flottant (bouton en forme de sac, ou **Ctrl+Maj+D**) partagé par toute la table :
- les dés du sac (8 dés Safe, plus les dés Omen ajoutés par l'Hôte) et la Réserve de 13 dés Omen de l'Hôte ;
- l'**Acte** en cours (Prologue, 1, 2, 3), réglé par l'Hôte ;
- les Blessures de chaque personnage, et les dés réellement posés devant lui.

N'importe quel joueur peut tirer des dés, même si l'Hôte n'est pas connecté. Ajouter ou retirer des dés Omen, changer d'Acte et choisir les personnages sont réservés à l'Hôte.

### Tromper la mort et la mort
- **Tromper la mort** (depuis la carte de Check ou le Dice Bag) : la Blessure est remplacée par un dé Safe retiré définitivement du sac, et le dé Omen retourne dans le sac. Une fois par Acte pour toute la table, une fois par histoire pour chaque personnage, et seulement si le jet contenait un dé Safe. Annulable.
- À la dernière Blessure, le personnage peut encore tromper la mort, ou **Succomber** : tous les dés devant lui retournent dans le sac et il quitte l'histoire.
- **Taille du groupe** (p.27) : le seuil de mort suit le nombre de personnages choisis dans le Dice Bag (6 Blessures à 1 personnage, 5 à 2, 4 à 3 ou 4, 3 à 5, 2 puis 3 à 6).

### Ambiance
- Quand l'Hôte passe à l'Acte suivant, chaque joueur voit un écran de titre (*« Acte II — Le mal se révèle. »*).
- Les dés tombent un par un sur la carte de chat, le dé Omen qui blesse pulse, le bandeau de Blessure tremble.
- Un personnage mourant pulse dans le Dice Bag.
- Écran de pause aux couleurs du jeu, barre de token pour les Blessures.

## Mener une histoire

1. Créez les personnages (ou les prétirés) et donnez à chaque joueur la propriété du sien.
2. Dans le Dice Bag, choisissez les personnages qui jouent l'histoire avec le bouton **👥**.
3. Jouez le Prologue, ajoutez le premier dé Omen au sac à sa fin, puis avancez dans les Actes au fil des dés Omen mis en jeu.
4. Pour rejouer l'histoire, cliquez sur **Nouvelle histoire** dans le Dice Bag : le sac est remis à zéro et tous les personnages sont remis à neuf (Notations, Perks et équipement sont conservés).

## Laissé à l'Hôte

Ces règles relèvent de la narration et ne sont pas automatisées : **Sacrifice héroïque** (Valiant Sacrifice), **Checks risqués** (Strain, perte d'un objet ou d'un Perk en cas d'échec), le retrait gratuit d'une Strain pour les groupes de 3, le Temps emprunté (Borrowed Time) et les Esprits persistants (Lingering Spirits).

## Limites connues

- Pas encore de jet privé, réservé au MJ ou aveugle pour les Checks.
- Les polices sont chargées depuis Google Fonts : hors ligne, Foundry utilise les polices du système.
- Si un joueur ne voit pas un personnage dans le Dice Bag, donnez-lui au moins la permission Observateur sur ce personnage.

## Journal des modifications

Voir [CHANGELOG.fr.md](CHANGELOG.fr.md).

## Crédits

13 Omens est une création de Paizo Inc. Ce système Foundry est un outil non-officiel réalisé par un fan pour sa propre table ; il ne reproduit aucun texte de règles protégé au-delà des mécaniques nécessaires à son fonctionnement.
