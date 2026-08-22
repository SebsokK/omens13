/**
 * Constantes de règles pour 13 Omens.
 * Source : PZO62000E.pdf (livret de règles) et PZO64001E.pdf (scénario).
 */

export const SYSTEM_ID = "omens13";

/** Table des notations d'Aspect -> Target Number de base (p.7) */
export const RATING_TN = {
  terrible: 10,
  bad: 9,
  average: 7,
  good: 5,
  great: 4
};

/**
 * "unset" est une Notation vide volontaire (pas de TN associé, absent de
 * RATING_TN ci-dessus) : c'est le choix par défaut de tout Aspect tant que le
 * joueur n'a pas encore fixé sa Notation. Placé en premier pour apparaître en
 * tête du menu déroulant.
 */
export const RATINGS = ["unset", "terrible", "bad", "average", "good", "great"];

/** Modificateurs de difficulté appliqués au TN de base (p.7) */
export const DIFFICULTY_MODIFIER = {
  veryEasy: -2,
  easy: -1,
  average: 0,
  hard: 1,
  veryHard: 2
};

export const DIFFICULTIES = ["veryEasy", "easy", "average", "hard", "veryHard"];

/** Clés fixes des 5 Core Aspects (communes à toutes les histoires, p.6) */
export const CORE_ASPECT_KEYS = ["courage", "evade", "fight", "luck", "perception"];

/** Nombre de dés Safe dans la bourse au départ (p.5) */
export const DEFAULT_SAFE_DICE = 8;

/** Nombre total de dés Omen existant dans le jeu (p.5/8) */
export const TOTAL_OMEN_DICE = 13;

/** Seuils de Blessures avant Flaw permanent / mort-désespoir (p.9), modifiables via woundCapacityModifier */
export const WOUND_FLAW_THRESHOLD = 3;
export const WOUND_DEATH_THRESHOLD = 4;

/** Paliers d'Actes en fonction du nombre total de dés Omen en jeu (p.24) */
export const ACT_THRESHOLDS = {
  1: 4, // 4e dé Omen en jeu -> Acte 1
  2: 8, // 8e dé Omen en jeu -> Acte 2
  3: 9  // 9e dé Omen en jeu -> Acte 3
};

/** Noms des colorsets Dice So Nice enregistrés pour les Safe/Omen Dice (voir omens13.mjs). */
export const DSN_COLORSET_SAFE = "omens13-safe";
export const DSN_COLORSET_OMEN = "omens13-omen";
