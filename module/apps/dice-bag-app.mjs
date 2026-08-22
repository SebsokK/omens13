import { TOTAL_OMEN_DICE, ACT_THRESHOLDS } from "../helpers/constants.mjs";
import {
  addOmenToBag,
  removeOmenFromBag,
  setCurrentAct,
  cheatDeath,
  undoCheatDeath,
  adjustWound,
  resetPerActUsage,
  getOrCreateBourse,
  getBourseSync
} from "../dice/bourse-engine.mjs";
import { postCheatDeathCard } from "../dice/chat-card.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ApplicationV2 } = foundry.applications.api;

/**
 * Panneau flottant du Dice Bag : ce n'est PAS une fiche de personnage/Acteur —
 * c'est une simple ApplicationV2 (comme une boîte de dialogue), draggable et
 * redimensionnable par défaut (chrome de fenêtre standard Foundry), que
 * n'importe quel joueur peut ouvrir sans passer par l'onglet Acteurs.
 *
 * Les données restent portées par l'Acteur singleton "bourse" en coulisses
 * (permission OWNER pour tous, voir bourse-engine.mjs) pour profiter de la
 * synchronisation automatique entre clients sans code réseau custom ; cette
 * classe n'est qu'une vue différente sur ces mêmes données.
 */
export class Omens13DiceBagApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "omens13-dice-bag",
    classes: ["omens13", "dice-bag-app"],
    window: {
      title: "OMENS13.Bourse.DefaultName",
      icon: "fa-solid fa-sack-dollar",
      resizable: true
    },
    position: { width: 360, height: 620 },
    actions: {
      addOmen: Omens13DiceBagApp.#onAddOmen,
      removeOmen: Omens13DiceBagApp.#onRemoveOmen,
      setAct: Omens13DiceBagApp.#onSetAct,
      cheatDeath: Omens13DiceBagApp.#onCheatDeath,
      undoCheatDeath: Omens13DiceBagApp.#onUndoCheatDeath,
      adjustWound: Omens13DiceBagApp.#onAdjustWound
    }
  };

  static PARTS = {
    body: { template: "systems/omens13/templates/apps/dice-bag.hbs", scrollable: [""] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const bourse = await getOrCreateBourse();

    if (!bourse) {
      context.notReady = true;
      return context;
    }

    const system = bourse.system;

    const characters = game.actors
      .filter(a => a.type === "character")
      .map(a => ({
        id: a.id,
        name: a.name,
        img: a.img,
        wounds: a.system.wounds.value,
        deathThreshold: a.system.wounds.deathThreshold,
        flawThreshold: a.system.wounds.flawThreshold,
        hasPermanentFlaw: a.system.wounds.hasPermanentFlaw,
        isDead: a.system.wounds.isDead,
        canCheatDeath: a.isOwner && !a.system.cheatDeath.usedThisStory && !a.system.cheatDeath.usedThisAct,
        // 25e itération : permet d'annuler un Cheat Death déclenché par erreur —
        // visible dès qu'un des deux drapeaux d'usage est actif, réservé au
        // propriétaire du personnage (même portée que le bouton Cheat Death lui-même).
        canUndoCheatDeath: a.isOwner && (a.system.cheatDeath.usedThisStory || a.system.cheatDeath.usedThisAct),
        canEditWounds: a.isOwner,
        woundPips: Array.from({ length: a.system.wounds.deathThreshold }, (_, i) => ({
          filled: i < a.system.wounds.value,
          isFinal: i === a.system.wounds.deathThreshold - 1
        })),
        // 29e itération : deuxième ligne par personnage montrant les dés RÉELLEMENT
        // en jeu devant lui — un dé Omen (rouge) par Blessure actuelle, un dé Safe
        // (blanc) si un Cheat Death a été utilisé cette histoire (`usedThisStory` est
        // le seul des deux drapeaux qui reste vrai à vie une fois déclenché, contrairement
        // à `usedThisAct` qui se réinitialise à chaque Acte — voir resetPerActUsage()).
        // La ligne n'existe dans le DOM que si elle a du contenu (`showDiceRow`), pour
        // rester invisible tant que le personnage n'a subi ni Blessure ni Cheat Death.
        hasCheatedDeath: a.system.cheatDeath.usedThisStory,
        woundDicePips: Array.from({ length: a.system.wounds.value }),
        showDiceRow: a.system.wounds.value > 0 || a.system.cheatDeath.usedThisStory
      }));

    const totalWounds = characters.reduce((sum, c) => sum + c.wounds, 0);
    const reserve = Math.max(0, TOTAL_OMEN_DICE - system.omenInBag - totalWounds);

    context.system = system;
    context.isGM = game.user.isGM;
    context.totalOmenDice = TOTAL_OMEN_DICE;
    context.reserve = reserve;
    context.characters = characters;
    context.acts = [0, 1, 2, 3];
    context.actThresholds = ACT_THRESHOLDS;

    // 29e/30e itération : la boîte "DICE BAG" n'affiche que les dés RÉELLEMENT
    // présents dans le sac, sans emplacement vide — ni pour les Safe (capacité
    // fixe de 8, mais un Cheat Death en consomme un, et on ne veut pas voir de
    // pastille "vide" à sa place), ni pour les Omen (longueur naturellement
    // dynamique, 0 à TOTAL_OMEN_DICE selon ce que l'Hôte a ajouté).
    context.safePips = Array.from({ length: system.safeDiceInBag });
    context.omenInBagPips = Array.from({ length: system.omenInBag });
    context.omenReservePips = Array.from({ length: TOTAL_OMEN_DICE }, (_, i) => i < reserve);

    return context;
  }

  /** Ouvre le panneau s'il est fermé, le ferme sinon. */
  toggle() {
    if (this.rendered) this.close();
    else this.render(true);
  }

  static async #onAddOmen() {
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("OMENS13.Bourse.HostOnly"));
      return;
    }
    const bourse = getBourseSync();
    if (bourse) await addOmenToBag(bourse, 1);
  }

  static async #onRemoveOmen() {
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("OMENS13.Bourse.HostOnly"));
      return;
    }
    const bourse = getBourseSync();
    if (bourse) await removeOmenFromBag(bourse, 1);
  }

  static async #onSetAct(event, target) {
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("OMENS13.Bourse.HostOnly"));
      return;
    }
    // 25e itération : le sélecteur d'Acte était signalé "ne fonctionne plus" sans
    // qu'aucune erreur ne soit visible — ce try/catch fait remonter tout échec
    // (validation, permission, etc.) en notification ET en console au lieu de le
    // laisser disparaître silencieusement dans une Promise rejetée.
    try {
      const bourse = getBourseSync();
      if (!bourse) return;
      const act = Number(target.dataset.act);
      await setCurrentAct(bourse, act);
      for (const character of game.actors.filter(a => a.type === "character")) {
        await resetPerActUsage(character);
      }
    } catch (err) {
      console.error("omens13 | Échec du changement d'Acte :", err);
      ui.notifications.error(`13 Omens — ${err.message ?? err}`);
    }
  }

  static async #onCheatDeath(event, target) {
    const bourse = getBourseSync();
    if (!bourse) return;
    const actorId = target.dataset.actorId;
    const character = game.actors.get(actorId);
    if (!character) return;
    const success = await cheatDeath(character, bourse);
    // Carte de chat uniquement si le Cheat Death a réellement eu lieu (34e itération) —
    // pas de message pour une tentative refusée (déjà utilisé, plus de dé Safe).
    if (success) await postCheatDeathCard(character);
  }

  /** Annule un Cheat Death déclenché par erreur (25e itération) — voir undoCheatDeath(). */
  static async #onUndoCheatDeath(event, target) {
    const bourse = getBourseSync();
    if (!bourse) return;
    const actorId = target.dataset.actorId;
    const character = game.actors.get(actorId);
    if (!character) return;
    if (!character.isOwner) {
      ui.notifications.warn(game.i18n.localize("OMENS13.Bourse.NotOwner"));
      return;
    }
    await undoCheatDeath(character, bourse);
  }

  /**
   * Ajuste manuellement les Blessures d'un personnage (bouton +/- dans le suivi
   * du Dice Bag). Réservé au propriétaire du personnage (ou à l'Hôte, toujours
   * "owner"). Délègue à `adjustWound()` (bourse-engine.mjs, 31e itération) qui
   * garantit que le total de dés Omen (Réserve dérivée + Sac + Blessures) ne
   * dépasse jamais `TOTAL_OMEN_DICE` : si la Réserve n'a plus rien à donner au
   * moment d'ajouter une Blessure, le dé manquant est prélevé dans le sac plutôt
   * que d'être silencieusement inventé.
   */
  static async #onAdjustWound(event, target) {
    const character = game.actors.get(target.dataset.actorId);
    if (!character) return;

    if (!character.isOwner) {
      ui.notifications.warn(game.i18n.localize("OMENS13.Bourse.NotOwner"));
      return;
    }

    const bourse = getBourseSync();
    if (!bourse) return;

    const delta = Number(target.dataset.delta) || 0;
    await adjustWound(character, bourse, delta);
  }
}
