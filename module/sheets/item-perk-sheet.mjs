const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * Fiche minimale pour un Item de type "perk" (20e itération). Ouverte
 * rarement en pratique — l'édition courante d'un Perk se fait directement
 * dans l'accordéon de la fiche de personnage (voir actor-character-sheet.mjs) —
 * mais nécessaire pour que "Voir l'Item" / double-clic sur l'entrée dans une
 * éventuelle liste d'Items reste utilisable et cohérente avec le thème,
 * plutôt que de tomber sur la fiche générique de Foundry.
 */
export class Omens13PerkItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["omens13", "sheet", "item", "perk"],
    position: { width: 420, height: 380 },
    window: { resizable: true },
    actions: {
      editImage: Omens13PerkItemSheet.#onEditImage
    }
  };

  static PARTS = {
    form: { template: "systems/omens13/templates/item/perk-sheet.hbs", scrollable: [""] }
  };

  get title() {
    return this.item.name;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;

    context.enriched = {};
    context.enriched.description = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
      this.item._source.system.description || "",
      { async: true, relativeTo: this.item }
    );

    return context;
  }

  _onRender(context, options) {
    super._onRender(context, options);
    this.#activateDescriptionEditor();
    this.#activateManualFields();
  }

  #activateManualFields() {
    this.element.querySelectorAll("[data-scope='field']").forEach(el => {
      el.addEventListener("change", async event => {
        const target = event.currentTarget;
        const field = target.dataset.field;
        const value = target.type === "checkbox" ? target.checked : target.value;
        await this.item.update({ [field]: value });
      });
    });
  }

  /**
   * Même pattern manuel que #activateNotesEditor sur la fiche de personnage
   * (voir le guide de référence ProseMirror du projet) : bouton crayon
   * ✎ branché à la main, sauvegarde manuelle via doc.update().
   */
  #activateDescriptionEditor() {
    this.element.querySelectorAll("a.editor-edit").forEach(btn => {
      btn.addEventListener("click", async event => {
        event.preventDefault();

        const editorDiv = btn.closest(".editor");
        const contentDiv = editorDiv?.querySelector(".editor-content[data-edit]");
        if (!contentDiv) return;

        const path = contentDiv.dataset.edit;
        const fieldKey = path.replace("system.", "");
        const doc = this.item;
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

  static #onEditImage() {
    const FilePickerImpl = foundry.applications?.apps?.FilePicker?.implementation ?? FilePicker;
    new FilePickerImpl({
      type: "image",
      current: this.item.img,
      callback: path => this.item.update({ img: path })
    }).browse();
  }
}
