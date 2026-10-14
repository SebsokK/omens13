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

/** Seuils de Blessures avant Flaw permanent / mort-désespoir (p.9), pour un groupe de 4 personnages. */
export const WOUND_FLAW_THRESHOLD = 3;
export const WOUND_DEATH_THRESHOLD = 4;

/**
 * Blessures en plus (ou en moins) avant la mort selon la taille du groupe (p.27).
 * À 6 personnages : -2 tant que moins de 2 sont morts, puis -1.
 * Le seuil du Flaw permanent, lui, ne change pas.
 */
export function groupWoundModifier(characterCount, deadCount = 0) {
  if (characterCount === 1) return 2;
  if (characterCount === 2) return 1;
  if (characterCount === 5) return -1;
  if (characterCount >= 6) return deadCount >= 2 ? -1 : -2;
  return 0;
}

/** Noms des colorsets Dice So Nice enregistrés pour les Safe/Omen Dice (voir omens13.mjs). */
export const DSN_COLORSET_SAFE = "omens13-safe";
export const DSN_COLORSET_OMEN = "omens13-omen";
