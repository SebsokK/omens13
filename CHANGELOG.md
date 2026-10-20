# Changelog

*[Lire en français](CHANGELOG.fr.md)*

## 0.2.2

- **Check window**: the Host-added Omen toggle is now called **Facing Evil**, the rulebook term (p.8) already shown on the chat card. Tooltips explain Facing Evil and Harmless Check.

## 0.2.1

- **Valiant Sacrifice** (p.9): when a character one Wound from death draws an Omen Die (a Host-forced Omen counts), the player chooses before rolling: roll the dice, or sacrifice. The Check automatically succeeds, the character leaves the story and all their dice return to the bag, as when succumbing.
- **Gear not chosen**: right-click an item to hide it; hidden items go to the end of the list, can be shown from the section header, and are left out of the Check window.
- **Check window**: Aspects grouped (Core / Story); Aspects without a Rating are shown greyed out instead of disappearing.

## 0.2.0

**Rules (checked against the rulebook)**
- **Cheat Death**: once per Act for the whole table (not per character), once per story per character. The Wound is replaced by a Safe Die taken out of the bag, and the Omen Die goes back into the bag (it used to go to the Host's Reserve). Undo restores everything exactly.
- **Death and Despair**: at the last Wound, the character can still Cheat Death or **Succumb** (Dice Bag button, with confirmation): all the dice in front of them go back into the bag, including a Cheat Death Safe Die, and they leave the story.
- **Group size**: the death threshold follows the number of characters chosen in the Dice Bag (+2 Wounds with 1 character, +1 with 2, −1 with 5, −2 then −1 with 6). The permanent Flaw stays at 3 Wounds.
- **Harmless Checks**: an Omen Die at or under the current Act gives a Strain on the rolled Aspect instead of a Wound (the Host can untick it).
- **Gear**: an intact item used in a Check gives an Edge, a broken or lost item gives a Flaw.

**Dice Bag**
- The Host chooses which characters play the story (only they are shown).
- **New story** button (Host): resets the bag and fully restores every character, to replay a scenario.
- **Bring back** button (Host) for a character who left the story.
- The floating button now opens *and* closes the Dice Bag, and stays on screen when the window is resized.

**Character sheet**
- Rebuilt on Foundry's native form handling and `<prose-mirror>` editors (Goal, Notes, Perk descriptions): fields save reliably.
- **Perks**: Owned / Strain / **Hide** per Perk, owned Perks on top, hidden Perks greyed at the bottom and collapsible from the section header; edit and delete on hover; the description unfolds in a box.
- **Gear** as tags: click to make a Check with the item, right-click to rename, mark as broken/lost (greyed and struck through, kept in the list) or repaired, or delete.
- New **Perk sheet** (name, image, Owned/Strain/Hidden, description).
- **Check window**: Aspect and item pickers, 0/1/2 buttons for Edges and Flaws, toggles for Host-forced Omen and Harmless Check.

**Atmosphere**
- Full-screen title for every player when the Host moves to the next Act.
- Chat cards: dice drop out of the bag one by one, the wounding Omen Die glows and pulses, the Wound banner shakes.
- A character at the death threshold pulses in the Dice Bag.
- The pause screen theme now survives every pause (native V14 hook).
- Token bar: Wounds shown as a gauge (value / death threshold).

**Under the hood**
- Removed code made for older Foundry versions, deprecated hooks and dead code.

## 0.1.x — development log

- **Character sheet**: 5 Core Aspects (Courage, Evasion, Combat, Luck, Perception) + 5 free-label Story Aspects, each with a Rating → automatically computed TN, a Strain checkbox, and a direct Check button. Perks (free list, add/remove), Gear, Traits, and Notes sections (ProseMirror editor).
- **The Dice Bag** (a floating panel, not a character sheet — see 2nd iteration below): a virtual bag with 8 Safe dice and up to 13 Omen dice, an Act selector (Prologue/1/2/3), tracking of the Host's Reserve vs dice in play, and a Wounds row for each character with a **Cheat Death** button. The data is carried by a singleton Actor hidden from the Actors tab, with **Owner for everyone** permission: any player can draw dice without depending on the Host being online (only the "Add to bag/Remove from bag" actions and changing the Act are reserved for the Host).
- **Fully automated Check engine**: random draw from the bag (2 to 4 d6 depending on net Edges/Flaws), highest-2/lowest-2 rule, comparison against the TN (+ difficulty modifier), Wound detection (Omen die ≤ current Act), automatic update of the Dice Bag and the sheet, result card in chat.
- **Abyssal Omen** graphic theme (dark red/black, Epilogue / Libre Caslon Text / JetBrains Mono fonts) applied to the sheet, the Dice Bag, and the chat cards.
- **Official assets integrated** (`assets/branding/`, `assets/textures/`): "13 OMENS" logo banner on the sheet and the Dice Bag, Dice Bag image (default icon of the singleton Actor), `showcase.png` image declared as `background`/`media` in `system.json` (visual shown on Foundry's setup screen), paper/post-it textures behind the sheet and the Notes section, and the **Death Icon** displayed as a medallion on a character's portrait at 4/4 Wounds in the Dice Bag tracker (26th iteration).

### Fixes and improvements — 2nd iteration (real-game testing feedback)

- **TN not updating** when an Aspect's Rating changed: fixed, see 1st iteration below. Confirmed working by the user.
- **Background with a visible black margin**: Foundry's `.window-content` has a default padding that left a black frame around the paper texture. Removed (`padding: 0`), spacing is now handled by our own containers.
- **Stats / Notes tabs**: the header (portrait, name, traits, Wounds) stays permanently visible; the body of the sheet switches between "Stats" (Aspects/Perks/Gear) and "Notes" (ProseMirror editor) via two tabs in the top right. Tab switching is handled in pure CSS/DOM (no re-render) so it never interrupts an ongoing ProseMirror edit.
- **Enlarged portrait** in portrait format (110×150) instead of a small square. Clicking it now opens the file picker (a missing action in v0.1, fixed along the way).
- **Shrunk section titles** (CORE ASPECTS, PERKS, etc.): treated as discreet labels (small, uppercase, monospace) rather than large page headings.
- **Dice So Nice integration**: each Check builds a real Foundry `Roll` (one `1d6` term per die drawn) evaluated once, attached to the chat message via `rolls`. It's this single evaluation that triggers the Dice So Nice animation automatically (the `createChatMessage` hook) — the code never calls `game.dice3d.showForRoll()` on top of that, so there's no double roll. Two colorsets are registered on the `diceSoNiceReady` hook and forced per die via `term.options.flavor`/`term.options.appearance`: **Safe Dice** = black/white, **Omen Dice** = red/black. ⚠️ This integration could not be tested with an actual Dice So Nice install — the exact API (key names `addColorset`, `options.flavor` vs `options.appearance`) may have changed slightly depending on the module version; to be checked at the table and reported if the animation doesn't trigger or the colors aren't picked up.
- **"La Bourse" renamed to "Dice Bag"** everywhere (fr/en).
- **Dice Bag turned into a floating panel** (`Omens13DiceBagApp`, `module/apps/dice-bag-app.mjs`): it's no longer an Actor Sheet — it's a pure `ApplicationV2`, like a dialog box, draggable/resizable by default. The `bourse` Actor still serves as the backstage data carrier (Owner-for-everyone permission, for synchronization without any network code), but its entry is hidden from the Actors tab. Three ways to open the panel (deliberately redundant, since the scene controls API could not be tested under real conditions):
  1. A button in the scene controls (toolbar to the left of the canvas) — **best-effort**, the API changed between Foundry V13/V14 versions and could not be verified live.
  2. **Ctrl+Shift+D** keyboard shortcut (reliable, independent of the scene controls API).
  3. From the console or a macro: `game.omens13.openDiceBag()`.

### Fixes and improvements — 3rd iteration (real-game testing feedback)

- **Empty default Rating**: added an "empty" Rating (`unset`, displayed as `—`), with no associated TN, placed at the top of the dropdown menu and made the default value for all Aspects (Core as well as Story) when a character is created. The TN shows `—` as long as no Rating has been chosen, and the corresponding Check button is disabled (with a warning message if the click is forced from the console) to avoid a roll with an undefined TN.
- **"Edit" button on Story Aspects**: the "Story Aspects" title row now has a pencil button that opens a dialog listing the 5 slots, to set the labels in a single place rather than typing directly into the table. The "Aspect" column of the Story Aspects table therefore went back to being plain text (as with Core Aspects), aligned strictly on the same layout.
- **Core/Story Aspects table layout unified and no longer truncated**: both tables now use a `table-layout: fixed` with identical, explicit column widths; the Aspect label can wrap onto a new line instead of being cut off, and the Rating dropdown has been widened (with slightly smaller font) so it no longer truncates "Terrible"/"Excellent" etc.

### Fixes and improvements — 4th iteration (real-game testing feedback)

- **"Goal" block in the header**: new `system.goal` field, under Traits, edited in ProseMirror (same mechanism as Notes). Deliberately compact (smaller than the Notes editor) but never truncated: the header has no fixed height nor `overflow: hidden`, it grows with the content.
- **Wounds adjustable downward (and upward)**: two +/- buttons appear next to each character's Wounds counter in the Dice Bag, visible to the character's owner (and the Host). Since the number of dice in the Reserve is already computed from the total Wounds of all characters, lowering a Wound automatically returns the corresponding Omen die to the Reserve — no extra code was needed to "adjust the dice," that was already the logic in place.
- **The "disappeared" Dice Bag**: since becoming a floating panel (see 2nd iteration), it only opened on manual action (best-effort scene control button, Ctrl+Shift+D, or macro), which made it invisible by default. It now opens automatically for all clients when the world loads (with a retry after 2 seconds if the Host hasn't finished creating it yet). It remains closeable/movable/reopenable normally afterward; it will simply reopen on the next load.

### Fixes and improvements — 5th iteration (real-game testing feedback)

- **Dice icons removed** from the Aspects tables to save space: there is no longer a dedicated column for the roll button. The TN itself is now clickable to trigger the corresponding Check (highlighted on hover); if it's empty (no Rating chosen), the click triggers the same warning as before instead of a roll.
- **Core Aspects / Story Aspects headers strictly aligned**: the "Core Aspects" row now carries an invisible EDIT button (same size as the real "Story Aspects" button, just hidden) solely to occupy the same space — both headers, and therefore both tables, are now aligned to the same pixel height.

### Fixes — 6th iteration (real-game testing feedback, 08/20/2026)

- **"Dice Bag" button that wouldn't reopen the closed panel**: the scene control button called `toggle()`, and provided both `onChange` AND `onClick` out of caution (the exact callback name having changed between Foundry versions). If both fire for the same click, the `toggle()` cancels itself out (opens then immediately closes), producing no visible effect — probably the cause of the reported bug. The button now always calls `render(true)` (opening, never closing): called twice in a row, it has no undesirable effect. To close the panel: its own close button, or Ctrl+Shift+D (a single guaranteed trigger, so it stays a `toggle()`).
- **Confirmation**: this button has no `game.user.isGM` check anywhere in the code (neither on its visibility nor on its callbacks) — it is meant to be visible and functional for the Host AND all Players. Not yet verified in a real game with an actual Player account.
- **"Broken" title bar icons (empty squares)**: `DEFAULT_OPTIONS.classes` (`["omens13", ...]`) applies to the outer element of the Foundry window, which also contains the native chrome (title, minimize/pop-out/close buttons) — not just our own content. Our generic CSS rules for `button`/`h1` (the "Epilogue" font) were therefore also applying to those native buttons, overriding their icon font and showing empty squares instead of glyphs. Fixed by excluding `.header-control` (native buttons) and `.window-title` (native title) from our rules.

### Fixes — 7th iteration (real-game testing feedback, 08/20/2026)

- **The scene control button still wasn't reopening the Dice Bag** (no console error) despite the 6th-iteration fix: without being able to test live, the exact cause couldn't be pinned down, so rather than keep guessing at the scene controls API, **a new floating "Dice Bag" button was added directly to the DOM** (bottom right of the screen, visible to everyone), with its own `addEventListener` — no dependency on an uncertain Foundry API, so guaranteed to work. The scene control button and the Ctrl+Shift+D shortcut remain in place as redundant access points.
- **Check result cards reskinned**: the "white outline" came from Foundry's default message bubble (light theme introduced in V13) surrounding our already-dark card. Neutralized (background/border/shadow removed) for Check messages only, identified via their `flags.omens13.checkResult` flag.
- **Card title shrunk** ("Courage", "Ghost Stormers Lore"...): was using a browser's default `<h3>` size, brought down to a more modest size.
- **Portrait watermark**: the portrait of the character who made the roll now appears in the card's background, in transparency, behind the result.

### Fixes — 8th iteration (real-game testing feedback, 08/20/2026)

- **Portrait watermark redone** in a "black background + portrait revealed on the right with a gradient" style (instead of the uniformly transparent, discreet watermark from the 7th iteration): the portrait is sized to the card's height (not its width), to show as much of it as possible, and a horizontal gradient progressively eats into the image from the left side (where the text and dice are) to leave it almost intact on the right side.
- **Confirmed working: the floating Dice Bag button**. Repositioned (`right: 320px` instead of `16px`) to sit between the macro bar and the chat sidebar rather than stuck to the right edge — a value estimated without being able to test live, to be adjusted if needed.

### Fixes — 9th iteration (real-game testing feedback, 08/20/2026)

- **Scene control button removed**: it never worked reliably in real play despite two fix attempts (6th/7th iteration); removed from the code rather than continuing to guess at the API. The floating DOM button (confirmed working) and Ctrl+Shift+D remain the two ways to access the Dice Bag.
- **Floating Dice Bag button now draggable**: rather than continuing to guess a universal pixel position (impossible to get right for every screen, especially ultra-wide ones), the button can now be freely dragged and dropped, and its position is remembered per client (the `diceBagFabPosition` setting, "client" scope — each user has their own, persisted across sessions). A click without movement opens the Dice Bag; a drag (>4px) moves the button without opening it.
- **Check card portrait reworked**: pinned to the right edge (`background-position: right` instead of `center`, which sometimes revealed a gray border specific to the source image rather than the character), and the gradient simplified to a single plateau + a single continuous slope (instead of several steps) for a stronger, more gradual blend on the left side, with no banding effect.

### Fixes — 10th iteration (real-game testing feedback, 08/20/2026)

- **Portrait watermark softened**: the portrait was too pronounced and hurt the card's readability. The image now carries an `opacity: 0.38` (the whole portrait more transparent, a discreet detail rather than a dominant presence), and the gradient goes from two stops (opaque plateau + a single slope) to six progressive stops for a gradual transition between the background and the avatar, with no sharp cutoff.

### Fixes — 11th iteration (real-game testing feedback, 08/20/2026)

- **Portrait cut line eliminated**: despite the 10th-iteration's progressive gradient, an edge was still visible on the left side of the avatar — identified cause: a semi-transparent color layer laid over an image at fixed opacity stays "flat" (the photo itself doesn't fade out). Replaced with a real `mask-image` gradient (8 stops) directly on the image, which progressively makes the pixels themselves disappear from left (transparent) to right (opaque) — the only method that produces a genuinely continuous fade. The color layer (`.portrait-fade`) is kept as a supplement, lightened, to smooth the very small remaining margin against the card's background. The image's base opacity raised to 0.55 (compensated for by the mask, which already makes it fully disappear on the left side).

### Fixes — 12th iteration (real-game testing feedback, 08/20/2026)

- **Portrait mask stretch adjusted**: `mask-size` changed from `100% 100%` to `325% 100%` (a value tested and validated live by the user via DevTools) — stretches the mask's gradient well beyond the card's width, which makes the image's pixels disappear even more gradually to the eye.
- **Bug fixed: character Name and Traits not saving**. These two fields were still using ApplicationV2's generic `name`-attribute binding (`submitOnChange`), while all the other fields on the sheet (Aspects, Perks, Gear) had already been migrated to an explicit manual binding (`data-scope` + `actor.update()`) following an identical reliability issue found earlier in development. Name and Traits now follow the same reliable mechanism — they should save normally.

### Fixes — 13th iteration (real-game testing feedback, 08/20/2026)

- **Bug fixed: Aspects tables too wide / Strain column off-screen**. Cause: a CSS Grid item by default has a `min-width: auto` based on the widest content among its descendants (the Rating `<select>`), rather than on the width allotted to it — the grid of both tables therefore grew beyond the sheet, even with `table-layout: fixed`. Fixed with `min-width: 0` on the grid columns and on the `<select>`.
- **Aspect label font changed** to match the one used for Perks/Gear fields (JetBrains Mono, as everywhere else in the system's `<input>`s) instead of the sheet body's serif font, judged less readable here. Slightly reduced size. The label no longer ever wraps onto two lines (a single line, with ellipsis as a safety net if a Story Aspect has a really long name).
- **Entire Aspect row now clickable**: the red hover and the click to trigger the Check, previously limited to the TN cell, now cover the whole row — except for the Rating `<select>` and the Strain checkbox, explicitly excluded so as to never trigger an accidental roll when changing either one.

### Fixes — 14th iteration (real-game testing feedback, 08/20/2026)

- **Bug fixed: the end of the "Strain" column (header + checkboxes) stayed cut off** despite the 13th-iteration fix. Cause: the `min-width: 0` set on the Aspects blocks did remove the grid overflow, but then let the columns compress WITHOUT A FLOOR below that — to the point of crushing the Strain checkbox if the window was resized narrower than its default width (760px). Replaced with a fixed 260px floor per Aspect block: below that width, it's now the entire sheet that scrolls horizontally rather than cutting off content.
- **Vertical scrollbar added**. The sheet already declared `scrollable: [""]` on the Foundry side (remembering scroll position between renders), but that option does not itself provide the CSS `overflow` needed for scrolling to be possible — any content exceeding the window's height (lots of Perks/Gear, a window resized smaller) was therefore invisible, with no way to reach it. `overflow-y: auto` (and `overflow-x: auto` as a symmetric safety net) added on the sheet's root container. The same fix was applied preemptively to the Dice Bag panel, which had exactly the same latent flaw.

### Fixes — 15th iteration (real-game testing feedback, 08/20/2026)

- **Scrollbar themed in red**: scrolling worked but kept the browser's default rendering. `scrollbar-color`/`scrollbar-width` (Firefox) + `::-webkit-scrollbar*` pseudo-elements (Chromium/Electron, Foundry's engine) added to pick up the "Abyssal Omen" theme's primary color.
- **Bug fixed: Strain column still cut off**. The 260px floor set in the 14th iteration fixed the grid overflow, but the internal column distribution left too much room for Rating (34%) when "Terrible," the longest Rating label, doesn't need it. Rebalanced to Label 40% / Rating 25% / TN 17% / Strain 18% — Strain goes from 10% to 18%, plenty to display the checkbox and its header in full.

### Fixes — 16th iteration (real-game testing feedback, 08/20/2026)

- **"Goal" box stretched to the edge of the header block**. The ProseMirror editor wasn't automatically taking up all the available width despite its flex-column parent, hence an empty space on the right. `width: 100%; box-sizing: border-box;` added to the editor and its content.
- **Bug fixed: the "Edit" pencil button could overlap the last line of the Goal text**. It's positioned `absolute` in the top right, with no reserved space — right padding was added to the text (on Goal, and preemptively on the Notes editor which has the same mechanism) so it never sits under the text again.

### Fixes — 17th iteration (real-game testing feedback, 08/20/2026)

- **"Goal" box actually stretched to the header's right edge, under the Wounds block**. The 16th-iteration fix (`width: 100%`) wasn't enough: the Goal block was still confined to its own flex column (`.header-fields`), which stopped before the column dedicated to Wounds. The Wounds badge now switches to `position: absolute` (floating, anchored to the top right of the header) instead of occupying its own column — `.header-fields` (Name, Traits, Goal) thus becomes the only remaining block after the portrait and naturally extends to the right edge. Name and Traits reserve space for the floating badge via right padding; Goal, further down, doesn't need it and now properly fills the reported empty space.

### Fixes — 18th iteration (real-game testing feedback, 08/20/2026)

- **Bug fixed: Name and Traits overlapped the floating Wounds badge**. The `padding-right` added in the 17th iteration did reserve space for the TEXT, but let the `<input>`'s own box (and thus its clearly visible `border-bottom`) extend full width underneath the badge. Replaced with `margin-right`, which shrinks the box itself — Name and Traits now stop cleanly before the badge, which no longer overlaps anything.

### Fixes — 19th iteration (real-game testing feedback, 08/20/2026)

- **Bug fixed (for good): Name/Traits × Wounds badge overlap**. After two attempts via margin adjustment (padding then margin, always a bit too tight), the header layout is restructured: Name+Traits and the Wounds badge are now true flex siblings side by side in a dedicated row (`.name-traits-row`), rather than Wounds guessed into a floating position on top. An overlap between them becomes structurally impossible, no more need to tweak a pixel value. The Goal box stays below this row, in its own line, and continues to stretch across the full width (including under Wounds) as requested in the 17th iteration.

### Fixes — 20th iteration (real-game testing feedback, 08/20/2026)

- **Perks converted into embedded Items (instead of a plain text table)**. Each Perk is now a real Foundry Document of type `perk` (name + ProseMirror description + "Active" checkbox), with its own minimal sheet (useful for future use in a Compendium or drag-and-drop). On the character sheet, each Perk displays as an accordion: a row that's always visible with the checkbox and name, a chevron to expand/collapse the description below. A newly created Perk automatically expands so its description can be typed right away.
- **Automatic migration of old Perks**. On the first world load after the update, any character still having old Perks in the table format (`system.perks`) has them automatically converted to embedded Items (name, description, and "Active" checkbox preserved). This migration is reserved to the Host (GM) and runs only once per character (it's skipped if Perk Items already exist). **Top-priority thing to verify**: that the existing Perk "Eager to Help" (or equivalent) is properly found as an Item after reloading the world.
- This change touches the data structure (`template.json`, new `module/data/perk.mjs` DataModel, new `module/sheets/item-perk-sheet.mjs` Item sheet) and the character sheet controller (target document resolution — Actor or Item — for manual fields and the ProseMirror editor). Since it could not be tested in play before delivery, please validate in particular: saving each Perk's name/"Active" checkbox/description, opening/closing the accordion, and creating/deleting a Perk.

### Fixes — 21st iteration (real-game testing feedback, 08/20/2026)

- **Bug fixed: unable to create a Perk ("type: perk is not a valid type")**. This wasn't a code bug: `template.json` (which declares valid Document types) is only reread by Foundry when a world launches, not on a simple page refresh. After returning to the Setup screen and relaunching the world, the `perk` type is correctly recognized.
- **Description accordion tightened up**. The global `min-height` values of the ProseMirror editors (designed for the larger Notes/Goal blocks) left a huge empty block for a short Perk description. The accordion now hugs the actual size of the text, with a reduced minimum to stay clickable if the description is empty.
- **Perk title clickable, red hover, posted to Chat**. The Perk's name is now clickable text (red hover, like the Aspect rows) that posts a themed chat card (name + description) to chat on click — a new `templates/chat/perk-card.hbs` template. Since the same click can't both rename and post to Chat, renaming now goes through a separate pencil icon next to the title, which temporarily reveals the input field (Enter or clicking elsewhere closes the field).
- **Description fonts (Notes/Goal/Perks) harmonized on Epilogue**. No font had ever been explicitly set on ProseMirror editor content: Foundry's core CSS therefore imposed its default system font rather than one of the theme's fonts. Now explicitly set to Epilogue (the theme's body text font) for all editors on the sheet.

### Fixes — 22nd iteration (real-game testing feedback, 08/20/2026)

- **Frames removed around Perks**. User feedback: too many frames, the composition needs room to breathe. The framed card (border + rounded corners) around each Perk is replaced with a simple separator line at the bottom of the row. The description now has no frame at all (neither border nor background): the text floats directly on the sheet's background, slightly indented under the title so it reads as a visual continuation rather than a separate block.

### Fixes — 23rd iteration (real-game testing feedback, 08/20/2026)

- **Perk buttons made ghost/hover-only**. Only the "expand" chevron stays permanently visible, but now truly stripped of any background/border (a CSS specificity bug had been preventing this style since the 20th iteration despite the rule already being present). The pencil (rename) and trash (delete) buttons, as well as the description's "Edit" pencil, are now hidden by default and only appear on hovering the relevant row.
- **Frame removed around the GEAR block**. Same treatment as Perks (22nd iteration): the framed box that surrounded the entire Gear section disappears, leaving just a bit of vertical spacing. Each item remains a free text field (so individually bordered, unlike Perks which use a clickable title) — Perks and Notes keep their section frame, unaffected by this request.

### Fixes — 24th iteration (real-game testing feedback, 08/20/2026)

- **Perk icon order and size rearranged**. Aligned right: Edit (pencil), Delete (trash, now the same size as the pencil), then Expand (chevron, same box size but a more discreet icon). The previous order (pencil, chevron, trash) is replaced with pencil, trash, chevron.
- **Correcting the 23rd-iteration misunderstanding about GEAR**: the request was about the internal presentation, not the section frame. GEAR now matches the Perks presentation exactly: a single frame around the whole block (as before the 23rd iteration), no more frame inside (each row loses its field background/border, replaced with a simple separator line between rows), and the Delete icon only appears on hovering the row, as with Perks.

### Fixes — 25th iteration (real-game testing feedback, 08/20/2026)

- **Check pop-up reskinned**. The form already carried the theme's class, but the dialog window itself (and thus its footer with the "Draw dice"/"Cancel" buttons) did not, and so was still on Foundry's default appearance rather than the "Abyssal Omen" theme. Fixed by giving the theme class to the entire window (same principle as the Actor/Item sheets).
- **Excessive line wrapping fixed**. Labels (e.g. "Host-forced Omen (Facing Evil)") were wrapping one word per line for lack of space. The layout changes from a stacked label/field arrangement to a label + field side by side on the same line, with a slightly increased window width — a long label now fits on one or two lines instead of six.

### Fixes — 26th iteration (real-game testing feedback, 08/20/2026)

- **Undoing a Cheat Death**. An "Undo" button (back arrow) replaces the Cheat Death button once it has been used: it returns the consumed Safe die and resets both usage flags (per Act and per Story), to correct a mistaken action. Reserved to the character's owner, like the original Cheat Death button.
- **Act selector (Story Act)**: added explicit error reporting (notification + console) when changing the Act, so that any silent failure becomes visible instead of vanishing without a trace. I was not able to reproduce the reported freeze locally — if the issue persists after this update, an error message should now display on screen (or in the F12 console): this message is needed to identify the exact cause.
- **Wound skull repositioned**. It no longer appears in the row of Wound pips (where it was misaligned): it's removed from that row (now uniformly red dots only) and appears as a medallion directly on the character's portrait once at 4/4 Wounds (grayed-out portrait + overlaid skull).

### Fixes — 27th iteration (real-game testing feedback, 08/21/2026)

- **Act selector (Story Act) diagnosis**: live DOM inspection (thanks for the screenshot!) — the Prologue/1/2/3 buttons carried a hard-coded `disabled` attribute, while the current source code only sets it `{{#unless isGM}}` and the user was correctly detected as Host for this render (the "+ Add to bag"/"− Remove from bag" buttons, themselves conditioned on `isGM`, were showing and working). These two facts can only coexist if the browser was displaying a cached version of the `dice-bag.hbs` template, older than the delivered code — a simple F5 doesn't always force Foundry to recheck a template file already loaded once in the tab. **A forced refresh (Ctrl+Shift+R / Cmd+Shift+R, not a plain F5) is needed to be sure of loading the latest version.**
- **System version number bumped (0.1.0 → 0.1.1)**. It had never changed since the system was created even though the code has been updated dozens of times: nothing signaled to the browser/Foundry that a file had changed. This number will be bumped with every future release to limit this kind of false negative ("the fix doesn't seem to apply" when it's actually in the delivered code).

### Fixes — 28th iteration (real-game testing feedback, 08/21/2026)

- **Real bug found for the Act selector** (the hard refresh from the 27th iteration changed nothing, so it wasn't a caching issue): in `templates/apps/dice-bag.hbs`, the `{{#each acts as |act|}}` loop referenced `isGM` and `system.currentAct` **without the `../` prefix** needed to reach back up to the template's outer context from inside a Handlebars loop — a classic templating-engine gotcha, already handled correctly elsewhere in the system (`{{#each ../ratings as |r|}}` on the character sheet) but forgotten on this particular line. Concrete result: `isGM` was `undefined` inside the loop, so `{{#unless isGM}}disabled{{/unless}}` set `disabled` on all 4 buttons permanently, for everyone (Host included); and `system.currentAct` was also `undefined`, so no button could ever be marked active. Fixed to `../system.currentAct` and `../isGM`.
- **Same bug fixed as a precaution on Perk descriptions**: `{{editor perk.enrichedDescription ... editable=editable}}` (inside the `{{#each perks as |perk|}}` loop) suffered from the same oversight — `editable` wasn't referencing the sheet's general context but instead tried to read it from the current Perk (which has no such property), unlike the same `{{editor}}` call used for Goal/Notes outside of any loop. Fixed to `editable=../editable`. Nobody had reported an issue on this specific point, but it's exactly the same class of bug — fixed at the same time for consistency.

### Fixes — 29th iteration (Dice Bag overhaul, real-game testing feedback, 08/21/2026)

- **"SAFE DICE" section renamed "DICE BAG" and merged with the Omen dice in the bag**. The white pips (Safe) and red pips (Omen currently in the bag) now display side by side in the same box, to visualize the actual danger ratio at a glance for a draw. When the Host adds an Omen die to the bag ("+ Add to bag"), a red pip appears directly in this box.
- **"Omen Dice / In The Bag" row removed**. The Host's Reserve keeps its own section ("RESERVE (HOST)"), with the Add/Remove from bag buttons unchanged, but the "In The Bag" sub-row is gone since its content now lives in the "DICE BAG" box.
- **New 2nd row per character in the Wounds tracker**, showing the dice actually in play in front of them: a small Omen die (red) per current Wound, and a Safe die (white) if a Cheat Death has been used this story. This row only exists in the interface if it has content — invisible at the start of the game, it appears as soon as a character takes their first Wound or cheats death.

### Fixes — 30th iteration (Dice Bag polish, real-game testing feedback, 08/21/2026)

- **No more "empty" pip in the DICE BAG box when a Cheat Death is used**. Until now the Safe pips followed a fixed capacity of 8 (like a gauge), so a Safe die consumed by a Cheat Death left an "empty" pip visible in its place. They now work like the Omen pips: dynamic length, only the dice actually in the bag, no empty slots displayed.
- **"Dice actually in the bag (...)" tooltip removed** under the DICE BAG box.
- **Story Act tooltip made dynamic**: instead of a fixed text recalling all 3 thresholds, it now shows only the marker corresponding to the currently selected Act (Prologue → "The Host always adds 1 Omen die at the end of the Prologue.", Act 1 → "1 to 4 Omen dice.", Act 2 → "5 to 8 Omen dice.", Act 3 → "9 to 13 Omen dice.").

### Fixes — 31st iteration (Omen dice "invented" by manually adjusting Wounds, 08/21/2026)

- **Bug fixed: manually adjusting a Wound could push the physical total past 13 Omen dice**. The number displayed for the Reserve was never an actual stored value — it's a computation (`13 − dice in the bag − total Wounds across all characters`) redone every time it's displayed. The Wounds tracker's +/- buttons only modified the character's Wound without ever touching the bag; when the computed Reserve was already at 0 (for instance with all 13 Omen dice in the Dice Bag), adding one more Wound should have pushed that computation negative — instead, it simply stayed displayed at 0, giving the impression that a 14th Omen die had just appeared out of nowhere.
- **Fix**: when a Wound is added manually and the Reserve has nothing left to give, the missing die is now pulled directly from the Dice Bag (the count of dice in the bag decreases by 1 in addition to the Wound). Removing a Wound doesn't change this behavior — the Reserve simply climbs back up on its own, with no risk of inventing anything in that direction. This logic is centralized in a new `adjustWound()` function in the engine (`bourse-engine.mjs`), on the same principle as the handling of Wounds caused by a Check (which was already correctly decrementing the bag).

### Fixes — 32nd iteration (Wounds cap, Strain on Aspects and Perks, 08/21/2026)

- **Bug fixed: a character could exceed their maximum Wounds (e.g. 5/4 observed in play)**. The cap already existed for manual Wound adjustment (+/- buttons) but not for Wounds automatically caused by a Check — fixed, a character can no longer ever exceed their deathThreshold (4 by default), regardless of the Wound's source.
- **Aspect Strain: mechanical effect added**. Checking an Aspect's Strain box (Core or Story) now forces at least 1 Flaw on the next Check on that Aspect — the Flaws field in the roll pop-up starts at 1 and can no longer go below that as long as the Aspect remains Strained.
- **Aspect Strain: visual effect added**. A Strained Aspect's whole row changes appearance (red-tinted background, name in red), to spot at a glance which Aspects are wounded.
- **Perks' "owned" checkbox redesigned**. It had exactly the same look as an Aspect's Strain checkbox, even though it represents something different (the player owns this Perk). It becomes a round red button when checked. Checking a Perk automatically moves it to the top of the Perks list.
- **New Strain checkbox on Perks**, added at the end of the row (before the Edit button), always visible. When checked, it gives the same visual effect as Aspect Strain (name in red, tinted background) — but with no mechanical effect, purely visual.

### Fixes — 33rd iteration (visual polish, 08/21/2026)

- **Strain checkboxes (both Aspects AND Perks) restyled**. The 32nd iteration had added these checkboxes without giving them their own style — they fell back to Foundry's default form-theme appearance (a solid gold/yellow square once checked), very different from the new round red "owned" button right next to it on Perks, and inconsistent with the system's palette. Recoded as a square with the same accent color as the "owned" button (solid red once checked), so there's no longer any trace of the old default style.
- **Hint text removed under the NOTES tab** ("Free-form character notes...").
- **Bold removed from the ProseMirror toolbar buttons** (B, headings, lists...) — they were inheriting a bold `font-weight` from Foundry's form theme, never neutralized until now.
- **Heading sizes (H1/H2/H3...) reduced in ProseMirror-typed text**. H1 in particular never had an explicit size in the theme and fell back to the browser's default size (roughly 2x the text size), oversized in a text area as compact as the system's sheets.

### Fixes — 34th iteration (real-game testing feedback, 08/21/2026)

- **Color of the round "owned" Perk button changed**: it had been red since the 32nd iteration (same color as Strain), it goes back to yellow/gold to be clearly distinct visually from Strain checkboxes (which remain red).
- **Perk chat card reworked**: the Perk's own icon (not very relevant, a Perk generally doesn't have one) is removed. In its place, the owning character's portrait appears as a watermark, exactly like on a Check result card.
- **New chat card for Cheat Death**: until now, using Cheat Death produced no chat message at all, just a silent change in the Dice Bag. A themed chat card (character portrait watermark) now announces the action: "[Name] cheats Death! Be careful... there is one less Safe Die in the bag now!"

### Fixes — 35th iteration (user feedback, 08/21/2026)

- **"Game Paused" overlay reskinned**: Foundry's native icon (which spins in place) is replaced with the system's skull, with a soft pulse and a red halo. The "Game Paused" text becomes "Death Awaits..." (translated "La Mort attend..." on the FR side). The reskin is applied by patching the DOM of Foundry's core overlay at the moment it displays — to be confirmed in play, as this UI could not be tested outside an actual Foundry session.

### Fixes — 36th iteration (user feedback, 08/21/2026)

- **Flash of the old logo/text fixed on the "Game Paused" overlay**: confirmed working by the user in the 35th iteration, but the old icon and the "GAME PAUSED" text were still appearing for a few frames before switching to the skull/"Death Awaits...". The icon is no longer changed via script (the source of the flash) but directly in CSS, which already displays it in its final form on the very first render, with no visible transition. The text, which depends on the active language, is still handled via script but without the small delay that caused the flash.

### Fixes — 37th iteration (user feedback, with screenshot, 08/21/2026)

- **36th-iteration fix reverted: the native "GAME PAUSED" icon had come back permanently**, not just for a flash. The pure-CSS technique attempted in the 36th iteration to replace the icon actually didn't apply at all in the game. Reverted to the 35th-iteration method (already confirmed working), which replaces the icon via script — the skull and "Death Awaits..." display normally again when pausing.

### Fixes — 38th iteration (user feedback, 08/21/2026)

- **"Game Paused" overlay: the reskin didn't survive a second pause/unpause cycle** — it worked on the initial pause, but a new cycle (unpause then pause) brought back Foundry's native icon and text. The detection mechanism has been made much broader and more reliable (it now watches for any relevant DOM change, rather than depending on one or two specific signals) to consistently catch every toggle, not just the first one.

### Fixes — 39th iteration (user feedback, Omen dice "invented" via an automatic Check, 08/21/2026)

- **Bug fixed — an Omen die could still "appear out of nowhere" during an automatic Wound (following a dice roll), even though this bug had already been fixed for manual adjustment in the 31st iteration.** Two distinct causes in `performCheck()` (`bourse-engine.mjs`): (1) the bag was decremented BEFORE checking the Wounds cap (deathThreshold) — a character already at the maximum still saw a die removed from the bag with no Wound ever being recorded, making an extra die appear in the Reserve; (2) an Omen die forced by the Host (Facing Evil) that caused a Wound never touched the Dice Bag, reproducing exactly the 31st-iteration bug, which had never received its fix in this case. Both are fixed by rewriting the Wound-application step: drawing from the Dice Bag (the bag, or the Reserve falling back to the bag if it's already empty) now happens ONLY if the Wound is actually applied. A Wound die coming from the bag during a normal draw never had this problem to begin with (verified algebraically: the bag and the Wounds always vary by +1/-1 in mirror).

### Fixes — 40th iteration (mechanics audit vs. the rulebook, 08/22/2026)

- **Facing Evil: an Edge could entirely cancel out the Omen die forced by the Host, contrary to the rulebook ("An Omen Die added in this way must be rolled as part of the Check," p.8).** `performCheck()` only counted the forced Omen die in the draw if a net Flaw remained after cancellation by an Edge (`Math.min(facingEvilOmen, netFlaws)`) — an Edge that cancelled exactly that Flaw made the forced Omen die disappear from the draw. Fixed: the forced Omen die is now always included in the draw (`Math.min(2, facingEvilOmen)`), an Edge that cancels it now only reduces the number of dice drawn on top of the bag accordingly, in line with the rulebook.
- **3 or more Wounds weren't forcing any mechanical Flaw on Checks, even though the rulebook explicitly provides for it ("they take a Flaw on all Checks," p.9), as a source of Flaw distinct from Aspect Strain.** The `wounds.hasPermanentFlaw` field already existed but was only used for display (red text, the Dice Bag's "critical" row). Fixed by passing it to the Check pop-up (`promptCheckOptions`), which now stacks Aspect Strain and 3+ Wounds as two independent sources of Flaw (up to a minimum of 2 Flaws if both are active at the same time, the rulebook's cap).

### Fixes — 41st iteration (Cheat Death, eligibility and coupling to the Wound, discussed then coded with the user, 08/22/2026)

- **Point 4 of the 40th-iteration audit, discussed before any code was written**: the rulebook (p.9) makes a character ineligible for Cheat Death "if their roll did not include any Safe Dice" — a condition on the SPECIFIC draw that caused the Wound. The code instead checked the global stock of Safe dice in the bag (`safeDiceInBag <= 0`), an unrelated condition. Resolved by adding a **Cheat Death button directly on the roll card** of the relevant Check (`check-result.hbs`), rather than a global flag on the character: `performCheck()` now computes `cheatDeathEligible` (did the draw that just caused THIS specific Wound contain at least one Safe die among all the dice drawn), frozen into `flags.omens13.checkResult` at the moment of the Check. The button only appears if that's the case. This avoids the ambiguity of a simple "last draw" flag, which wouldn't have been able to distinguish between several unresolved Wounds pending on the same character.
- **The "already used this Act/this story" or "no more Safe die in the bag" state is re-evaluated every time the card is displayed** (`activateCheckCardCheatDeath()`, `omens13.mjs`, hooked to the same `renderChatMessageHTML`/`renderChatMessage` hook as the rest of the 13 Omens chat cards), not frozen at the moment of the Check — the button grays out with a tooltip explaining why if either condition applies at the moment the player looks/clicks, exactly like the Dice Bag's `_prepareContext()` recomputes `canCheatDeath` on every render.
- **Cheat Death now actually removes the Wound it replaces, when triggered from the roll card.** Until now (a separate bug discovered while discussing point 4), `cheatDeath()` never touched `wounds.value` — the Wound auto-applied by the Check remained displayed even after a Cheat Death, requiring a second, entirely decoupled manual action ("-1 Wound") to truly "cancel" the Wound. Fixed by adding an optional `removeWound` parameter to `cheatDeath(actor, bourse, {removeWound})`: when `true`, the function calls `adjustWound(actor, bourse, -1)` right after spending the Safe die and setting the usage flags — reusing the bag-fallback logic already validated in the 31st/32nd/39th iterations rather than duplicating a raw `actor.update()` (which would have risked reintroducing a 3rd case of "invented dice"). The roll card's button calls `cheatDeath(actor, bourse, {removeWound: true})`; **the standalone Dice Bag button continues to call `cheatDeath(actor, bourse)` without this parameter, unchanged historical behavior** — an explicit decision by the user to keep it as a safety net at the Host's discretion (for example for a Wound added by hand, outside of a Check), without coupling it to the Wound.
- **Undoing ("Undo this Cheat Death") remains deliberately manual**: an explicit decision by the user not to automatically couple the reverse direction. `undoCheatDeath()` hasn't changed (returns the Safe die, resets both usage flags); if the Host also wants to restore a Wound cancelled by mistake, they additionally click "+1 Wound" by hand.

### Fixes — 1st iteration

- The Aspect Rating/Strain/Label fields (as well as Perks/Gear) are synchronized via an explicit event handler (`actor.update()` with the exact path) rather than ApplicationV2's generic form binding, and the displayed TN is recomputed on every render directly from the Ratings table.
