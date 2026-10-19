import { DIFFICULTIES } from "../helpers/constants.mjs";

const { escapeHTML } = foundry.utils;

/** Sélecteur à boutons (0/1/2) adossé à un champ caché qui porte la valeur. */
function segmented(name, values, value = 0) {
  const buttons = values.map(v => `<button type="button" data-value="${v}" class="${v === value ? "active" : ""}">${v}</button>`).join("");
  return `<div class="segmented" data-name="${name}"><input type="hidden" name="${name}" value="${value}" />${buttons}</div>`;
}

/** Interrupteur (case à cocher affichée comme un bouton). */
function toggle(name, label, icon) {
  return `<label class="toggle-pill"><input type="checkbox" name="${name}" /><i class="${icon}"></i> ${label}</label>`;
}

/** Sélectionne une valeur d'un sélecteur à boutons. */
function setSegmented(group, value) {
  group.querySelector("input").value = value;
  for (const b of group.querySelectorAll("button")) b.classList.toggle("active", Number(b.dataset.value) === value);
}

/**
 * Boîte de dialogue de préparation d'un Check : Aspect, difficulté, objet
 * utilisé, Edges et Flaws (boutons 0/1/2), Facing Evil (un Omen forcé par
 * l'Hôte, p.8) et Harmless (interrupteurs).
 *
 * Flaws obligatoires (p.9) : un Aspect Strained impose 1 Flaw, et 3 Blessures
 * ou plus en imposent un autre, d'une source distincte — le minimum du champ
 * Flaws suit l'Aspect choisi. Un objet intact donne un Edge, un objet cassé un
 * Flaw (p.10) : ils s'ajoutent aux valeurs saisies (voir la fiche).
 *
 * @param {object} options
 * @param {{group: string, path: string, label: string, tn: number|null, strained: boolean}[]} options.aspects
 *   Tous les Aspects ; ceux sans Notation (tn null) sont affichés mais désactivés.
 * @param {string} [options.aspectPath]   Aspect présélectionné (ex. "core.evade").
 * @param {{name: string, broken: boolean}[]} [options.gear=[]]  Équipement du personnage.
 * @param {number|null} [options.gearIndex=null]  Objet présélectionné.
 * @param {boolean} [options.permanentFlaw=false]  Le personnage a 3 Blessures ou plus.
 * @param {string} options.title          Titre de la fenêtre.
 * @returns {Promise<object|null>} null si annulé.
 */
export async function promptCheckOptions({ aspects, aspectPath, gear = [], gearIndex = null, permanentFlaw = false, title } = {}) {
  const { DialogV2 } = foundry.applications.api;
  const loc = key => game.i18n.localize(key);

  // Deux groupes (Fondamentaux / Histoire) ; un Aspect sans Notation reste
  // visible mais n'est pas sélectionnable.
  const aspectOptions = ["core", "story"].map(group => {
    const options = aspects.filter(a => a.group === group).map(a => a.tn == null
      ? `<option value="${a.path}" disabled>${escapeHTML(a.label)} — ${loc("OMENS13.CheckDialog.NoRating")}</option>`
      : `<option value="${a.path}" ${a.path === aspectPath ? "selected" : ""}>${escapeHTML(a.label)} — TN ${a.tn}</option>`
    ).join("");
    return `<optgroup label="${loc(group === "core" ? "OMENS13.Sheet.CoreAspects" : "OMENS13.Sheet.StoryAspects")}">${options}</optgroup>`;
  }).join("");

  const difficultyOptions = DIFFICULTIES.map(d =>
    `<option value="${d}" ${d === "average" ? "selected" : ""}>${loc(`OMENS13.Difficulty.${d}`)}</option>`
  ).join("");

  const gearOptions = [`<option value="">${loc("OMENS13.CheckDialog.NoGear")}</option>`]
    .concat(gear.map((g, i) => {
      // Objets non choisis absents de la liste, sauf celui qui a lancé le Check.
      if (g.hidden && i !== gearIndex) return "";
      const effect = loc(g.broken ? "OMENS13.CheckDialog.GearBrokenFlaw" : "OMENS13.CheckDialog.GearEdge");
      return `<option value="${i}" ${i === gearIndex ? "selected" : ""}>${escapeHTML(g.name)} (${effect})</option>`;
    }))
    .join("");

  const content = `
    <div class="omens13 check-dialog">
      <div class="form-group">
        <label>${loc("OMENS13.CheckDialog.Aspect")}</label>
        <select name="aspectPath">${aspectOptions}</select>
      </div>
      <p class="hint strained-hint" data-hint="strained">${loc("OMENS13.CheckDialog.StrainedHint")}</p>
      ${permanentFlaw ? `<p class="hint strained-hint">${loc("OMENS13.CheckDialog.PermanentFlawHint")}</p>` : ""}
      <div class="form-group">
        <label>${loc("OMENS13.CheckDialog.Difficulty")}</label>
        <select name="difficulty">${difficultyOptions}</select>
      </div>
      ${gear.length ? `
      <div class="form-group">
        <label>${loc("OMENS13.CheckDialog.Gear")}</label>
        <select name="gearIndex">${gearOptions}</select>
      </div>` : ""}
      <div class="form-group">
        <label>${loc("OMENS13.CheckDialog.Edges")}</label>
        ${segmented("edges", [0, 1, 2])}
      </div>
      <div class="form-group">
        <label>${loc("OMENS13.CheckDialog.Flaws")}</label>
        ${segmented("flaws", [0, 1, 2])}
      </div>
      <div class="toggles">
        ${toggle("facingEvilOmen", loc("OMENS13.CheckDialog.FacingEvil"), "fa-solid fa-skull")}
        ${toggle("harmless", loc("OMENS13.CheckDialog.Harmless"), "fa-solid fa-shield-heart")}
      </div>
    </div>
  `;

  // Minimum de Flaws et rappel Strain selon l'Aspect choisi : les boutons
  // sous le minimum sont désactivés.
  const syncAspect = form => {
    const aspect = aspects.find(a => a.path === form.elements.aspectPath.value);
    const minFlaws = Math.min(2, (aspect?.strained ? 1 : 0) + (permanentFlaw ? 1 : 0));
    const flaws = form.querySelector(".segmented[data-name=flaws]");
    for (const b of flaws.querySelectorAll("button")) b.disabled = Number(b.dataset.value) < minFlaws;
    setSegmented(flaws, Math.max(Number(flaws.querySelector("input").value) || 0, minFlaws));
    form.querySelector("[data-hint=strained]").hidden = !aspect?.strained;
  };

  return DialogV2.wait({
    // classes sur la fenêtre elle-même, pour que les boutons du pied de page
    // (rendus par DialogV2 hors du contenu) prennent aussi le thème.
    classes: ["omens13"],
    window: { title },
    position: { width: 440 },
    content,
    render: (event, dialog) => {
      const form = dialog.element.querySelector("form");
      syncAspect(form);
      form.elements.aspectPath.addEventListener("change", () => syncAspect(form));
      form.addEventListener("click", event => {
        const button = event.target.closest(".segmented button");
        if (button && !button.disabled) setSegmented(button.closest(".segmented"), Number(button.dataset.value));
      });
    },
    buttons: [
      {
        action: "roll",
        label: loc("OMENS13.CheckDialog.Roll"),
        icon: "fa-solid fa-hand-fist",
        default: true,
        callback: (event, button) => {
          const data = new foundry.applications.ux.FormDataExtended(button.form).object;
          return {
            aspectPath: data.aspectPath,
            difficulty: data.difficulty,
            gearIndex: data.gearIndex === "" || data.gearIndex == null ? null : Number(data.gearIndex),
            edges: Number(data.edges) || 0,
            flaws: Number(data.flaws) || 0,
            facingEvilOmen: data.facingEvilOmen ? 1 : 0,
            harmless: !!data.harmless
          };
        }
      },
      {
        action: "cancel",
        label: loc("OMENS13.CheckDialog.Cancel"),
        icon: "fa-solid fa-xmark"
      }
    ],
    rejectClose: false
  }).then(result => (result === "cancel" || result == null ? null : result));
}
