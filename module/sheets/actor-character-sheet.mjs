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
      renamePerk: Omens13CharacterSheet.#onRenamePerk,
      sendPerkToChat: Omens13CharacterSheet.#onSendPerkToChat,
      addGear: Omens13CharacterSheet.#onAddGear,
      deleteGear: Omens13CharacterSheet.#onDeleteGear,
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

    context.enriched = {};
    context.enriched.notes = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.actor._source.system.notes || "",
      { async: true, relativeTo: this.actor }
    );
    context.enriched.goal = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.actor._source.system.goal || "",
      { async: true, relativeTo: this.actor }
    );

    // Perks : désormais des Items embarqués de type "perk" (20e itération) plutôt
    // qu'un ArrayField — voir module/data/perk.mjs et migratePerksToItems() dans
    // omens13.mjs pour la migration automatique de l'ancien format.
    // 32e itération : les Perks "possédés" (system.selected) remontent en haut de
    // la liste — tri stable, donc l'ordre relatif au sein de chaque groupe
    // (possédés / non possédés) reste celui de création.
    const perkItems = this.actor.items
      .filter(i => i.type === "perk")
      .sort((a, b) => (b.system.selected === true) - (a.system.selected === true));
    context.perks = await Promise.all(
      perkItems.map(async item => ({
        id: item.id,
        name: item.name,
        selected: item.system.selected,
        strain: item.system.strain,
        expanded: this.#expandedPerks.has(item.id),
        enrichedDescription: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
          item._source.system.description || "",
          { async: true, relativeTo: item }
        )
      }))
    );

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.#activateProseMirrorEditors();
    this.#activateManualFields();
    this.#activateAspectRowClicks();
    this.#activatePerkRename();
  }

  /**
   * Liaison manuelle et explicite des champs de la fiche (Rating/Strain/Label
   * d'Aspect, Perks, Gear) au lieu de compter sur le binding générique par
   * attribut `name` d'ApplicationV2. Deux raisons :
   *  1) Les ArrayField (gear) seraient sérialisés en objet à clés
   *     numériques par FormDataExtended plutôt qu'en tableau.
   *  2) Fiabilité : un `actor.update()` explicite avec le chemin exact évite
   *     toute ambiguïté de sérialisation de chemin imbriqué et garantit que
   *     le TN (recalculé à chaque rendu depuis la Notation) se met bien à jour
   *     dès le changement de Rating.
   */
  #activateManualFields() {
    this.element.querySelectorAll("[data-scope]").forEach(el => {
      el.addEventListener("change", async event => {
        const target = event.currentTarget;
        const scope = target.dataset.scope;
        const value = target.type === "checkbox" ? target.checked : target.value;

        if (scope === "field") {
          // Champs "simples" de l'en-tête (Nom, Traits...) : convertis au même
          // binding manuel explicite que le reste de la fiche plutôt que de
          // compter sur le binding générique par attribut `name` d'ApplicationV2
          // (submitOnChange), qui s'est révélé peu fiable ici — c'est ce qui
          // faisait que le Nom et les Traits ne se sauvegardaient pas.
          const field = target.dataset.field;
          await this.actor.update({ [field]: value });
        } else if (scope === "aspect") {
          const { group, key, field } = target.dataset;
          await this.actor.update({ [`system.${group}.${key}.${field}`]: value });
        } else if (scope === "item") {
          // Perks (20e itération) : Items embarqués, pas un ArrayField. Le champ
          // ciblé peut être "name" (racine de l'Item) ou "system.selected".
          const { itemId, field } = target.dataset;
          const item = this.actor.items.get(itemId);
          if (!item) return;
          await item.update({ [field]: value });
        } else if (scope === "list") {
          const index = Number(target.dataset.index);
          const list = target.dataset.list; // "gear"
          const field = target.dataset.field;

          if (list === "gear") {
            const gear = [...this.actor.system.gear];
            gear[index] = value;
            await this.actor.update({ "system.gear": gear });
          }
        }
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

  /**
   * Éditeurs ProseMirror de la fiche (Notes, Goal, et description de chaque
   * Perk en accordéon), suivant exactement le pattern V14 documenté dans le
   * guide de référence du projet (bouton manuel + save manuel). Le document
   * cible est résolu dynamiquement : s'il existe un ancêtre `[data-item-id]`
   * (cas des descriptions de Perk, chaque bloc `.perk-item` en porte un),
   * l'éditeur sauvegarde sur cet Item embarqué plutôt que sur l'Actor.
   */
  #activateProseMirrorEditors() {
    this.element.querySelectorAll("a.editor-edit").forEach(btn => {
      btn.addEventListener("click", async event => {
        event.preventDefault();

        const editorDiv = btn.closest(".editor");
        const contentDiv = editorDiv?.querySelector(".editor-content[data-edit]");
        if (!contentDiv) return;

        const path = contentDiv.dataset.edit;
        const fieldKey = path.replace("system.", "");
        const itemId = btn.closest("[data-item-id]")?.dataset.itemId;
        const doc = itemId ? this.actor.items.get(itemId) : this.actor;
        if (!doc) return;
        const src = doc._source?.system?.[fieldKey] ?? "";

        btn.style.display = "none";

        try {
          await foundry.applications.ux.TextEditor.implementation.create(
            {
              target: contentDiv,
              fieldName: path,
              document: doc,
              engine: "prosemirror",
              collaborate: false,
              editable: true
            },
            src
          );
        } catch (err) {
          console.error("Omens13 | Editor activation failed:", err);
          btn.style.display = "";
          return;
        }

        const saveBtn = document.createElement("button");
        saveBtn.type = "button";
        saveBtn.className = "omens13-editor-save";
        saveBtn.innerHTML = `✓ ${game.i18n.localize("OMENS13.Sheet.Save")}`;
        editorDiv.appendChild(saveBtn);

        saveBtn.addEventListener("click", async () => {
          const html = contentDiv.innerHTML ?? "";
          await doc.update({ [path]: html });
          this.render();
        });
      });
    });
  }

  /**
   * Mode renommage des Perks (bouton crayon, voir #onRenamePerk) : le titre
   * cliquable (.perk-title, hover rouge -> envoi Chat) cède la place à
   * l'input texte le temps de la saisie. Enter valide et rend la main, tout
   * comme le fait de cliquer ailleurs (blur) — sans ce dernier point le champ
   * resterait affiché indéfiniment après une saisie.
   */
  #activatePerkRename() {
    this.element.querySelectorAll(".perk-name-input").forEach(input => {
      input.addEventListener("keydown", event => {
        if (event.key === "Enter") {
          event.preventDefault();
          input.blur();
        }
      });
      input.addEventListener("blur", () => {
        input.closest(".perk-item")?.classList.remove("renaming");
      });
    });
  }

  /* -------------------------------------------- */
  /*  Actions                                      */
  /* -------------------------------------------- */

  static async #onRollCheck(event, target) {
    const group = target.dataset.group; // "core" | "story"
    const key = target.dataset.key;
    const aspect = this.actor.system[group][key];
    const aspectLabel = group === "core"
      ? game.i18n.localize(`OMENS13.Aspect.${key}`)
      : (aspect.label || game.i18n.localize("OMENS13.Sheet.UnnamedAspect"));
    // Recalculé depuis la Notation courante (voir #activateManualFields) plutôt que
    // de lire aspect.tn, pour être certain de toujours utiliser le TN à jour.
    const baseTn = RATING_TN[aspect.rating] ?? null;

    if (baseTn == null) {
      ui.notifications.warn(game.i18n.localize("OMENS13.Sheet.NoRatingWarning"));
      return;
    }

    const options = await promptCheckOptions({
      aspectLabel,
      baseTn,
      strained: aspect.strain,
      // 40e itération, audit du livret (p.9) : 3 Blessures ou plus force un
      // Flaw sur TOUS les Checks, en plus (pas à la place) d'un Strain d'Aspect
      // éventuel — voir promptCheckOptions() pour le cumul des deux sources.
      permanentFlaw: this.actor.system.wounds.hasPermanentFlaw
    });
    if (!options) return;

    const result = await performCheck({
      actor: this.actor,
      aspectLabel,
      baseTn,
      ...options
    });

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
    const itemId = target.closest("[data-item-id]")?.dataset.itemId;
    if (!itemId) return;
    await this.actor.items.get(itemId)?.delete();
    this.#expandedPerks.delete(itemId);
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

  /**
   * Bouton crayon à côté du titre : bascule le Perk en mode renommage,
   * l'input de nom (masqué par défaut) devient visible et reçoit le focus.
   * Voir #activatePerkRename pour la sortie du mode (Enter/blur).
   */
  static #onRenamePerk(event, target) {
    const itemEl = target.closest(".perk-item");
    if (!itemEl) return;
    itemEl.classList.add("renaming");
    const input = itemEl.querySelector(".perk-name-input");
    input?.focus();
    input?.select();
  }

  static async #onAddGear() {
    const gear = [...this.actor.system.gear];
    gear.push("");
    await this.actor.update({ "system.gear": gear });
  }

  static async #onDeleteGear(event, target) {
    const index = Number(target.dataset.index);
    const gear = [...this.actor.system.gear];
    gear.splice(index, 1);
    await this.actor.update({ "system.gear": gear });
  }

  /**
   * Bascule d'onglet en manipulant directement les classes CSS plutôt qu'en
   * relançant un rendu complet : un ré-rendu détruirait l'éditeur ProseMirror
   * en cours (voir #activateNotesEditor) si l'utilisateur était en train
   * d'éditer ses Notes au moment de changer d'onglet.
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
    const FilePickerImpl = foundry.applications?.apps?.FilePicker?.implementation ?? FilePicker;
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
