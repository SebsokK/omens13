const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

/**
 * Fiche de PNJ : avatar, nom et un bloc de notes sur toute la page. Mêmes
 * mécanismes natifs que la fiche Perk (submitOnChange, <prose-mirror>, action
 * `editImage` ; changer l'avatar met aussi à jour l'image du token tant
 * qu'elle n'a pas été personnalisée).
 */
export class Omens13NpcSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["omens13", "sheet", "actor", "npc"],
    position: { width: 520, height: 600 },
    window: { resizable: true },
    form: { submitOnChange: true }
  };

  static PARTS = {
    form: { template: "systems/omens13/templates/actor/npc-sheet.hbs" }
  };

  get title() {
    return this.actor.name;
  }

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    context.actor = this.actor;
    context.system = this.actor.system;
    context.enriched = {
      notes: await foundry.applications.ux.TextEditor.implementation.enrichHTML(
        this.actor.system.notes || "",
        { relativeTo: this.actor }
      )
    };
    return context;
  }
}
