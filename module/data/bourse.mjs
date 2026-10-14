import { DEFAULT_SAFE_DICE, TOTAL_OMEN_DICE } from "../helpers/constants.mjs";

/**
 * Données de la Bourse : le sac de dés partagé par toute la table.
 * Il ne doit exister qu'une seule instance (Acteur singleton de type "bourse")
 * dans le monde, avec permission par défaut OWNER pour que n'importe quel
 * joueur puisse tirer des dés sans dépendre de la présence du MJ en ligne.
 */
export class Omens13BourseData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      // Dés Safe encore disponibles dans le sac (8 au départ, réduit uniquement par "Cheat Death").
      safeDiceInBag: new fields.NumberField({ required: true, integer: true, min: 0, max: DEFAULT_SAFE_DICE, initial: DEFAULT_SAFE_DICE }),
      // Dés Omen actuellement DANS le sac (tirables). Le reste des 13 est soit en réserve (devant l'Hôte), soit en Blessure devant un personnage.
      omenInBag: new fields.NumberField({ required: true, integer: true, min: 0, max: TOTAL_OMEN_DICE, initial: 0 }),
      // Acte courant de l'histoire : 0 = Prologue / pas commencé, 1-3 = Actes.
      currentAct: new fields.NumberField({ required: true, integer: true, min: 0, max: 3, initial: 0 }),
      // IDs des personnages qui jouent cette histoire (choisis par l'Hôte) : seuls
      // eux apparaissent dans le suivi des Blessures du Dice Bag.
      participants: new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] }),
      // Journal libre (facultatif) pour que l'Hôte note l'état de la scène.
      note: new fields.StringField({ required: false, blank: true, initial: "" })
    };
  }

  /**
   * Nombre de dés Omen encore en réserve devant l'Hôte, jamais entrés en jeu.
   * = Total (13) - ceux dans le sac - ceux placés en Blessure devant les personnages.
   * Calculé dynamiquement par le HUD (nécessite de connaître les Acteurs "character"),
   * donc non stocké ici pour éviter toute désynchronisation.
   */
  static computeReserve(omenInBag, totalWoundsAcrossCharacters) {
    return Math.max(0, TOTAL_OMEN_DICE - omenInBag - totalWoundsAcrossCharacters);
  }
}
