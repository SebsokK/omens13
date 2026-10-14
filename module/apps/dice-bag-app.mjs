import { TOTAL_OMEN_DICE } from "../helpers/constants.mjs";
import {
  addOmenToBag,
  removeOmenFromBag,
  setCurrentAct,
  cheatDeath,
  undoCheatDeath,
  adjustWound,
  succumb,
  resetCharacter,
  startNewStory,
  cheatDeathBlocker,
  getOrCreateBourse,
  getBourseSync
} from "../dice/bourse-engine.mjs";
import { postCheatDeathCard, postSuccumbCard } from "../dice/chat-card.mjs";

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
      adjustWound: Omens13DiceBagApp.#onAdjustWound,
      succumb: Omens13DiceBagApp.#onSuccumb,
      resurrect: Omens13DiceBagApp.#onResurrect,
      newStory: Omens13DiceBagApp.#onNewStory,
      chooseCharacters: Omens13DiceBagApp.#onChooseCharacters
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

    const allCharacters = game.actors.filter(a => a.type === "character");
    const characters = allCharacters
      .filter(a => system.participants.includes(a.id))
      .map(a => ({
        id: a.id,
        name: a.name,
        img: a.img,
        wounds: a.system.wounds.value,
        deathThreshold: a.system.wounds.deathThreshold,
        flawThreshold: a.system.wounds.flawThreshold,
        hasPermanentFlaw: a.system.wounds.hasPermanentFlaw,
        isDead: a.system.wounds.isDead,
        outOfStory: a.system.outOfStory,
        canCheatDeath: a.isOwner && !cheatDeathBlocker(a, bourse),
        canUndoCheatDeath: a.isOwner && a.system.cheatDeath.usedThisStory && !a.system.outOfStory,
        canSuccumb: a.isOwner && a.system.wounds.isDead && !a.system.outOfStory,
        canEditWounds: a.isOwner && !a.system.outOfStory,
        canResurrect: game.user.isGM && a.system.outOfStory,
        woundPips: Array.from({ length: a.system.wounds.deathThreshold }, (_, i) => ({
          filled: i < a.system.wounds.value,
          isFinal: i === a.system.wounds.deathThreshold - 1
        })),
        // Dés réellement posés devant le personnage : un Omen par Blessure, et le
        // dé Safe d'un Cheat Death. Plus rien une fois retiré de l'histoire (tous
        // ses dés sont retournés au sac, voir succumb()).
        hasCheatedDeath: a.system.cheatDeath.usedThisStory && !a.system.outOfStory,
        woundDicePips: Array.from({ length: a.system.wounds.value }),
        showDiceRow: !a.system.outOfStory && (a.system.wounds.value > 0 || a.system.cheatDeath.usedThisStory)
      }));

    // Les Blessures de TOUS les personnages comptent, même ceux qui ne sont pas
    // affichés : un dé posé devant quelqu'un n'est ni dans le sac ni en Réserve.
    const totalWounds = allCharacters.reduce((sum, a) => sum + a.system.wounds.value, 0);
    const reserve = Math.max(0, TOTAL_OMEN_DICE - system.omenInBag - totalWounds);

    context.system = system;
    context.isGM = game.user.isGM;
    context.totalOmenDice = TOTAL_OMEN_DICE;
    context.reserve = reserve;
    context.characters = characters;
    context.acts = [0, 1, 2, 3];

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

  /** Annule un Cheat Death déclenché par erreur — voir undoCheatDeath(). */
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

  /** Le personnage succombe (p.9), après confirmation — voir succumb(). */
  static async #onSuccumb(event, target) {
    const bourse = getBourseSync();
    const character = game.actors.get(target.dataset.actorId);
    if (!bourse || !character?.isOwner) return;

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      classes: ["omens13"],
      window: { title: game.i18n.localize("OMENS13.Bourse.Succumb") },
      content: `<p>${game.i18n.format("OMENS13.Bourse.SuccumbConfirm", { name: character.name })}</p>`,
      rejectClose: false
    });
    if (!confirmed) return;

    if (await succumb(character, bourse)) await postSuccumbCard(character);
  }

  /** Ramène un personnage retiré de l'histoire, remis à neuf (Hôte uniquement). */
  static async #onResurrect(event, target) {
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("OMENS13.Bourse.HostOnly"));
      return;
    }
    const character = game.actors.get(target.dataset.actorId);
    if (character) await resetCharacter(character);
  }

  /** Choix des personnages affichés dans le Dice Bag (Hôte uniquement). */
  static async #onChooseCharacters() {
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("OMENS13.Bourse.HostOnly"));
      return;
    }
    const bourse = getBourseSync();
    if (!bourse) return;

    const { escapeHTML } = foundry.utils;
    const rows = game.actors
      .filter(a => a.type === "character")
      .map(a => `
        <label class="participant-choice">
          <input type="checkbox" name="participant" value="${a.id}" ${bourse.system.participants.includes(a.id) ? "checked" : ""} />
          <img src="${escapeHTML(a.img)}" alt="" />
          <span>${escapeHTML(a.name)}</span>
        </label>`)
      .join("");

    const participants = await foundry.applications.api.DialogV2.wait({
      classes: ["omens13"],
      window: { title: game.i18n.localize("OMENS13.Bourse.ChooseCharacters") },
      content: `<div class="omens13 participants-dialog">
        <p class="hint">${game.i18n.localize("OMENS13.Bourse.ChooseCharactersHint")}</p>
        ${rows || `<p class="hint">${game.i18n.localize("OMENS13.Bourse.NoCharacters")}</p>`}
      </div>`,
      buttons: [
        {
          action: "save",
          label: game.i18n.localize("OMENS13.StoryAspectsDialog.Save"),
          icon: "fa-solid fa-check",
          default: true,
          callback: (event, button) => [...button.form.querySelectorAll("input[name=participant]:checked")].map(i => i.value)
        },
        { action: "cancel", label: game.i18n.localize("OMENS13.StoryAspectsDialog.Cancel"), icon: "fa-solid fa-xmark" }
      ],
      rejectClose: false
    });
    if (Array.isArray(participants)) await bourse.update({ "system.participants": participants });
  }

  /** Remet le sac et tous les personnages à zéro pour rejouer une histoire (Hôte uniquement). */
  static async #onNewStory() {
    if (!game.user.isGM) {
      ui.notifications.warn(game.i18n.localize("OMENS13.Bourse.HostOnly"));
      return;
    }
    const bourse = getBourseSync();
    if (!bourse) return;

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      classes: ["omens13"],
      window: { title: game.i18n.localize("OMENS13.Bourse.NewStory") },
      content: `<p>${game.i18n.localize("OMENS13.Bourse.NewStoryConfirm")}</p>`,
      rejectClose: false
    });
    if (confirmed) await startNewStory(bourse);
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
