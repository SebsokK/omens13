/**
 * Données d'un PNJ : rôle, objectif et notes libres. Le PNJ sert surtout à
 * porter un nom, un avatar et un token sur la scène ; il ne fait pas de Check.
 */
export class Omens13NpcData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      role: new fields.StringField({ required: false, blank: true, initial: "" }),
      goal: new fields.StringField({ required: false, blank: true, initial: "" }),
      notes: new fields.HTMLField({ required: false, blank: true, initial: "" })
    };
  }
}
