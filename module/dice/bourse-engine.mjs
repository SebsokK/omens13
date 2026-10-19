import { DIFFICULTY_MODIFIER, TOTAL_OMEN_DICE, DEFAULT_SAFE_DICE, DSN_COLORSET_SAFE, DSN_COLORSET_OMEN } from "../helpers/constants.mjs";

/**
 * Moteur de résolution des Checks 13 Omens : tirage dans la Bourse (sac virtuel),
 * application des règles Edge/Flaw, calcul du résultat et des Blessures.
 *
 * Toute la mécanique décrite p.7-10 du livret de règles est centralisée ici pour
 * que la fiche de personnage et le HUD de la Bourse partagent exactement la même logique.
 */

/* -------------------------------------------- */
/*  Accès à l'Acteur singleton "Bourse"          */
/* -------------------------------------------- */

/**
 * Récupère l'Acteur "Bourse" unique du monde. Le crée (permission OWNER pour tous)
 * si un MJ est connecté et qu'aucune Bourse n'existe encore.
 */
export async function getOrCreateBourse() {
  let bourse = game.actors?.find(a => a.type === "bourse");
  if (bourse) return bourse;

  if (!game.user.isGM) {
    ui.notifications?.warn(game.i18n.localize("OMENS13.Bourse.WaitingForGM"));
    return null;
  }

  bourse = await Actor.create({
    name: game.i18n.localize("OMENS13.Bourse.DefaultName"),
    type: "bourse",
    img: "systems/omens13/assets/branding/logo-compact.png",
    ownership: { default: CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER }
  });
  return bourse;
}

export function getBourseSync() {
  return game.actors?.find(a => a.type === "bourse") ?? null;
}

/* -------------------------------------------- */
/*  Tirage aléatoire dans le sac                 */
/* -------------------------------------------- */

/**
 * Tire aléatoirement `count` dés depuis un sac composé de `safeCount` dés Safe
 * et `omenCount` dés Omen, sans remise (tirage simultané classique "sac de billes").
 * @returns {("safe"|"omen")[]}
 */
function drawFromBag(safeCount, omenCount, count) {
  const pool = [];
  for (let i = 0; i < safeCount; i++) pool.push("safe");
  for (let i = 0; i < omenCount; i++) pool.push("omen");

  const drawn = [];
  const n = Math.min(count, pool.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    drawn.push(pool.splice(idx, 1)[0]);
  }
  return drawn;
}

/**
 * Construit et évalue un vrai Roll Foundry pour N dés d6, un terme par dé, en taguant
 * chaque terme avec le colorset Dice So Nice correspondant à son type (Safe/Omen).
 * Un seul Roll = une seule évaluation = un seul jet animé par Dice So Nice (pas de doublon) :
 * on n'appelle jamais `game.dice3d.showForRoll()` manuellement ailleurs, l'animation se
 * déclenche automatiquement via le hook `createChatMessage` quand ce Roll est attaché
 * au message de chat (voir chat-card.mjs).
 * @param {("safe"|"omen")[]} types
 * @returns {Promise<{roll: Roll, values: number[]}>}
 */
async function rollDice(types) {
  const DieCls = foundry.dice.terms.Die;
  const formula = types.map(() => "1d6").join(" + ");
  const roll = new Roll(formula);

  const dieTerms = roll.terms.filter(t => t instanceof DieCls);
  dieTerms.forEach((term, i) => {
    const colorset = types[i] === "safe" ? DSN_COLORSET_SAFE : DSN_COLORSET_OMEN;
    term.options = term.options ?? {};
    // Deux clés différentes pour couvrir plusieurs versions de l'API Dice So Nice
    // (flavor sur les anciennes, appearance.colorset sur les plus récentes).
    term.options.flavor = colorset;
    term.options.appearance = { colorset };
  });

  await roll.evaluate();

  const values = dieTerms.map(term => term.results[0].result);
  return { roll, values };
}

/* -------------------------------------------- */
/*  Résolution d'un Check                        */
/* -------------------------------------------- */

/**
 * @param {object} params
 * @param {Actor} params.actor            Le personnage qui fait le jet.
 * @param {string} params.aspectLabel     Libellé affiché de l'Aspect (ex. "Evade", "Charm").
 * @param {string} [params.aspectPath]    Chemin de l'Aspect testé (ex. "core.evade"), pour y poser la
 *   Strain d'un Check sans danger.
 * @param {number} params.baseTn          TN de base de l'Aspect (avant difficulté).
 * @param {keyof DIFFICULTY_MODIFIER} [params.difficulty="average"]
 * @param {number} [params.edges=0]       Nombre d'Edges déclarés (0-2).
 * @param {number} [params.flaws=0]       Nombre de Flaws déclarés (0-2), hors Facing Evil.
 * @param {number} [params.facingEvilOmen=0]  Dés Omen ajoutés directement par l'Hôte comme Flaw (Facing Evil, p.8).
 * @param {boolean} [params.harmless=false]   Check sans risque réel (p.11/23) : un Omen Die qui toucherait
 *   ne donne pas de Blessure, mais une Strain à la place, et le dé retourne au sac.
 * @param {(dice: {type: string, source: string}[]) => Promise<boolean>} [params.askSacrifice]
 *   Appelée après le tirage et avant le lancer quand un Sacrifice héroïque est possible
 *   (voir canSacrifice()) ; renvoie true si le joueur se sacrifie.
 * @returns {Promise<object>} Le résultat complet du Check (pour la carte de chat) ; pour un
 *   sacrifice, `{ actor, aspectLabel, sacrifice: true, dice }`.
 */
export async function performCheck({
  actor,
  aspectLabel,
  aspectPath,
  baseTn,
  difficulty = "average",
  edges = 0,
  flaws = 0,
  facingEvilOmen = 0,
  harmless = false,
  askSacrifice
} = {}) {
  const bourse = await getOrCreateBourse();
  if (!bourse) return null;

  // 1. Neutralisation Edge/Flaw (p.8), plafonnée à 2 de chaque côté.
  edges = Math.clamp(edges, 0, 2);
  const totalFlawSources = Math.max(0, Math.min(2, flaws)) + Math.max(0, facingEvilOmen);
  let net = edges - totalFlawSources;
  net = Math.max(-2, Math.min(2, net));
  const netEdges = Math.max(0, net);
  const netFlaws = Math.max(0, -net);

  const totalDiceNeeded = 2 + netEdges + netFlaws;

  // 2. Bug corrigé (40e itération, audit du livret) — les dés Omen "Facing Evil"
  //    forcés par l'Hôte sont un Flaw pas comme les autres : le livret dit
  //    explicitement "An Omen Die added in this way must be rolled as part of
  //    the Check" (p.8). Contrairement à un Flaw normal, un Edge qui l'annule
  //    ne le fait PAS disparaître du tirage — il réduit seulement d'autant le
  //    nombre de dés tirés EN PLUS du sac ("they simply draw one fewer die
  //    from the bag"). L'ancien code (`Math.min(facingEvilOmen, netFlaws)`)
  //    faisait l'inverse : un Edge annulant exactement ce Flaw faisait
  //    disparaître le dé Omen forcé entièrement, ce qui contredisait le livret
  //    et permettait à un joueur de neutraliser un Omen forcé par l'Hôte.
  //    `totalDiceNeeded` (calculé plus haut) reste toujours >= forcedOmenUsed
  //    puisqu'il vaut au minimum 2 et que forcedOmenUsed est plafonné à 2.
  const forcedOmenUsed = Math.min(2, Math.max(0, facingEvilOmen));
  const remainingToDraw = totalDiceNeeded - forcedOmenUsed;

  const bourseSystem = bourse.system;
  const drawnFromBag = drawFromBag(bourseSystem.safeDiceInBag, bourseSystem.omenInBag, remainingToDraw);

  const diceSpecs = [
    ...Array(forcedOmenUsed).fill(0).map(() => ({ type: "omen", source: "reserve" })),
    ...drawnFromBag.map(type => ({ type, source: "bag" }))
  ];

  // Sacrifice héroïque (p.9) : décidé après le tirage, avant de lancer les dés.
  if (askSacrifice && canSacrifice(actor, diceSpecs) && await askSacrifice(diceSpecs)) {
    await removeFromStory(actor, bourse, { forcedOmens: forcedOmenUsed });
    return { actor, aspectLabel, sacrifice: true, dice: diceSpecs };
  }

  const { roll, values } = await rollDice(diceSpecs.map(d => d.type));
  const dice = diceSpecs.map((d, i) => ({ ...d, value: values[i] }));

  // 3. Sélection des 2 dés utilisés pour le résultat.
  const sorted = [...dice].sort((a, b) => a.value - b.value);
  let used;
  if (netEdges > 0) used = sorted.slice(-2);       // 2 plus hauts
  else if (netFlaws > 0) used = sorted.slice(0, 2); // 2 plus bas
  else used = sorted;                               // exactement 2 dés

  const total = used.reduce((sum, d) => sum + d.value, 0);
  const difficultyMod = DIFFICULTY_MODIFIER[difficulty] ?? 0;
  const effectiveTn = baseTn + difficultyMod;

  let outcome = "failure";
  if (total > effectiveTn) outcome = "success";
  else if (total === effectiveTn) outcome = "successComplication";

  // 4. Blessure : tout dé Omen tiré (utilisé ou non dans le résultat) dont la valeur <= Acte courant.
  const act = bourseSystem.currentAct;
  const omenTriggers = act > 0 ? dice.filter(d => d.type === "omen" && d.value <= act) : [];

  let woundApplied = false;
  let strainFromHarmless = false;
  let woundDie = null;
  // 41e itération : n'est mis à `true` QUE si ce Check précis vient réellement
  // d'ajouter une Blessure (voir plus bas, `next !== current`) ET que le
  // tirage contenait au moins un dé Safe parmi TOUS les dés tirés (pas
  // seulement les 2 utilisés pour le résultat) — condition exacte du livret
  // (p.9, Cheat Death) : "if their roll did not include any Safe Dice". Utilisé
  // par chat-card.mjs#postCheckCard() pour proposer le bouton Cheat Death
  // directement sur la roll card, avec la garantie de porter sur LE bon
  // tirage (contrairement à un drapeau global qui ne saurait pas distinguer
  // plusieurs Blessures non résolues en attente).
  let cheatDeathEligible = false;

  if (omenTriggers.length > 0) {
    woundDie = omenTriggers[0]; // une seule Blessure max par Check, même avec plusieurs Omen Dice (p.9)
    if (harmless) {
      strainFromHarmless = true; // le dé retourne au sac, pas de Blessure (p.23)
    } else {
      woundApplied = true;
    }
  }

  // 5. Application de la Blessure (39e itération : entièrement réécrite).
  //    Bug corrigé — deux causes distinctes pouvaient faire "apparaître" ou
  //    "disparaître" un dé Omen par rapport au total physique de TOTAL_OMEN_DICE :
  //
  //    (a) Le prélèvement dans la Bourse (sac ou Réserve) avait lieu AVANT la
  //        vérification du plafond de Blessures (deathThreshold). Si le personnage
  //        était déjà au maximum, le dé sortait quand même du sac alors qu'aucune
  //        Blessure n'était enregistrée en face : le dé disparaissait purement et
  //        simplement, ce qui fait mécaniquement "apparaître" un dé de Réserve en
  //        trop (la Réserve dérivée = TOTAL - sac - Blessures augmente alors que
  //        rien ne le justifie). Corrigé en ne touchant à la Bourse QUE si la
  //        Blessure est réellement appliquée (`next !== current`).
  //    (b) Un dé Omen forcé par l'Hôte (Facing Evil, source "reserve" — vient de
  //        la Réserve, pas du sac) qui causait une Blessure ne décrémentait RIEN
  //        du tout : exactement le bug corrigé en 31e itération pour l'ajustement
  //        manuel (adjustWound()), mais jamais reporté ici. Si la Réserve dérivée
  //        était déjà à 0 au moment de cette Blessure, elle passait mathématiquement
  //        en négatif mais restait clampée à 0 à l'affichage — un dé Omen semblait
  //        alors sortir de nulle part côté sac/Blessures. Corrigé en reproduisant
  //        ici la même logique que adjustWound() : si la Réserve n'a plus rien à
  //        donner, le dé manquant est prélevé directement dans le sac.
  //    Un dé de Blessure venant du sac (source "bag"), lui, n'a jamais eu ce
  //    problème : le sac et les Blessures varient d'exactement +1/-1 en miroir,
  //    la Réserve dérivée ne bouge donc jamais dans ce cas (vérifié algébriquement).
  if (woundApplied) {
    const current = actor.system.wounds.value;
    const max = actor.system.wounds.deathThreshold;
    const next = Math.min(max, current + 1);

    if (next !== current) {
      if (woundDie.source === "bag") {
        // Les autres dés tirés (hors celui devenu Blessure) retournent déjà
        // implicitement au sac : le compteur n'a jamais été modifié à leur sujet
        // (drawFromBag() est un tirage purement virtuel, non persisté).
        await bourse.update({ "system.omenInBag": Math.max(0, bourseSystem.omenInBag - 1) });
      } else if (woundDie.source === "reserve") {
        const totalWoundsBefore = game.actors
          .filter(a => a.type === "character")
          .reduce((sum, a) => sum + (a.id === actor.id ? current : a.system.wounds.value), 0);
        const reserveBefore = Math.max(0, TOTAL_OMEN_DICE - bourseSystem.omenInBag - totalWoundsBefore);
        if (reserveBefore <= 0) {
          await bourse.update({ "system.omenInBag": Math.max(0, bourseSystem.omenInBag - 1) });
        }
      }
      await actor.update({ "system.wounds.value": next });

      // 41e itération, voir déclaration de cheatDeathEligible plus haut.
      cheatDeathEligible = dice.some(d => d.type === "safe");
    }
  } else if (strainFromHarmless && aspectPath) {
    // Check sans danger (p.11) : Strain sur l'Aspect testé à la place de la
    // Blessure ; le dé Omen n'a jamais quitté le sac. L'Hôte peut la retirer en
    // décochant la case Strain sur la fiche.
    await actor.update({ [`system.${aspectPath}.strain`]: true });
  }

  return {
    actor,
    aspectLabel,
    baseTn,
    difficulty,
    difficultyMod,
    effectiveTn,
    edges,
    flaws,
    facingEvilOmen,
    netEdges,
    netFlaws,
    harmless,
    dice,
    used,
    total,
    outcome,
    woundApplied,
    woundDie: woundApplied ? woundDie : null,
    cheatDeathEligible,
    strainFromHarmless,
    act,
    roll
  };
}

/* -------------------------------------------- */
/*  Actions annexes sur la Bourse                */
/* -------------------------------------------- */

/** L'Hôte ajoute un dé Omen depuis sa réserve directement dans le sac (p.8, "Story"). */
export async function addOmenToBag(bourse, count = 1) {
  const next = Math.min(TOTAL_OMEN_DICE, bourse.system.omenInBag + count);
  await bourse.update({ "system.omenInBag": next });
}

/** Retire un dé Omen du sac pour le remettre en réserve (correction manuelle / annulation). */
export async function removeOmenFromBag(bourse, count = 1) {
  const next = Math.max(0, bourse.system.omenInBag - count);
  await bourse.update({ "system.omenInBag": next });
}

export async function setCurrentAct(bourse, act) {
  await bourse.update({ "system.currentAct": Math.max(0, Math.min(3, act)) });
}

/**
 * Raison pour laquelle ce personnage ne peut pas tromper la mort maintenant
 * (clé de traduction), ou null s'il le peut. Règles p.9 : une seule fois par
 * histoire pour ce personnage, une seule fois par Acte pour toute la table, et
 * il faut une Blessure à remplacer et un dé Safe dans le sac. La condition "le
 * jet contenait au moins un dé Safe" dépend du tirage et se vérifie à part
 * (voir cheatDeathEligible dans performCheck()).
 */
export function cheatDeathBlocker(actor, bourse) {
  if (!bourse) return "OMENS13.Bourse.NotReady";
  if (actor.system.outOfStory) return "OMENS13.Bourse.OutOfStory";
  if (actor.system.cheatDeath.usedThisStory) return "OMENS13.Bourse.CheatDeathStoryUsed";
  const act = bourse.system.currentAct;
  const tableUsedThisAct = game.actors.some(a => a.type === "character" && a.system.cheatDeath.act === act);
  if (tableUsedThisAct) return "OMENS13.Bourse.CheatDeathActUsed";
  if (actor.system.wounds.value <= 0) return "OMENS13.Bourse.NoWoundToCheat";
  if (bourse.system.safeDiceInBag <= 0) return "OMENS13.Bourse.NoSafeDiceLeft";
  return null;
}

/**
 * Cheat Death (p.9) : la Blessure qui vient d'être reçue est remplacée par un
 * dé Safe posé devant le personnage. Le dé Omen n'étant plus gardé devant lui,
 * il retourne au sac comme les autres dés du Check ; le dé Safe, lui, quitte
 * définitivement le sac — le sac devient donc plus dangereux pour tout le monde.
 * Le dé Safe ne compte pas dans les Blessures.
 */
export async function cheatDeath(actor, bourse) {
  const blocker = cheatDeathBlocker(actor, bourse);
  if (blocker) {
    ui.notifications?.warn(game.i18n.localize(blocker));
    return false;
  }

  await bourse.update({
    "system.safeDiceInBag": bourse.system.safeDiceInBag - 1,
    "system.omenInBag": Math.min(TOTAL_OMEN_DICE, bourse.system.omenInBag + 1)
  });
  await actor.update({
    "system.wounds.value": actor.system.wounds.value - 1,
    "system.cheatDeath.usedThisStory": true,
    "system.cheatDeath.act": bourse.system.currentAct
  });
  return true;
}

/**
 * Ajuste manuellement les Blessures d'un personnage (boutons +/- du Dice Bag,
 * 30e→31e itération). Le total de dés Omen (Réserve + Sac + Blessures de tous les
 * personnages) est physiquement plafonné à `TOTAL_OMEN_DICE` (13) — la Réserve
 * affichée n'est qu'une valeur DÉRIVÉE (`TOTAL_OMEN_DICE - omenInBag - totalWounds`,
 * voir `_prepareContext` de `dice-bag-app.mjs`), jamais stockée. Ajouter une
 * Blessure sans jamais toucher au sac laissait ce total dépasser 13 dès que la
 * Réserve dérivée était déjà à 0 : la formule devenait négative mais restait
 * clampée à 0 à l'affichage (`Math.max(0, ...)`), donnant l'impression qu'un dé
 * Omen supplémentaire venait d'être inventé. Ici, si la Réserve (calculée AVANT
 * cette Blessure) n'a plus rien à donner, le dé manquant est prélevé directement
 * dans `omenInBag` à la place — cohérent avec `performCheck()` ci-dessus, où une
 * Blessure causée par un dé réellement tiré du sac décrémente déjà `omenInBag`.
 * Retirer une Blessure ne touche jamais au sac : la Réserve dérivée augmente
 * simplement d'elle-même, sans risque de dépassement dans ce sens.
 */
export async function adjustWound(actor, bourse, delta) {
  if (actor.system.outOfStory) return false;
  const current = actor.system.wounds.value;
  const max = actor.system.wounds.deathThreshold;
  const next = Math.max(0, Math.min(max, current + delta));
  if (next === current) return false;

  if (next > current) {
    const totalWoundsBefore = game.actors
      .filter(a => a.type === "character")
      .reduce((sum, a) => sum + (a.id === actor.id ? current : a.system.wounds.value), 0);
    let reserve = Math.max(0, TOTAL_OMEN_DICE - bourse.system.omenInBag - totalWoundsBefore);
    let omenInBag = bourse.system.omenInBag;
    for (let w = current; w < next; w++) {
      if (reserve > 0) reserve -= 1;
      else omenInBag = Math.max(0, omenInBag - 1);
    }
    if (omenInBag !== bourse.system.omenInBag) {
      await bourse.update({ "system.omenInBag": omenInBag });
    }
  }

  await actor.update({ "system.wounds.value": next });
  return true;
}

/**
 * Annule un Cheat Death déclenché par erreur : exact inverse de cheatDeath()
 * — le dé Safe revient au sac, le dé Omen en ressort pour redevenir une Blessure.
 */
export async function undoCheatDeath(actor, bourse) {
  if (!actor.system.cheatDeath.usedThisStory || actor.system.outOfStory) return false;

  await bourse.update({
    "system.safeDiceInBag": Math.min(DEFAULT_SAFE_DICE, bourse.system.safeDiceInBag + 1),
    "system.omenInBag": Math.max(0, bourse.system.omenInBag - 1)
  });
  await actor.update({
    "system.wounds.value": Math.min(actor.system.wounds.deathThreshold, actor.system.wounds.value + 1),
    "system.cheatDeath.usedThisStory": false,
    "system.cheatDeath.act": null
  });
  return true;
}

/**
 * Sacrifice héroïque possible (p.9) : le personnage est à une Blessure de la
 * mort (selon la taille du groupe) et le tirage contient au moins un dé Omen,
 * y compris un Omen forcé par l'Hôte.
 */
export function canSacrifice(actor, dice) {
  const { value, deathThreshold } = actor.system.wounds;
  return !actor.system.outOfStory && value === deathThreshold - 1 && dice.some(d => d.type === "omen");
}

/**
 * Death and Despair (p.9) : le personnage qui a son dernier dé Omen ne participe
 * plus à l'histoire, et TOUS les dés devant lui retournent au sac — ses dés Omen
 * de Blessure comme le dé Safe d'un éventuel Cheat Death. Déclenché à la main
 * (pas au moment de la Blessure) pour laisser au joueur la possibilité de
 * tromper la mort sur cette dernière Blessure.
 */
export async function succumb(actor, bourse) {
  if (actor.system.outOfStory || !actor.system.wounds.isDead) return false;
  await removeFromStory(actor, bourse);
  return true;
}

/**
 * Retire un personnage de l'histoire (mort ou Sacrifice héroïque) : ses dés
 * Omen, le dé Safe d'un Cheat Death, et les Omen forcés par l'Hôte sur le
 * Check en cours (`forcedOmens`, sortis de la Réserve) retournent au sac.
 */
async function removeFromStory(actor, bourse, { forcedOmens = 0 } = {}) {
  const safeDieInFront = actor.system.cheatDeath.usedThisStory ? 1 : 0;
  await bourse.update({
    "system.omenInBag": Math.min(TOTAL_OMEN_DICE, bourse.system.omenInBag + actor.system.wounds.value + forcedOmens),
    "system.safeDiceInBag": Math.min(DEFAULT_SAFE_DICE, bourse.system.safeDiceInBag + safeDieInFront)
  });
  await actor.update({
    "system.wounds.value": 0,
    "system.outOfStory": true
  });
}

/**
 * Remet un personnage à neuf pour rejouer une histoire : plus de Blessure, de
 * Cheat Death ni de Strain (Aspects et Perks), et de retour dans l'histoire.
 * Ne touche pas au sac : à utiliser sur un personnage déjà retiré de l'histoire
 * (ses dés sont retournés au sac par succumb()), ou via startNewStory() qui
 * remet le sac à zéro.
 */
export async function resetCharacter(actor) {
  const update = {
    "system.wounds.value": 0,
    "system.cheatDeath.usedThisStory": false,
    "system.cheatDeath.act": null,
    "system.outOfStory": false
  };
  for (const group of ["core", "story"]) {
    for (const key of Object.keys(actor.system[group])) update[`system.${group}.${key}.strain`] = false;
  }
  await actor.update(update);

  const strainedPerks = actor.items.filter(i => i.type === "perk" && i.system.strain);
  if (strainedPerks.length) {
    await actor.updateEmbeddedDocuments("Item", strainedPerks.map(i => ({ _id: i.id, "system.strain": false })));
  }
}

/**
 * Nouvelle histoire : sac de départ (8 dés Safe, aucun Omen — les 13 sont dans
 * la Réserve de l'Hôte), retour au Prologue, et tous les personnages remis à neuf.
 */
export async function startNewStory(bourse) {
  await bourse.update({
    "system.safeDiceInBag": DEFAULT_SAFE_DICE,
    "system.omenInBag": 0,
    "system.currentAct": 0
  });
  for (const actor of game.actors.filter(a => a.type === "character")) {
    await resetCharacter(actor);
  }
}
