/**
 * Acteur 13 Omens. Le Dice Bag ("bourse") est un Acteur unique créé
 * automatiquement par le système : il est retiré de la liste des types
 * proposés dans la fenêtre de création.
 */
export class Omens13Actor extends Actor {
  static async createDialog(data = {}, createOptions = {}, options = {}, renderOptions = {}) {
    const types = (options.types ?? this.TYPES).filter(type => type !== "bourse");
    return super.createDialog(data, createOptions, { ...options, types }, renderOptions);
  }
}
