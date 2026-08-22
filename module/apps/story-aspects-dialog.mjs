function escapeAttr(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Boîte de dialogue permettant de définir en un seul endroit les 5 libellés
 * des Story Aspects (ils changent à chaque histoire, contrairement aux Core
 * Aspects qui sont fixes). Remplace l'ancienne édition en ligne (input directement
 * dans le tableau de la fiche), qui empêchait d'aligner la mise en page des
 * Story Aspects sur celle des Core Aspects.
 * @param {object} options
 * @param {string[]} options.current Libellés actuels, dans l'ordre story1..story5.
 * @returns {Promise<string[]|null>} Nouveaux libellés dans le même ordre, ou null si annulé.
 */
export async function promptStoryAspectLabels({ current = [] } = {}) {
  const { DialogV2 } = foundry.applications.api;

  const rows = current
    .map((label, i) => `
      <div class="form-group">
        <label>${game.i18n.format("OMENS13.StoryAspectsDialog.Slot", { n: i + 1 })}</label>
        <input type="text" name="label${i}" value="${escapeAttr(label)}" placeholder="${escapeAttr(game.i18n.localize("OMENS13.Sheet.UnnamedAspect"))}" />
      </div>
    `)
    .join("");

  const content = `
    <form class="omens13 story-aspects-dialog">
      <p class="hint">${game.i18n.localize("OMENS13.StoryAspectsDialog.Hint")}</p>
      ${rows}
    </form>
  `;

  return DialogV2.wait({
    window: { title: game.i18n.localize("OMENS13.StoryAspectsDialog.Title") },
    content,
    buttons: [
      {
        action: "save",
        label: game.i18n.localize("OMENS13.StoryAspectsDialog.Save"),
        icon: "fa-solid fa-check",
        default: true,
        callback: (event, button) => {
          const fd = new FormDataExtended(button.form);
          const data = fd.object;
          return current.map((_, i) => String(data[`label${i}`] ?? "").trim());
        }
      },
      {
        action: "cancel",
        label: game.i18n.localize("OMENS13.StoryAspectsDialog.Cancel"),
        icon: "fa-solid fa-xmark"
      }
    ],
    rejectClose: false
  }).then(result => (result === "cancel" || result == null ? null : result));
}
