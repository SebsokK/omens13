import { SYSTEM_ID, DSN_COLORSET_SAFE, DSN_COLORSET_OMEN } from "./helpers/constants.mjs";
import { Omens13CharacterData } from "./data/character.mjs";
import { Omens13BourseData } from "./data/bourse.mjs";
import { Omens13PerkData } from "./data/perk.mjs";
import { Omens13CharacterSheet } from "./sheets/actor-character-sheet.mjs";
import { Omens13PerkItemSheet } from "./sheets/item-perk-sheet.mjs";
import { Omens13DiceBagApp } from "./apps/dice-bag-app.mjs";
import { getOrCreateBourse, getBourseSync, cheatDeath } from "./dice/bourse-engine.mjs";
import { postCheatDeathCard } from "./dice/chat-card.mjs";

Hooks.once("init", () => {
  console.log(`${SYSTEM_ID} | Initialisation du système 13 Omens`);

  const diceBagApp = new Omens13DiceBagApp();
  game.omens13 = { getOrCreateBourse, diceBagApp, openDiceBag: () => diceBagApp.render(true) };

  // Position du bouton flottant Dice Bag, PAR CLIENT (scope "client" : chaque
  // utilisateur/navigateur a la sienne). Deviner une position universelle en
  // pixels ne peut pas fonctionner pour tout le monde (écrans ultra-wide,
  // sidebar redimensionnée, etc.) : le bouton est donc déplaçable à la souris
  // (voir createDiceBagFab plus bas), et sa position choisie est mémorisée ici.
  game.settings.register(SYSTEM_ID, "diceBagFabPosition", {
    scope: "client",
    config: false,
    type: Object,
    default: { right: 16, bottom: 84 }
  });

  // --- DataModels ---
  CONFIG.Actor.dataModels = {
    character: Omens13CharacterData,
    bourse: Omens13BourseData
  };
  // Perk (20e itération) : Item embarqué remplaçant l'ancien ArrayField
  // system.perks — voir data/perk.mjs et la migration migratePerksToItems().
  CONFIG.Item.dataModels = {
    perk: Omens13PerkData
  };

  // --- Feuilles ---
  // Seule la fiche de personnage est une véritable Actor Sheet. Le Dice Bag n'en
  // est volontairement pas une (voir dice-bag-app.mjs) : il n'apparaît donc pas
  // dans le sélecteur de feuille, et l'Acteur "bourse" qui le porte est masqué
  // de l'onglet Acteurs (voir le hook renderActorDirectory plus bas).
  const Actors = foundry.documents?.collections?.Actors ?? globalThis.Actors;
  const Items = foundry.documents?.collections?.Items ?? globalThis.Items;

  Actors.registerSheet(SYSTEM_ID, Omens13CharacterSheet, {
    types: ["character"],
    makeDefault: true,
    label: "OMENS13.Sheet.CharacterTitle"
  });

  Items.registerSheet(SYSTEM_ID, Omens13PerkItemSheet, {
    types: ["perk"],
    makeDefault: true,
    label: "OMENS13.Sheet.PerkName"
  });

  // --- Raccourci clavier de secours pour ouvrir/fermer le Dice Bag ---
  game.keybindings.register(SYSTEM_ID, "toggleDiceBag", {
    name: "OMENS13.Bourse.DefaultName",
    editable: [{ key: "KeyD", modifiers: ["Control", "Shift"] }],
    onDown: () => {
      diceBagApp.toggle();
      return true;
    }
  });
});

Hooks.once("ready", async () => {
  if (game.user.isGM) {
    await getOrCreateBourse();
    await migratePerksToItems();
  }

  /**
   * Le Dice Bag s'ouvre automatiquement au chargement du monde, pour tous les
   * clients, plutôt que d'exiger une action manuelle (bouton de contrôle de
   * scène best-effort ou raccourci Ctrl+Maj+D) : c'est ce qui le rendait
   * "invisible" par défaut après son passage en panneau flottant. L'utilisateur
   * peut toujours le fermer/rouvrir manuellement ensuite (il se rouvrira au
   * prochain chargement du monde).
   * Si la Bourse n'existe pas encore (ce client a chargé avant que l'Hôte ait
   * fini de la créer), on retente une seule fois après un court délai plutôt
   * que d'ouvrir un panneau "not ready" qui resterait bloqué.
   */
  const tryOpenDiceBag = () => {
    if (getBourseSync()) {
      game.omens13.diceBagApp.render(true);
      return true;
    }
    return false;
  };
  if (!tryOpenDiceBag()) {
    setTimeout(tryOpenDiceBag, 2000);
  }

  createDiceBagFab();

  // Si le monde est chargé alors que le jeu est déjà en pause (rare, mais possible),
  // le hook renderPause a pu se déclencher avant que ce module ne soit prêt à réagir.
  if (game.paused) patchPauseOverlay();
});

/**
 * Migration ponctuelle (20e itération) : convertit l'ancien tableau
 * `system.perks` (flat-list checkbox+nom+description) en véritables Items
 * embarqués de type "perk", un par entrée, sur chaque Actor "character".
 * Hôte uniquement (comme getOrCreateBourse) pour éviter toute création en
 * double si plusieurs clients se chargent en même temps. Protégée par un
 * garde-fou simple : si l'Acteur a déjà au moins un Item "perk", on considère
 * la migration déjà faite et on ne touche à rien (pas de re-création à
 * chaque rechargement du monde). Lit `actor._source.system.perks` plutôt que
 * `actor.system.perks` : ce dernier n'existe plus dans le schéma courant
 * (voir data/character.mjs) et serait vide, alors que `_source` conserve les
 * données brutes telles qu'enregistrées en base tant qu'un update ne les a
 * pas écrasées.
 */
async function migratePerksToItems() {
  for (const actor of game.actors.filter(a => a.type === "character")) {
    const legacyPerks = actor._source.system.perks;
    if (!Array.isArray(legacyPerks) || !legacyPerks.length) continue;

    const alreadyMigrated = actor.items.some(i => i.type === "perk");
    if (alreadyMigrated) continue;

    const toCreate = legacyPerks
      .filter(p => p.name || p.description)
      .map(p => ({
        name: p.name || game.i18n.localize("OMENS13.Sheet.PerkName"),
        type: "perk",
        system: { description: p.description || "", selected: !!p.selected }
      }));

    if (toCreate.length) {
      await actor.createEmbeddedDocuments("Item", toCreate);
      console.log(`${SYSTEM_ID} | Migration : ${toCreate.length} Perk(s) converti(s) en Item(s) pour "${actor.name}"`);
    }
  }
}

/**
 * Bouton flottant "Dice Bag" ajouté directement au DOM (pas via l'API des
 * contrôles de scène, abandonnée — voir plus bas) : c'est un simple <button>
 * avec son propre gestionnaire d'événements, donc son ouverture ne dépend
 * d'aucune API Foundry incertaine. Visible pour tout le monde (Hôte et Joueurs).
 *
 * DÉPLAÇABLE À LA SOURIS : plutôt que de deviner une position en pixels qui ne
 * peut pas convenir à tous les écrans (l'utilisateur est en ultra-wide, où le
 * grand espace vide entre la barre de macro centrée et la sidebar dockée à
 * droite ne se trouve pas au même endroit que sur un écran standard), le
 * bouton se glisse-dépose (pointer events) et sa position choisie est
 * mémorisée par client (`diceBagFabPosition`, scope "client") — chaque
 * utilisateur le place une fois où ça l'arrange, ça reste là ensuite.
 * Un déplacement (mouvement > 4px) n'ouvre pas le panneau ; un simple clic
 * sans déplacement l'ouvre normalement.
 */
function createDiceBagFab() {
  if (document.getElementById("omens13-dice-bag-fab")) return;

  const button = document.createElement("button");
  button.id = "omens13-dice-bag-fab";
  button.type = "button";
  button.title = game.i18n.localize("OMENS13.Bourse.DefaultName");
  button.innerHTML = '<i class="fa-solid fa-sack-dollar"></i>';

  const saved = game.settings.get(SYSTEM_ID, "diceBagFabPosition") ?? { right: 16, bottom: 84 };
  button.style.right = `${saved.right}px`;
  button.style.bottom = `${saved.bottom}px`;

  let dragging = false;
  let moved = false;
  let startX = 0;
  let startY = 0;
  let startRight = 0;
  let startBottom = 0;

  button.addEventListener("pointerdown", event => {
    dragging = true;
    moved = false;
    startX = event.clientX;
    startY = event.clientY;
    const rect = button.getBoundingClientRect();
    startRight = window.innerWidth - rect.right;
    startBottom = window.innerHeight - rect.bottom;
    button.setPointerCapture(event.pointerId);
  });

  button.addEventListener("pointermove", event => {
    if (!dragging) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (!moved && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) moved = true;
    if (!moved) return;

    const newRight = Math.min(window.innerWidth - 56, Math.max(4, startRight - dx));
    const newBottom = Math.min(window.innerHeight - 56, Math.max(4, startBottom - dy));
    button.style.right = `${newRight}px`;
    button.style.bottom = `${newBottom}px`;
  });

  button.addEventListener("pointerup", async () => {
    if (!dragging) return;
    dragging = false;

    if (moved) {
      const rect = button.getBoundingClientRect();
      const right = Math.round(window.innerWidth - rect.right);
      const bottom = Math.round(window.innerHeight - rect.bottom);
      await game.settings.set(SYSTEM_ID, "diceBagFabPosition", { right, bottom });
    } else {
      game.omens13.diceBagApp.render(true);
    }
  });

  button.addEventListener("pointercancel", () => {
    dragging = false;
  });

  document.body.appendChild(button);
}

/**
 * Reskin de l'overlay "Game Paused" natif de Foundry (35e itération, retour
 * utilisateur) : `#pause` est une UI coeur (ApplicationV2 `Pause`), pas un
 * élément du système — impossible de la reconfigurer autrement qu'en
 * manipulant son DOM une fois rendue.
 *
 * 36e itération : tentative de remplacer l'icône en CSS pur (`content: url()`)
 * pour éliminer un flash de quelques frames de l'ancien logo/texte — RATÉE
 * (retour utilisateur avec capture d'écran : l'icône ET le texte natifs
 * étaient réapparus en permanence, pas juste le temps d'un flash). Cette
 * technique CSS ne s'est pas appliquée comme attendu dans cet environnement
 * (Electron/Chromium) sur ce type d'élément. 37e itération : retour à la
 * manipulation JS de `img.src` ci-dessous, qui était déjà confirmée
 * fonctionnelle dès la 35e itération (seul le flash restait à corriger). Le
 * flash lui-même venait du `setTimeout(..., 50)` de la 35e itération sur le
 * hook `pauseGame` (un délai délibéré, visible à l'oeil — ~3 frames à 60fps) :
 * resté supprimé, patch appelé immédiatement sur chaque signal.
 */
function patchPauseOverlay() {
  const pauseEl = document.getElementById("pause");
  if (!pauseEl) return;

  const img = pauseEl.querySelector("img");
  if (img) {
    const deathIconSrc = "systems/omens13/assets/branding/death-icon.png";
    if (img.getAttribute("src") !== deathIconSrc) img.src = deathIconSrc;
    img.classList.add("omens13-pause-icon");
  }

  const label = game.i18n.localize("OMENS13.UI.DeathAwaits");
  const caption = pauseEl.querySelector("figcaption") ?? pauseEl.querySelector("span");
  if (caption && caption.textContent !== label) caption.textContent = label;
}

// 38e itération (retour utilisateur : le patch tenait au premier affichage mais
// pas après un cycle pause/dépause) : `renderPause` et `pauseGame` sont posés ici
// par précaution, mais leur nom/comportement exact dans cette version de Foundry
// n'a JAMAIS pu être vérifié en dehors d'une vraie session — le fait que le
// patch ne survive pas à un second cycle suggère fortement qu'aucun des deux ne
// se déclenche réellement ici (ou pas au bon moment), et que seul le fallback
// `if (game.paused) patchPauseOverlay()` du hook `ready` avait fonctionné "au
// lancement" (le monde était déjà en pause au chargement, ou c'était le tout
// premier cycle après rechargement). Le MutationObserver devient donc le
// mécanisme PRINCIPAL, pas un simple filet de sécurité : il ne dépend d'aucun
// nom de hook, seulement du DOM lui-même. Élargi à `subtree: true` (couvre le
// cas où #pause n'est pas un enfant DIRECT de <body>, ou si Foundry ne fait que
// réinsérer/modifier son contenu interne à chaque bascule plutôt que de
// recréer #pause en entier) et `attributes: true` filtré sur `src` (couvre le
// cas où Foundry réutilise le même <img> mais réinitialise son `src` d'origine
// à chaque pause). `patchPauseOverlay()` est idempotente (elle ne réécrit que
// si la valeur diffère), donc aucun risque de boucle : notre propre écriture ne
// redéclenche pas de second patch inutile.
Hooks.on("renderPause", () => patchPauseOverlay());
Hooks.on("pauseGame", () => patchPauseOverlay());
Hooks.once("ready", () => {
  new MutationObserver(() => patchPauseOverlay())
    .observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
});

/**
 * Le Dice Bag affiche l'état de la Bourse ET les Blessures de tous les personnages :
 * il doit donc se rafraîchir dès que l'un OU l'autre est modifié, même s'il n'est
 * "propriétaire" d'aucun de ces documents au sens ApplicationV2 classique.
 */
Hooks.on("updateActor", actor => {
  if (actor.type !== "character" && actor.type !== "bourse") return;
  if (game.omens13.diceBagApp.rendered) game.omens13.diceBagApp.render();
});

/**
 * L'Acteur "bourse" est un support de données technique, pas un personnage à
 * ouvrir depuis l'onglet Acteurs : on masque son entrée dans la liste. Best-effort
 * (enveloppé pour ne jamais faire planter le rendu de la sidebar si la structure
 * DOM de l'ActorDirectory changeait dans une future version de Foundry).
 */
Hooks.on("renderActorDirectory", (app, html) => {
  try {
    const bourse = game.actors?.find(a => a.type === "bourse");
    if (!bourse) return;
    const root = html instanceof HTMLElement ? html : html?.[0];
    const entry = root?.querySelector(`[data-entry-id="${bourse.id}"]`);
    entry?.remove();
  } catch (err) {
    console.warn(`${SYSTEM_ID} | Impossible de masquer l'Acteur Dice Bag de la sidebar :`, err);
  }
});

/**
 * Marque le <li> de message de chat des cartes 13 Omens (Checks via le flag
 * `flags.omens13.checkResult`, Perks via `flags.omens13.perkCard`, Cheat Death
 * via `flags.omens13.cheatDeathCard` depuis la 34e itération — voir
 * chat-card.mjs) d'une classe dédiée, pour pouvoir neutraliser en CSS la
 * bulle par défaut de Foundry (fond clair/bordure) qui entourait notre carte
 * déjà thémée — c'est ce qui donnait ce "contour blanc" incohérent avec le
 * reste du système. Écrit défensivement pour les deux hooks
 * (`renderChatMessageHTML` en V13+, `renderChatMessage` en plus ancien)
 * plutôt que de fouiller le DOM pour trouver notre carte.
 */
function markOmensChatMessage(message, html) {
  const flags = message?.flags?.omens13;
  if (!flags?.checkResult && !flags?.perkCard && !flags?.cheatDeathCard) return;
  const el = html instanceof HTMLElement ? html : html?.[0];
  el?.classList?.add("omens13-chat-message");
}

/**
 * 41e itération — bouton "Cheat Death" directement sur la roll card d'un Check
 * (voir bourse-engine.mjs#performCheck() pour `cheatDeathEligible`, calculé
 * UNIQUEMENT sur le tirage précis qui vient de causer la Blessure — plus fiable
 * qu'un drapeau global qui ne saurait pas distinguer plusieurs Blessures non
 * résolues en attente). `cheatDeathEligible` est figé au moment du Check
 * (flags.omens13.checkResult), mais l'éligibilité "en pratique" (déjà utilisé
 * cet Acte/cette histoire, plus de dé Safe dans le sac, propriétaire du
 * personnage) est réévaluée à CHAQUE rendu de la carte, exactement comme
 * `_prepareContext()` du Dice Bag recalcule `canCheatDeath` à chaque affichage
 * — pour refléter l'état réel au moment où le joueur regarde/clique, pas celui
 * du Check d'origine (qui peut être plus ancien).
 *
 * Un seul écouteur de clic est posé par élément DOM (`dataset.omensBound`),
 * pour ne pas en empiler un nouveau à chaque re-rendu de la carte (scroll,
 * reconnexion, etc.).
 *
 * Note de conception : après un clic réussi, seule CETTE carte se grise
 * immédiatement (côté client qui a cliqué). D'éventuelles autres cartes déjà
 * affichées pour le même personnage (chez d'autres joueurs, ou plus haut dans
 * l'historique) ne se regrisent pas en direct — `cheatDeath()` reste de toute
 * façon la source de vérité et refusera toute tentative en double, donc c'est
 * un décalage purement visuel, sans risque mécanique.
 */
function activateCheckCardCheatDeath(message, html) {
  const flags = message?.flags?.omens13?.checkResult;
  if (!flags?.cheatDeathEligible) return;

  const el = html instanceof HTMLElement ? html : html?.[0];
  const btn = el?.querySelector(".cheat-death-card-btn");
  if (!btn) return;

  const actor = game.actors?.get(flags.actorId);

  if (!actor || !(actor.isOwner || game.user.isGM)) {
    btn.remove();
    return;
  }

  const bourse = getBourseSync();
  const blockedReason = !bourse
    ? "OMENS13.Bourse.NotReady"
    : actor.system.cheatDeath.usedThisStory
      ? "OMENS13.Bourse.CheatDeathStoryUsed"
      : actor.system.cheatDeath.usedThisAct
        ? "OMENS13.Bourse.CheatDeathActUsed"
        : bourse.system.safeDiceInBag <= 0
          ? "OMENS13.Bourse.NoSafeDiceLeft"
          : null;

  btn.disabled = !!blockedReason;
  btn.title = blockedReason ? game.i18n.localize(blockedReason) : "";

  if (btn.dataset.omensBound) return;
  btn.dataset.omensBound = "1";

  btn.addEventListener("click", async () => {
    const liveBourse = getBourseSync();
    if (!liveBourse) return;
    const success = await cheatDeath(actor, liveBourse, { removeWound: true });
    if (success) {
      btn.disabled = true;
      btn.title = "";
      await postCheatDeathCard(actor);
    }
  });
}

Hooks.on("renderChatMessageHTML", (message, html) => {
  markOmensChatMessage(message, html);
  activateCheckCardCheatDeath(message, html);
});
Hooks.on("renderChatMessage", (message, html) => {
  markOmensChatMessage(message, html);
  activateCheckCardCheatDeath(message, html);
});

/**
 * Intégration Dice So Nice : deux presets forcés, Safe Dice (noir/blanc) et
 * Omen Dice (rouge/noir). bourse-engine.mjs tague chaque dé tiré avec l'un de
 * ces deux noms de colorset avant évaluation (voir rollDice()) — l'animation se
 * déclenche ensuite automatiquement au createChatMessage, sans appel manuel.
 */
Hooks.once("diceSoNiceReady", dice3d => {
  dice3d.addColorset(
    {
      name: DSN_COLORSET_SAFE,
      category: "13 Omens",
      description: game.i18n.localize("OMENS13.Bourse.SafeDice"),
      texture: "none",
      material: "plastic",
      font: "Arial",
      foreground: "#ffffff",
      background: "#111111",
      outline: "#000000",
      edge: "#000000"
    },
    "default"
  );

  dice3d.addColorset(
    {
      name: DSN_COLORSET_OMEN,
      category: "13 Omens",
      description: game.i18n.localize("OMENS13.Bourse.OmenDice"),
      texture: "none",
      material: "metal",
      font: "Arial",
      foreground: "#000000",
      background: "#b3181f",
      outline: "#4a0000",
      edge: "#4a0000"
    },
    "default"
  );
});
