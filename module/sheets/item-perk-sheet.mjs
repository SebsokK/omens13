const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

/**
 * Fiche d'un Item "perk" : nom, image, cases Possédé/Strain et description.
 * La fiche est elle-même le <form> (DocumentSheetV2) : les champs portent un
 * attribut `name` et sont sauvegardés par submitOnChange, la description passe
 * par l'élément natif <prose-mirror>, et l'image par l'action native `editImage`.
 */
export class Omens13PerkItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["omens13", "sheet", "item", "perk"],
    position: { width: 480, height: 460 },
    window: { resizable: true },
    form: { submitOnChange: true }
  };

  static PARTS = {
    form: { template: "systems/omens13/templates/item/perk-sheet.hbs", scrollable: [".perk-sheet-description"] }
  };

  get title() {
    return this.item.name;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.item = this.item;
    context.system = this.item.system;
    context.enriched = {
      description: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        this.item.system.description || "",
        { relativeTo: this.item }
      )
    };
    return context;
  }
}
