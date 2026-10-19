import { RATING_TN, RATINGS, CORE_ASPECT_KEYS, WOUND_FLAW_THRESHOLD, WOUND_DEATH_THRESHOLD, groupWoundModifier } from "../helpers/constants.mjs";

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

      // Équipement : un nom et un état "cassé ou perdu" (p.10). Un objet cassé
      // reste dans la liste, pour pouvoir être réparé ou retrouvé plus tard.
      gear: new fields.ArrayField(
        new fields.SchemaField({
          name: new fields.StringField({ required: true, blank: true, initial: "" }),
          broken: new fields.BooleanField({ required: true, initial: false }),
          // Masqué : objet non choisi par le joueur (comme les Perks masqués).
          hidden: new fields.BooleanField({ required: true, initial: false })
        }),
        { initial: [] }
      ),

      wounds: new fields.SchemaField({
        value: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
      }),

      // Cheat Death (p.9) : une fois par histoire pour ce personnage, et une seule
      // fois par Acte pour toute la table — `act` mémorise l'Acte où il a servi,
      // pour que la limite par Acte se vérifie sur l'ensemble des personnages.
      cheatDeath: new fields.SchemaField({
        usedThisStory: new fields.BooleanField({ required: true, initial: false }),
        act: new fields.NumberField({ required: true, nullable: true, integer: true, initial: null })
      }),

      // Personnage mort ou ayant succombé au désespoir (p.9) : ses dés sont
      // retournés au sac et il ne participe plus à l'histoire.
      outOfStory: new fields.BooleanField({ required: true, initial: false })
    };
  }

  /** Anciennes données : l'équipement était une simple liste de noms. */
  static migrateData(source) {
    if (Array.isArray(source.gear)) {
      source.gear = source.gear.map(g => (typeof g === "string" ? { name: g, broken: false } : g));
    }
    return super.migrateData(source);
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

    // Le seuil de mort dépend de la taille du groupe, c'est-à-dire des personnages
    // choisis dans le Dice Bag (Bourse). Au tout premier chargement, la collection
    // des Acteurs n'existe pas encore : le seuil est recalculé au hook "ready".
    const bourse = game.actors?.find(a => a.type === "bourse");
    const participants = bourse?.system.participants ?? [];
    const deadCount = participants.filter(id => game.actors.get(id)?.system.outOfStory).length;
    const deathThreshold = Math.max(1, WOUND_DEATH_THRESHOLD + groupWoundModifier(participants.length, deadCount));
    const flawThreshold = WOUND_FLAW_THRESHOLD;

    this.wounds.deathThreshold = deathThreshold;
    this.wounds.max = deathThreshold; // barre de token (primaryTokenAttribute)
    this.wounds.flawThreshold = flawThreshold;
    this.wounds.hasPermanentFlaw = this.wounds.value >= flawThreshold;
    this.wounds.isDead = this.wounds.value >= deathThreshold;
  }
}
