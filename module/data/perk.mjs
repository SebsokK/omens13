/**
 * DataModel d'un Perk, en tant qu'Item embarqué sur l'Actor "character"
 * (20e itération : remplace l'ancien ArrayField `system.perks` de
 * Omens13CharacterData). Le nom du Perk est porté par le document Item
 * lui-même (`item.name`), pas par ce schéma — inutile de le dupliquer ici.
 */
export class Omens13PerkData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;
    return {
      description: new fields.StringField({ required: false, blank: true, initial: "" }),
      // "Possédé" (32e itération : renommé conceptuellement, le champ reste
      // `selected` pour ne pas casser les données existantes) : coche cochée =
      // le joueur possède ce Perk. Contrôle aussi le tri d'affichage (les Perks
      // possédés remontent en haut de la liste, voir _prepareContext() de
      // actor-character-sheet.mjs) et son style (bouton rond rouge, distinct de
      // la case Strain ci-dessous).
      selected: new fields.BooleanField({ required: false, initial: false }),
      // Strain visuel du Perk (32e itération) : aucun effet mécanique (contrairement
      // au Strain d'Aspect, qui force un Flaw), juste un repère visuel (nom en
      // rouge + fond teinté) toujours visible sur la ligne du Perk.
      strain: new fields.BooleanField({ required: false, initial: false })
    };
  }
}
