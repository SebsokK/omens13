import { CORE_ASPECT_KEYS, RATINGS, RATING_TN } from "../helpers/constants.mjs";
import { performCheck } from "../dice/bourse-engine.mjs";
import { postCheckCard, postPerkCard } from "../dice/chat-card.mjs";
import { promptCheckOptions } from "../apps/check-dialog.mjs";
import { promptStoryAspectLabels } from "../apps/story-aspects-dialog.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

export class Omens13CharacterSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["omens13", "sheet", "actor", "character"],
    position: { width: 760, height: 820 },
    window: { resizable: true },
    form: { submitOnChange: true },
    actions: {
      rollCheck: Omens13CharacterSheet.#onRollCheck,
      addPerk: Omens13CharacterSheet.#onAddPerk,
      deletePerk: Omens13CharacterSheet.#onDeletePerk,
      togglePerk: Omens13CharacterSheet.#onTogglePerk,
      editPerk: Omens13CharacterSheet.#onEditPerk,
      togglePerkHidden: Omens13CharacterSheet.#onTogglePerkHidden,
      toggleHiddenPerks: Omens13CharacterSheet.#onToggleHiddenPerks,
      sendPerkToChat: Omens13CharacterSheet.#onSendPerkToChat,
      addGear: Omens13CharacterSheet.#onAddGear,
      useGear: Omens13CharacterSheet.#onUseGear,
      switchTab: Omens13CharacterSheet.#onSwitchTab,
      editImage: Omens13CharacterSheet.#onEditImage,
      editStoryAspects: Omens13CharacterSheet.#onEditStoryAspects
    }
  };

  static PARTS = {
    form: { template: "systems/omens13/templates/actor/character-sheet.hbs", scrollable: [""] }
  };

  /** Onglet actif ("stats" | "notes"), conservé entre les rendus de l'instance. */
  #activeTab = "stats";

  /**
   * IDs des Items Perk actuellement dépliés (accordéon), conservés entre les
   * rendus de l'instance — même logique que #activeTab : ça évite qu'un
   * ré-rendu (déclenché par exemple par la création/suppression d'un autre
   * Perk) referme les accordéons déjà ouverts par l'utilisateur.
   */
  #expandedPerks = new Set();

  /** Les Perks masqués sont-ils affichés dans la liste ? (non par défaut, à chaque ouverture) */
  #showHiddenPerks = false;

  get title() {
    return this.actor.name;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const system = this.actor.system;

    context.actor = this.actor;
    context.system = system;
    context.activeTab = this.#activeTab;
    context.ratings = RATINGS.map(r => ({ value: r, label: game.i18n.localize(`OMENS13.Rating.${r}`) }));

    // Le TN est recalculé ici directement depuis la table des Ratings plutôt que de
    // se fier uniquement à la donnée dérivée du DataModel : ça garantit que la
    // colonne TN affichée est TOUJOURS synchronisée avec la Notation choisie,
    // même si le cycle de dérivation n'a pas encore tourné au moment du rendu.
    // Un rating "unset" (ou toute valeur inconnue) donne un TN null -> affiché vide.
    context.coreAspects = CORE_ASPECT_KEYS.map(key => {
      const aspect = system.core[key];
      return {
        key,
        group: "core",
        label: game.i18n.localize(`OMENS13.Aspect.${key}`),
        rating: aspect.rating,
        strain: aspect.strain,
        tn: RATING_TN[aspect.rating] ?? null
      };
    });

    context.storyAspects = Object.entries(system.story).map(([key, aspect]) => ({
      key,
      group: "story",
      label: aspect.label,
      rating: aspect.rating,
      strain: aspect.strain,
      tn: RATING_TN[aspect.rating] ?? null
    }));

    const { enrichHTML } = foundry.applications.ux.TextEditor.implementation;
    context.enriched = {
      notes: await enrichHTML(system.notes || "", { relativeTo: this.actor }),
      goal: await enrichHTML(system.goal || "", { relativeTo: this.actor })
    };

    // Perks (Items embarqués) : possédés en haut, masqués en bas — tri stable,
    // l'ordre de création est conservé dans chaque groupe.
    const perkRank = item => (item.system.hidden ? 2 : item.system.selected ? 0 : 1);
    const perkItems = this.actor.items
      .filter(i => i.type === "perk")
      .sort((a, b) => perkRank(a) - perkRank(b));
    context.gear = system.gear.map((g, index) => ({ ...g, index }));

    context.hiddenPerkCount = perkItems.filter(i => i.system.hidden).length;
    context.showHiddenPerks = this.#showHiddenPerks;
    context.perks = await Promise.all(
      perkItems.map(async item => ({
        id: item.id,
        name: item.name,
        selected: item.system.selected,
        strain: item.system.strain,
        hidden: item.system.hidden,
        expanded: this.#expandedPerks.has(item.id),
        enrichedDescription: await enrichHTML(item.system.description || "", { relativeTo: item })
      }))
    );

    return context;
  }

  _onFirstRender(context, options) {
    super._onFirstRender(context, options);
    this.#createGearContextMenu();
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.#activatePerkFields();
    this.#activateAspectRowClicks();
    this.#activateGearInput();
  }

  /**
   * Champ "+ Ajouter un objet" en fin de liste d'équipement : Entrée (ou un
   * clic ailleurs) ajoute l'objet saisi. Pas de `name` : ignoré par le formulaire.
   */
  #activateGearInput() {
    const input = this.element.querySelector(".gear-new");
    if (!input) return;
    const add = async () => {
      const name = input.value.trim();
      if (!name) return;
      input.value = "";
      await this.#updateGear(gear => gear.push({ name, broken: false }));
      this.element.querySelector(".gear-new")?.focus();
    };
    input.addEventListener("keydown", event => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      add();
    });
    input.addEventListener("change", add);
  }

  /**
   * Clic droit sur un objet : Check avec cet objet, renommer, casser/réparer,
   * supprimer. Créé une seule fois : le menu écoute la fenêtre, qui persiste
   * d'un rendu à l'autre.
   */
  #createGearContextMenu() {
    const indexOf = target => Number(target.dataset.index);
    const gearAt = target => this.actor.system.gear[indexOf(target)];
    new foundry.applications.ux.ContextMenu(this.element, ".gear-tag", [
      {
        label: "OMENS13.Sheet.GearUse",
        icon: "fa-solid fa-dice",
        onClick: (event, target) => this.#rollCheck({ gearIndex: indexOf(target) })
      },
      {
        label: "OMENS13.Sheet.GearRename",
        icon: "fa-solid fa-pen",
        onClick: (event, target) => this.#renameGear(indexOf(target))
      },
      {
        label: "OMENS13.Sheet.GearBreak",
        icon: "fa-solid fa-heart-crack",
        visible: target => !gearAt(target)?.broken,
        onClick: (event, target) => this.#updateGear(gear => { gear[indexOf(target)].broken = true; })
      },
      {
        label: "OMENS13.Sheet.GearRepair",
        icon: "fa-solid fa-screwdriver-wrench",
        visible: target => !!gearAt(target)?.broken,
        onClick: (event, target) => this.#updateGear(gear => { gear[indexOf(target)].broken = false; })
      },
      {
        label: "OMENS13.Sheet.GearDelete",
        icon: "fa-solid fa-trash",
        onClick: (event, target) => this.#updateGear(gear => { gear.splice(indexOf(target), 1); })
      }
    ], { jQuery: false, fixed: true });
  }

  /** Copie l'équipement, applique `mutate` et enregistre. */
  async #updateGear(mutate) {
    const gear = this.actor.system.gear.map(g => ({ ...g }));
    mutate(gear);
    await this.actor.update({ "system.gear": gear });
  }

  async #renameGear(index) {
    const current = this.actor.system.gear[index];
    if (!current) return;
    const name = await foundry.applications.api.DialogV2.prompt({
      classes: ["omens13"],
      window: { title: game.i18n.localize("OMENS13.Sheet.GearRename") },
      content: `<input type="text" name="name" value="${foundry.utils.escapeHTML(current.name)}" autofocus />`,
      ok: { callback: (event, button) => button.form.elements.name.value.trim() },
      rejectClose: false
    });
    if (name) await this.#updateGear(gear => { gear[index].name = name; });
  }

  /**
   * Les champs de l'Actor portent un attribut `name` et sont sauvegardés par
   * submitOnChange. Les cases Possédé et Strain des Perks appartiennent à des
   * Items embarqués : elles n'ont pas de `name` (ignorées par le formulaire de
   * l'Actor) et mettent à jour leur Item directement.
   */
  #activatePerkFields() {
    this.element.querySelectorAll(".perk-item [data-field]").forEach(el => {
      el.addEventListener("change", async event => {
        const target = event.currentTarget;
        const item = this.actor.items.get(target.closest("[data-item-id]")?.dataset.itemId);
        if (!item) return;
        const value = target.type === "checkbox" ? target.checked : target.value;
        await item.update({ [target.dataset.field]: value });
      });
    });
  }

  /**
   * Rend toute la ligne d'un Aspect cliquable pour lancer le Check (et pas
   * seulement la cellule TN) : on écoute le clic sur la <tr> elle-même plutôt
   * que d'utiliser le système `data-action` générique d'ApplicationV2, parce
   * que ce dernier délègue via `closest("[data-action]")` — un clic sur le
   * <select> de Notation ou la case Strain remonterait quand même jusqu'à la
   * <tr> et déclencherait un jet par erreur. On exclut donc explicitement tout
   * clic dont la cible est (ou est contenue dans) un <select> ou un <input>
   * avant d'appeler la même logique que le bouton TN d'origine (#onRollCheck).
   */
  #activateAspectRowClicks() {
    this.element.querySelectorAll("tr.aspect-row").forEach(row => {
      row.addEventListener("click", event => {
        if (event.target.closest("select, input")) return;
        Omens13CharacterSheet.#onRollCheck.call(this, event, row);
      });
    });
  }

  /* -------------------------------------------- */
  /*  Actions                                      */
  /* -------------------------------------------- */

  static #onRollCheck(event, target) {
    return this.#rollCheck({ aspectPath: `${target.dataset.group}.${target.dataset.key}` });
  }

  /** Clic sur un objet : Check avec cet objet (l'Aspect se choisit dans la fenêtre). */
  static #onUseGear(event, target) {
    return this.#rollCheck({ gearIndex: Number(target.dataset.index) });
  }

  /**
   * Prépare et lance un Check, depuis une ligne d'Aspect ou depuis un objet.
   * La fenêtre permet de choisir l'Aspect et l'objet ; un objet intact ajoute
   * un Edge, un objet cassé un Flaw (p.10), dans la limite de 2 chacun.
   */
  async #rollCheck({ aspectPath = null, gearIndex = null } = {}) {
    const system = this.actor.system;
    if (system.outOfStory) {
      ui.notifications.warn(game.i18n.localize("OMENS13.Bourse.OutOfStory"));
      return;
    }

    const aspects = [
      ...CORE_ASPECT_KEYS.map(key => ({ path: `core.${key}`, aspect: system.core[key], label: game.i18n.localize(`OMENS13.Aspect.${key}`) })),
      ...Object.entries(system.story).map(([key, aspect]) => ({
        path: `story.${key}`, aspect, label: aspect.label || game.i18n.localize("OMENS13.Sheet.UnnamedAspect")
      }))
    ]
      .map(({ path, aspect, label }) => ({ path, label, tn: RATING_TN[aspect.rating] ?? null, strained: aspect.strain }))
      .filter(a => a.tn != null);

    // Depuis une ligne d'Aspect sans Notation, ou si aucun Aspect n'est noté.
    if (!aspects.length || (aspectPath && !aspects.some(a => a.path === aspectPath))) {
      ui.notifications.warn(game.i18n.localize("OMENS13.Sheet.NoRatingWarning"));
      return;
    }

    const gearItem = system.gear[gearIndex];
    const title = aspectPath
      ? game.i18n.format("OMENS13.CheckDialog.Title", { aspect: aspects.find(a => a.path === aspectPath).label })
      : game.i18n.format("OMENS13.CheckDialog.Title", { aspect: gearItem?.name ?? "" });

    const options = await promptCheckOptions({
      aspects,
      aspectPath: aspectPath ?? aspects[0].path,
      gear: system.gear,
      gearIndex,
      permanentFlaw: system.wounds.hasPermanentFlaw,
      title
    });
    if (!options) return;

    const aspect = aspects.find(a => a.path === options.aspectPath);
    const gear = options.gearIndex == null ? null : system.gear[options.gearIndex];
    const { gearIndex: _, aspectPath: chosenPath, ...checkOptions } = options;
    if (gear) {
      if (gear.broken) checkOptions.flaws = Math.min(2, checkOptions.flaws + 1);
      else checkOptions.edges = Math.min(2, checkOptions.edges + 1);
    }

    const result = await performCheck({
      actor: this.actor,
      aspectLabel: aspect.label,
      aspectPath: chosenPath,
      baseTn: aspect.tn,
      ...checkOptions
    });
    if (result && gear) result.gear = { name: gear.name, broken: gear.broken };

    await postCheckCard(result);
  }

  /**
   * Les Perks sont désormais des Items embarqués de type "perk" (20e itération)
   * plutôt qu'un ArrayField : on crée un vrai Document, ce qui donne à chaque
   * Perk sa propre fiche, son propre éditeur ProseMirror pour la description,
   * et permet le futur usage en Compendium/drag-and-drop.
   */
  static async #onAddPerk() {
    const [item] = await this.actor.createEmbeddedDocuments("Item", [
      { name: game.i18n.localize("OMENS13.Sheet.NewPerk"), type: "perk" }
    ]);
    // Déplie automatiquement le nouveau Perk pour que le joueur puisse
    // directement saisir sa description sans avoir à rouvrir l'accordéon.
    if (item) this.#expandedPerks.add(item.id);
  }

  static async #onDeletePerk(event, target) {
    const item = this.actor.items.get(target.closest("[data-item-id]")?.dataset.itemId);
    if (!item) return;
    const deleted = await item.deleteDialog();
    if (deleted) this.#expandedPerks.delete(item.id);
  }

  /** Ouvre la fiche du Perk pour modifier son nom, son image et sa description. */
  static #onEditPerk(event, target) {
    this.actor.items.get(target.closest("[data-item-id]")?.dataset.itemId)?.sheet.render(true);
  }

  /**
   * Affiche ou replie les Perks masqués. Bascule de classes CSS plutôt qu'un
   * rendu complet, comme les onglets, pour ne pas fermer un éditeur ouvert.
   */
  static #onToggleHiddenPerks(event, target) {
    this.#showHiddenPerks = !this.#showHiddenPerks;
    const show = this.#showHiddenPerks;
    this.element.querySelector(".perk-list")?.classList.toggle("show-hidden", show);
    target.classList.toggle("active", show);
    target.title = game.i18n.localize(show ? "OMENS13.Sheet.HideHiddenPerks" : "OMENS13.Sheet.ShowHiddenPerks");
    const icon = target.querySelector("i");
    icon?.classList.toggle("fa-eye", show);
    icon?.classList.toggle("fa-eye-slash", !show);
  }

  /** Masque un Perk non choisi (il passe en bas de la liste, en gris), ou le réaffiche. */
  static async #onTogglePerkHidden(event, target) {
    const item = this.actor.items.get(target.closest("[data-item-id]")?.dataset.itemId);
    if (item) await item.update({ "system.hidden": !item.system.hidden });
  }

  /**
   * Accordéon des Perks : bascule uniquement les classes CSS (comme
   * #onSwitchTab) plutôt que de relancer un rendu complet, pour ne pas
   * détruire un éditeur ProseMirror de description en cours d'édition dans
   * un autre Perk au moment du clic.
   */
  static #onTogglePerk(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    if (!itemId) return;

    if (this.#expandedPerks.has(itemId)) {
      this.#expandedPerks.delete(itemId);
    } else {
      this.#expandedPerks.add(itemId);
    }

    this.element
      .querySelector(`.perk-item[data-item-id="${itemId}"]`)
      ?.classList.toggle("expanded", this.#expandedPerks.has(itemId));
  }

  /**
   * Titre cliquable du Perk (hover rouge, voir .perk-title en CSS) : envoie
   * une carte de chat thémée avec le nom et la description, sur le même
   * principe que #onRollCheck/postCheckCard pour les Aspects.
   */
  static async #onSendPerkToChat(event, target) {
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    const item = this.actor.items.get(itemId);
    if (!item) return;
    await postPerkCard(item);
  }

  /** Bouton + de l'équipement : place le curseur dans le champ d'ajout. */
  static #onAddGear() {
    this.element.querySelector(".gear-new")?.focus();
  }

  /**
   * Bascule d'onglet en manipulant directement les classes CSS plutôt qu'en
   * relançant un rendu complet : un ré-rendu détruirait un éditeur ProseMirror
   * ouvert (Notes, Goal...) si l'utilisateur était en train d'écrire.
   */
  static #onSwitchTab(event, target) {
    const tab = target.dataset.tab;
    this.#activeTab = tab;
    this.element.querySelectorAll(".sheet-tabs a[data-tab]").forEach(a => {
      a.classList.toggle("active", a.dataset.tab === tab);
    });
    this.element.querySelectorAll(".tab-panel[data-tab-panel]").forEach(panel => {
      panel.classList.toggle("active", panel.dataset.tabPanel === tab);
    });
  }

  static #onEditImage() {
    const FilePickerImpl = foundry.applications.apps.FilePicker.implementation;
    new FilePickerImpl({
      type: "image",
      current: this.actor.img,
      callback: path => this.actor.update({ img: path })
    }).browse();
  }

  /**
   * Ouvre une boîte de dialogue pour définir les 5 Story Aspects en un seul
   * endroit, plutôt que via un champ texte éditable directement dans chaque
   * ligne du tableau (ancienne approche) : ça permet à la colonne "Aspect" des
   * Story Aspects d'être un simple texte, alignée sur celle des Core Aspects.
   */
  static async #onEditStoryAspects() {
    const system = this.actor.system;
    const keys = Object.keys(system.story);
    const current = keys.map(key => system.story[key].label);

    const labels = await promptStoryAspectLabels({ current });
    if (!labels) return;

    const updates = {};
    keys.forEach((key, i) => {
      updates[`system.story.${key}.label`] = labels[i] ?? "";
    });
    await this.actor.update(updates);
  }
}
