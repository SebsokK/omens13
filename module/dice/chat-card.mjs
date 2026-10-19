/**
 * Construit et publie la carte de chat décrivant le résultat d'un Check.
 * @param {object} result  L'objet renvoyé par performCheck().
 */
export async function postCheckCard(result) {
  if (!result) return;

  const { renderTemplate } = foundry.applications.handlebars;

  const templateData = {
    ...result,
    diceDisplay: result.dice.map((d, index) => ({
      ...d,
      index,
      used: result.used.includes(d),
      wound: d === result.woundDie
    }))
  };

  const content = await renderTemplate("systems/omens13/templates/chat/check-result.hbs", templateData);

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: result.actor }),
    content,
    // Attacher le Roll déjà évalué (voir bourse-engine.mjs#rollDice) est ce qui déclenche
    // l'animation Dice So Nice automatiquement via le hook createChatMessage — on n'appelle
    // JAMAIS game.dice3d.showForRoll() ailleurs, pour éviter un double jet animé.
    rolls: result.roll ? [result.roll] : undefined,
    sound: CONFIG.sounds.dice,
    flags: {
      omens13: {
        checkResult: {
          outcome: result.outcome,
          total: result.total,
          effectiveTn: result.effectiveTn,
          woundApplied: result.woundApplied,
          // 41e itération : figé au moment du Check (voir performCheck()) —
          // seule la condition de règle (tirage avec ≥1 dé Safe, Blessure
          // réellement appliquée) est stockée ici. L'état "déjà utilisé cet
          // Acte/histoire" ou "plus de dé Safe" est réévalué dynamiquement à
          // chaque affichage de la carte par activateCheckCardCheatDeath()
          // (omens13.mjs), pas figé ici, pour refléter l'état réel au moment
          // où le joueur regarde/clique plutôt que celui du Check d'origine.
          cheatDeathEligible: result.cheatDeathEligible,
          actorId: result.actor.id
        }
      }
    }
  });
}

/**
 * Envoie une carte de chat thémée pour un Perk (titre cliquable de
 * l'accordéon, voir #onSendPerkToChat dans actor-character-sheet.mjs) —
 * même principe que postCheckCard : template dédié + flag `flags.omens13.
 * perkCard` pour que markOmensChatMessage() (omens13.mjs) neutralise la
 * bulle de chat par défaut de Foundry. Depuis la 34e itération, la carte
 * n'affiche plus l'icône propre du Perk (un Perk n'en a généralement pas
 * de pertinente) mais le portrait du personnage propriétaire, en filigrane,
 * exactement comme sur la carte de résultat de Check (voir portrait-frame/
 * portrait-image/portrait-fade, styles/omens13.css).
 */
export async function postPerkCard(item) {
  if (!item) return;

  const { renderTemplate } = foundry.applications.handlebars;

  const description = await foundry.applications.ux.TextEditor.implementation.enrichHTML(
    item._source.system.description || "",
    { relativeTo: item }
  );

  const content = await renderTemplate("systems/omens13/templates/chat/perk-card.hbs", {
    name: item.name,
    actorImg: item.actor?.img,
    description
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: item.actor }),
    content,
    flags: {
      omens13: {
        perkCard: true
      }
    }
  });
}

/**
 * Envoie une carte de chat thémée annonçant un Cheat Death (34e itération,
 * retour utilisateur) — jusqu'ici cette action ne produisait aucun message de
 * chat, seul l'état du Dice Bag changeait silencieusement. Même principe que
 * postCheckCard/postPerkCard : template dédié, portrait du personnage en
 * filigrane, flag `flags.omens13.cheatDeathCard` pour que
 * markOmensChatMessage() (omens13.mjs) neutralise la bulle de chat par défaut
 * de Foundry. Appelée depuis #onCheatDeath (dice-bag-app.mjs) uniquement si
 * cheatDeath() (bourse-engine.mjs) a réussi (return true) — pas de carte pour
 * une tentative refusée (déjà utilisé cet Acte/cette histoire, plus de dé Safe).
 */
export async function postCheatDeathCard(actor) {
  if (!actor) return;

  const { renderTemplate } = foundry.applications.handlebars;

  const message = game.i18n.format("OMENS13.Chat.CheatDeathAnnounce", { name: actor.name });

  const content = await renderTemplate("systems/omens13/templates/chat/cheat-death-card.hbs", {
    actorImg: actor.img,
    message
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    flags: {
      omens13: {
        cheatDeathCard: true
      }
    }
  });
}

/**
 * Carte de chat annonçant qu'un personnage succombe (p.9), même gabarit que la
 * carte de Cheat Death.
 */
export async function postSuccumbCard(actor) {
  if (!actor) return;

  const { renderTemplate } = foundry.applications.handlebars;
  const content = await renderTemplate("systems/omens13/templates/chat/cheat-death-card.hbs", {
    actorImg: actor.img,
    message: game.i18n.format("OMENS13.Chat.SuccumbAnnounce", { name: actor.name })
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    flags: { omens13: { succumbCard: true } }
  });
}

/**
 * Carte de chat d'un Sacrifice héroïque (p.9) : réussite automatique, le
 * personnage quitte l'histoire. Même gabarit que la carte de Cheat Death.
 */
export async function postSacrificeCard(actor, aspectLabel) {
  if (!actor) return;

  const { renderTemplate } = foundry.applications.handlebars;
  const content = await renderTemplate("systems/omens13/templates/chat/cheat-death-card.hbs", {
    actorImg: actor.img,
    message: game.i18n.format("OMENS13.Chat.SacrificeAnnounce", { name: actor.name, aspect: aspectLabel })
  });

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor }),
    content,
    flags: { omens13: { sacrificeCard: true } }
  });
}
