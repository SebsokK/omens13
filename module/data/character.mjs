import { RATING_TN, RATINGS, CORE_ASPECT_KEYS, WOUND_FLAW_THRESHOLD, WOUND_DEATH_THRESHOLD } from "../helpers/constants.mjs";

/**
 * Schéma d'un Core Aspect : la clé (courage, evade...) porte déjà son libellé
 * via i18n (OMENS13.Aspect.<clé>), pas besoin de champ label éditable.
 */
function coreAspectSchema() {
  const fields = foundry.data.fields;
  return new fields.SchemaField({
    rating: new fields.StringField({ required: true, initial: "unset", choices: RATINGS }),
    strain: new fields.BooleanField({ required: true, initial: false })
  });
}

/**
 * Schéma d'un Story Aspect : le libellé est libre car il change à chaque histoire
 * (ex. Charm, Ghost Stormers Lore, Mechanics, Occultism, Technology...).
 */
function storyAspectSchema() {
  const fields = foundry.data.fields;
  return new fields.SchemaField({
    label: new fields.StringField({ required: true, blank: true, initial: "" }),
    rating: new fields.StringField({ required: true, initial: "unset", choices: RATINGS }),
    strain: new fields.BooleanField({ required: true, initial: false })
  });
}

export class Omens13CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const fields = foundry.data.fields;

    const coreAspects = {};
    for (const key of CORE_ASPECT_KEYS) {
      coreAspects[key] = coreAspectSchema();
    }

    const storyAspects = {};
    for (let i = 1; i <= 5; i++) {
      storyAspects[`story${i}`] = storyAspectSchema();
    }

    return {
      traits: new fields.StringField({ required: false, blank: true, initial: "" }),
      goal: new fields.StringField({ required: false, blank: true, initial: "" }),
      notes: new fields.StringField({ required: false, blank: true, initial: "" }),

      core: new fields.SchemaField(coreAspects),
      story: new fields.SchemaField(storyAspects),

      // Les Perks sont désormais des Items embarqués de type "perk" (20e itération,
      // voir module/data/perk.mjs), pas un ArrayField ici — un vrai document par
      // Perk (nom + description ProseMirror), affiché en accordéon sur la fiche.
      // L'ancien tableau `perks` est migré automatiquement vers des Items au
      // premier chargement (voir migratePerksToItems() dans omens13.mjs) ; ce
      // champ n'existe plus dans le schéma, toute donnée `system.perks`
      // résiduelle en base est inerte et ignorée.

      gear: new fields.ArrayField(
        new fields.StringField({ required: true, blank: true, initial: "" }),
        { initial: [] }
      ),

      wounds: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
        capacityModifier: new fields.NumberField({ required: true, integer: true, initial: 0 })
        // Modificateur de seuil selon la taille du groupe (p.27) : ex. -1 pour groupe de 5, -2 puis -1 pour groupe de 6...
      }),

      cheatDeath: new fields.SchemaField({
        usedThisAct: new fields.BooleanField({ required: true, initial: false }),
        usedThisStory: new fields.BooleanField({ required: true, initial: false })
      })
    };
  }

  prepareDerivedData() {
    // "unset" (et toute valeur inconnue) n'a délibérément pas de TN : null plutôt
    // qu'un repli sur "average", pour que la fiche affiche un TN vide tant que le
    // joueur n'a pas choisi de Notation.
    const computeTn = (aspect) => RATING_TN[aspect.rating] ?? null;

    for (const key of CORE_ASPECT_KEYS) {
      this.core[key].tn = computeTn(this.core[key]);
    }
    for (const key of Object.keys(this.story)) {
      this.story[key].tn = computeTn(this.story[key]);
    }

    const deathThreshold = Math.max(1, WOUND_DEATH_THRESHOLD + (this.wounds.capacityModifier ?? 0));
    const flawThreshold = Math.max(1, WOUND_FLAW_THRESHOLD + (this.wounds.capacityModifier ?? 0));

    this.wounds.deathThreshold = deathThreshold;
    this.wounds.flawThreshold = flawThreshold;
    this.wounds.hasPermanentFlaw = this.wounds.value >= flawThreshold;
    this.wounds.isDead = this.wounds.value >= deathThreshold;
  }
}
