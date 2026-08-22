import { DIFFICULTIES } from "../helpers/constants.mjs";

/**
 * Boîte de dialogue de préparation d'un Check : difficulté, Edges, Flaws,
 * Facing Evil (Omen forcé par l'Hôte) et bascule Harmless.
 * @param {object} options
 * @param {string} options.aspectLabel
 * @param {number} options.baseTn
 * @param {boolean} [options.strained=false]  L'Aspect a sa case Strain cochée (32e
 *   itération) : le Check inclut obligatoirement au moins 1 Flaw (p.9) — le champ
 *   Flaws démarre à 1 au lieu de 0 et ne peut plus redescendre en dessous.
 * @param {boolean} [options.permanentFlaw=false]  Le personnage a 3 Blessures ou
 *   plus (40e itération, audit du livret p.9 : "they take a Flaw on all Checks.
 *   This Flaw counts as a different source from all other Flaws (including
 *   those caused by a Strain)") : source de Flaw obligatoire DISTINCTE du Strain
 *   d'Aspect — si les deux sont actifs en même temps, ça fait 2 Flaws minimum
 *   (plafonné à 2, le maximum autorisé par Check).
 * @returns {Promise<object|null>} null si annulé.
 */
export async function promptCheckOptions({ aspectLabel, baseTn, strained = false, permanentFlaw = false } = {}) {
  const { DialogV2 } = foundry.applications.api;

  const difficultyOptions = DIFFICULTIES.map(d =>
    `<option value="${d}" ${d === "average" ? "selected" : ""}>${game.i18n.localize(`OMENS13.Difficulty.${d}`)}</option>`
  ).join("");

  // Strain d'Aspect et 3+ Blessures sont deux sources de Flaw DISTINCTES (p.9) :
  // si les deux sont actives, le Check démarre à 2 Flaws minimum, pas 1.
  const minFlaws = Math.min(2, (strained ? 1 : 0) + (permanentFlaw ? 1 : 0));

  const content = `
    <form class="omens13 check-dialog">
      <p class="hint">${game.i18n.format("OMENS13.CheckDialog.Hint", { aspect: aspectLabel, tn: baseTn })}</p>
      ${strained ? `<p class="hint strained-hint">${game.i18n.localize("OMENS13.CheckDialog.StrainedHint")}</p>` : ""}
      ${permanentFlaw ? `<p class="hint strained-hint">${game.i18n.localize("OMENS13.CheckDialog.PermanentFlawHint")}</p>` : ""}
      <div class="form-group">
        <label>${game.i18n.localize("OMENS13.CheckDialog.Difficulty")}</label>
        <select name="difficulty">${difficultyOptions}</select>
      </div>
      <div class="form-group">
        <label>${game.i18n.localize("OMENS13.CheckDialog.Edges")}</label>
        <input type="number" name="edges" value="0" min="0" max="2" />
      </div>
      <div class="form-group">
        <label>${game.i18n.localize("OMENS13.CheckDialog.Flaws")}</label>
        <input type="number" name="flaws" value="${minFlaws}" min="${minFlaws}" max="2" />
      </div>
      <div class="form-group">
        <label>${game.i18n.localize("OMENS13.CheckDialog.FacingEvil")}</label>
        <input type="number" name="facingEvilOmen" value="0" min="0" max="2" />
      </div>
      <div class="form-group checkbox">
        <label>
          <input type="checkbox" name="harmless" />
          ${game.i18n.localize("OMENS13.CheckDialog.Harmless")}
        </label>
      </div>
    </form>
  `;

  return DialogV2.wait({
    // classes:["omens13"] (25e itération) : le formulaire portait déjà .omens13,
    // mais DialogV2 rend ses boutons de pied de page (Draw dice/Cancel) en dehors
    // de ce contenu — sans la classe sur la fenêtre elle-même, ces boutons (et
    // tout autre chrome ajouté par DialogV2) restaient sur le thème par défaut de
    // Foundry au lieu du thème "Abyssal Omen". `classes` est une option de premier
    // niveau (comme DEFAULT_OPTIONS.classes sur les fiches d'Actor/Item), pas une
    // sous-clé de `window` — `window` ne gère que title/icon/resizable etc.
    classes: ["omens13"],
    window: { title: game.i18n.format("OMENS13.CheckDialog.Title", { aspect: aspectLabel }) },
    position: { width: 420 },
    content,
    buttons: [
      {
        action: "roll",
        label: game.i18n.localize("OMENS13.CheckDialog.Roll"),
        icon: "fa-solid fa-hand-fist",
        default: true,
        callback: (event, button) => {
          const fd = new FormDataExtended(button.form);
          const data = fd.object;
          return {
            difficulty: data.difficulty,
            edges: Number(data.edges) || 0,
            flaws: Number(data.flaws) || 0,
            facingEvilOmen: Number(data.facingEvilOmen) || 0,
            harmless: !!data.harmless
          };
        }
      },
      {
        action: "cancel",
        label: game.i18n.localize("OMENS13.CheckDialog.Cancel"),
        icon: "fa-solid fa-xmark"
      }
    ],
    rejectClose: false
  }).then(result => (result === "cancel" || result == null ? null : result));
}
