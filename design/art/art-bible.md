# 苔灯之森 · MOSSLIGHT — Art Bible

> Scope: minimal; sections 1–4. Review: solo. Separate Art Director sign-off skipped.
> Rendering: original Canvas 2D / CSS, detailed procedural world sprites and original vector character busts; no external image assets.
> Method reference: [Claude Code Game Studios — art-bible](https://github.com/Donchitos/Claude-Code-Game-Studios/blob/main/.claude/skills/art-bible/SKILL.md).

## 1. Visual Identity Statement

**Visual rule:** A returning traveler carries the warmth of his family into a moss-covered night; faces, hands and pools of lamplight reveal the love that words have left unfinished.

1. **A forest worth exploring.** Layer dark tree silhouettes, broken paths, pale flowers and glimpses of water around small readable clearings. Ruins suggest a history through repeated lantern and crescent motifs. **Design test:** each new clearing needs one identifiable destination; detail that hides it becomes quieter or moves to the edge.
2. **Readable action in a gentle world.** The hero's cream shawl, dark hair and amber brooch remain visible over green terrain. Threats are distinct through silhouettes, anticipation and movement, with luminous coral ground shapes used for attack warnings. **Design test:** the player must recognize an enemy and its attack direction in a monochrome thumbnail; color alone never conveys danger.
3. **Growth restores the world.** Progress brightens the weapon, adds a short teal spell arc and ultimately rekindles the beacon. Village warmth remains the visual reference for safety. **Design test:** an upgrade or quest completion changes one legible world or character detail rather than increasing ambient effects everywhere.

**Narrative foundation:** 林舟 returns to his father 林远 after three years; his mother 沈宁 survives in memory, and 苏晚 is a person with her own future rather than a reward for completing the journey. The ending is a dawn with an absence still in it. Show the dead mother's memory through a soft warm rim and subdued surroundings, never as a threatening apparition; show the living characters sharing the same light at the end.

## 2. Mood & Atmosphere

| State / place | Emotional target | Light and visual carrier | Energy |
|---|---|---|---|
| Title | Invitation into an unfinished fairytale | Forest vista framed by dark branches; one amber lamp beside a cream hood; large cream Chinese title and small spaced MOSSLIGHT lettering | Still, drifting leaves |
| Village | Belonging and readiness | Amber windows, rounded roofs, an NPC beside a lantern; soft olive grass and clear paths | Unhurried |
| Forest exploration | Curiosity with mild unease | Cool moss canopy, shafts of pale mint light, sparse glowstone clusters; gently moving grass at clearing edges | Measured |
| River | Relief and discovery | Broad dark-teal water crossed by thin mint ripples; a readable stone crossing or wooden bridge | Calm |
| Mother's garden / memory | Tenderness with a trace of loss | Desaturated amber edges, softly lit face, small physical keepsake; the world remains recognizable | Held, breathing stillness |
| Suwan / river lantern | Affection between independent people | Two readable figures at a shared height, terracotta scarf and teal pendant, lamp reflected in water | Intimate and forward-looking |
| Ruins / boss approach | Ancient weight and apprehension | Squared desaturated stones, broken crescent carvings; fewer warm lights and a broad circular arena | Gathering tension |
| Combat | Alertness without visual noise | Bright local silhouettes, short cream hit sparks, coral ground tells; screen-wide color stays stable | Brief, rhythmic bursts |
| Beacon restored / ending | Hope that accepts loss | Amber beacon opens into a pale dawn; father, son and Suwan remain solid while the mother's memory recedes gently | Release, gratitude and possibility |
| Defeat | Gentle invitation to retry | Dim scene, stationary lantern ember, readable cream panel | Quiet; no repeated flashes |

## 3. Shape Language

- **Hero 林舟:** young adult man with dark layered hair, olive travel coat, cream shawl and amber brooch. Preserve these features in both the world sprite and portrait. Target a world silhouette roughly 46–62 screen pixels tall at default play scale, with separated head, torso, hands and feet. Facing comes from the visible face and held blade; a raised hand, lowered head or kneel makes dialogue staging readable.
- **Father 林远:** graying temples, subtle beard, kind tired eyes, worn warm-brown work coat and visible repairs. Slightly settled shoulders convey age without making him helpless. A staff or lantern may support his world silhouette, but his portrait always shows his face.
- **Mother 沈宁:** soft brown pinned hair, cream blouse, muted terracotta wrap, small gold earring. Her expression is warm and wistful, not stern; memory lighting softens the edge rather than removing the face.
- **苏晚:** young adult woman with a long chestnut side braid, coral-red/terracotta shawl, ivory blouse and teal pendant. Upright posture and direct gaze communicate independence; the braid and scarf distinguish her at gameplay scale.
- **Narrator:** an old brass lantern with a clear warm flame and botanical border. This artwork provides a quiet transition between human speakers.
- **Slime:** low rounded dome, two high-contrast eyes, squat-and-stretch anticipation before a hop. A growing small ground ring precedes impact; landing produces a short outward ring.
- **Wolf:** narrow pointed snout, long low body and clearly separated tail. A brief crouch precedes a straight dash; a tapered coral ground wedge shows its direction.
- **Ancient tree boss:** broad asymmetric trunk, branching crown, two pale eye slits and root feet. This silhouette is at least three times the hero's height. Root strikes show branching ground cracks or bounded circles before damage; sweeping attacks show a wedge and limb wind-up.
- **Environment:** rounded, irregular canopy clusters over vertically readable trunks; repeated rectangular stone blocks for ruins. Paths use broad shapes with sparse edge flecks. Keep the central combat ground less textured than the perimeter.
- **UI:** cream text on dark green panels, thin muted mint rules, small square icon frames and generous empty space. Dialogue sits near the bottom without covering the player; quest text is concise. Large title typography is reserved for title/ending screens.
- **World sprite pipeline:** build detailed, layered Canvas shapes or a compact pixel atlas with enough source resolution to retain faces, clothing, hands and weapons at the target size. Separate body parts for idle breathing, walking, attack wind-up, active swing, recovery, hurt recoil, dash and dialogue poses. Maintain clean material color blocks and local highlights; glow, water ripples and shadows remain separate from character forms. If using a pixel atlas, disable image smoothing and prefer integer scaling. Do not apply pixelated image rendering to vector portraits.
- **Action readability:** movement alternates legs and arms; melee rotates a visible blade across a bounded arc and includes a distinct preparatory pose; spells begin at a visible hand; dash elongates a directional trail; hurt recoil is brief. Show the active hit region in the effects, not just a floating number. Characters should never look like immobile discs underneath a swarm of effects.
- **Portrait pipeline:** `src/portraits.js` exposes `MosslightPortrait.draw(canvas, kind)` for `hero`, `father`, `mother`, `suwan`, and `narrator`. Each original 240×300 logical portrait is drawn synchronously from layered vector paths: shaped hair locks, eyelids/irises/highlights, brows, nose, mouth, neck, garment folds and personal objects, over a restrained botanical vignette. The function applies device pixel ratio up to 2; CSS controls displayed size. Use portraits at a readable 120–240 CSS pixel width and retain the speaker name as real text outside the canvas.
- **Attention hierarchy:** player and imminent attacks first, interactive NPCs and rewards second, scenery last. Canopy may frame the scene but must fade or open when it overlaps the player. Corpses, particles and grass never share the intensity of quest items.

## 4. Color System

| Color | Hex | Role and rule |
|---|---|---|
| Deep pine | `#102C29` | Darkest playable shadows and panel fill; provides a stable background for readable silhouettes. Avoid pure black except tiny sprite outlines. |
| Forest moss | `#355C43` | Main foliage and terrain midtone; low enough contrast to sit behind characters. |
| Sunlit sage | `#78956A` | Canopy edges, grass accents and weathered roof highlights; keep sparse near combat. |
| River teal | `#286D70` | Water and cool ruin recesses; water boundaries also use an irregular bank outline. |
| Pale mint | `#B5DCC1` | Friendly magic, moonblade edge, quiet interface accents and glowstone highlights. |
| Warm parchment | `#F3E8CB` | Hero hood, primary text and peak impact highlights; remains the principal readable foreground. |
| Lantern amber | `#F2B766` | Safety, treasure and restored light; accompanies lamp, chest or diamond geometry. |
| Danger coral | `#E98273` | Hostile attack tell and damage state; use brief, localized applications rather than red-tinting the full scene. |
| Worn terracotta | `#B67560` | Suwan's shawl and the mother's remembered wrap; matte, outlined cloth rather than luminous danger geometry. |

**Semantic rules:** amber is human warmth and reward, mint is old restorative magic, and luminous coral ground tells signal imminent hostile force. Matte terracotta clothing belongs to the story and is differentiated through stable character silhouettes and a lack of danger pulses. A mint glowstone still uses a faceted diamond silhouette and quest marker so it cannot be mistaken for a spell or water glint. The moonblade retains a crisp cream core even when its mint aura overlaps foliage.

**Area temperature:** the village has the largest warm-light coverage; forest stays moss-dominant; river introduces teal; ruins reduce saturation. Boss attacks temporarily add coral without changing this underlying palette. Victory reintroduces village-like amber into the ruins, followed by cream and dusty sage dawn light. The mother is not resurrected by this lighting change: the final image holds memory and a living future together.

**Accessibility:** green/coral separation is never sufficient. Slimes and wolves have distinct bodies; danger uses pulsing bounded ground shapes plus wind-up; rewards sparkle upward and remain compact; interactables carry symbols and Chinese text. Damage also produces recoil and a short outlined health change. Preserve high text contrast; do not place body text directly on animated foliage. Respect reduced-motion preferences by removing camera shake and reducing particle density while retaining attack anticipation.

Sections 5–9 are outside the minimal scope and have not been authored.
