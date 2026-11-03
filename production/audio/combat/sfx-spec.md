# 苔灯之森 · MOSSLIGHT — 声音事件规范

> Scope: design targets for the shared procedural music and combat feedback in `src/audio.js`, originally defined for 《归途来信》. This is not a measured mixing report and does not cover narrative TTS; see the [short-story voice report](../story/voice-report.md) and [long-campaign voice report](../journey/voice-report.md) for dialogue audio.
> Method: [Claude Code Game Studios — team-audio](https://github.com/Donchitos/Claude-Code-Game-Studios/blob/main/.claude/skills/team-audio/SKILL.md).
> Sonic direction: gentle pentatonic bell/pluck forest melody, warm low drones, filtered wind, dry wooden melee strikes and crystalline magic. These procedural sounds use no external samples or services.

## 1. 声音语言与合成约束

- Friendly interactions use rounded plucks and bell-like sine tones; magic and rewards sparkle briefly; melee uses dry wooden noise clicks; hostile impacts use low-passed deterministic noise and falling low tones. No piercing sustained alarms.
- The sound effects described here are generated locally using Web Audio oscillators, envelopes and one seeded noise buffer. This specification does not compose the music or describe the separately generated dialogue recordings.
- Nominal gain below is each voice's peak envelope before master gain. Use a 4–10 ms attack and exponential release to a nonzero floor before stopping, avoiding clicks. Cap oscillator fundamentals at 2.4 kHz and low-pass noise around 2.2 kHz.
- Small pitch variation uses seeded choices, not uncontrolled random volume. Spatial stereo is optional, at most ±0.45 pan; critical feedback stays near center. Quiet forest wind is nonessential ambience and never conveys a threat by itself.

## 2. 事件清单

Priority: P0 = survival/state change; P1 = action/progression; P2 = frequent texture. Cooldowns apply per event type; multi-target hits share one attack sound.

| Event | Trigger / sonic shape | Duration | Nominal peak gain | Variation | Rate / concurrency | Priority | Required visual fallback |
|---|---|---:|---:|---|---|---|---|
| `slash` | Successful melee swing begins; dry wooden click and short filtered-noise swish | 100–150 ms | 0.045 | Pitch ±5%, 3 variants | ≥180 ms; ≤2 voices | P1 | Visible swing arc and attack animation |
| `magic` | A spell is successfully cast; crystalline sine pair 660/990 Hz with falling tail | 160–240 ms | 0.055 total | Pitch ±3%, 2 variants | Once per successful cast; ≤2 | P1 | Spell projectile and resource/cooldown change |
| `hit` | An attack damages slime/wolf/tree enemy; muted noise tick with 260 Hz body | 45–70 ms | 0.030 | Pitch ±7%, 3 variants | ≥70 ms; ≤2 | P2 | Enemy outline flashes briefly; no full-screen flash |
| `kill` | Enemy defeated; low-pass organic puff and sine 160 → 65 Hz | 130–190 ms | 0.055 | Pitch ±8%, 3 variants | ≥100 ms; ≤2 | P2 | Enemy dissolves, experience or loot appears |
| `pickup` | Loot, currency or experience collected; rounded bell sparkle, 660/784/988 Hz cycle | 90–140 ms | 0.030 | Rotate among 3 pentatonic-compatible notes | ≥65 ms; ≤2; batch simultaneous rewards | P2 | Item/coin indicator and experience bar update |
| `dash` | A successful dodge starts, never an unavailable request; airy noise swoosh with a low soft pluck | 180–240 ms | 0.060 | Pitch ±3%, 2 variants | Once per successful dodge; ≤1 | P1 | Directional dodge trail and cooldown indicator |
| `hurt` | Player actually loses health; centered muffled thud 130 → 55 Hz, no shrill alarm | 210–280 ms | 0.100 | Pitch ±3%, 2 variants | ≥300 ms and respect damage invulnerability; ≤1 | P0 | Health decreases, character blinks and bounded damage vignette |
| `levelup` | Player level increases or an upgrade selection opens; three rising bell-like sine notes, total gain shared across notes | 500–650 ms | 0.075 total | Fixed motif | Once per level/selection; ≤1 | P1 | Level label and gained attributes or choices |
| `select` | Menu, dialogue choice or upgrade is committed; short warm paired plucks | 100–180 ms | 0.035 total | Fixed | ≥100 ms; ≤1 | P1 | Selected control confirms, dialogue/ability state updates |
| `boss` | Tree guardian encounter begins; low 65/98 Hz swell, hollow woody texture and soft wind breath | 800–1100 ms | 0.095 total | Fixed | Once per encounter entry; ≤1 | P0 | Boss name/banner, health bar and telegraphed attacks |
| `win` | Final quest victory is committed; warm ascending bell resolution, tail decays naturally | 1000–1400 ms | 0.085 total | Fixed | Once per victory transition; ≤1 | P0 | Quest complete and victory screen |
| `lose` | Health reaches zero and defeat is committed; gentle descending two-note cadence | 650–950 ms | 0.075 total | Fixed | Once per defeat transition; ≤1 | P0 | Defeat screen with restart/retry button |
| `interact` | NPC dialogue, chest opening or quest acceptance/completion actually begins; hollow wooden click plus a warm bell | 140–220 ms | 0.045 total | 2 context variants: NPC soft, chest brighter | ≥200 ms; ≤1 | P1 | Dialogue text, chest open state, or quest tracker change |
| `potion` | Potion successfully consumes inventory and restores health; soft rising liquid-like sine wobble | 260–360 ms | 0.055 total | Pitch ±3%, 2 variants | Once per accepted use; ≤1 | P1 | Health rises, potion count decreases, healing particles |

There are 14 event identifiers. Enemy death should prioritize `kill` over a same-frame `hit`; victory cancels redundant kill layers. Pickup batches must never become a continuously rising, high-pitched stream. Empty potion inventory, insufficient spell resources and unavailable cooldowns must not play a success cue. NPC text remains fully readable when narrative voice playback is muted or unavailable.

## 3. 混音与资源预算

- Separate music and SFX gain buses feeding a conservative master and compressor. Start with master gain 0.55; keep music about 10–14 dB below prominent action feedback. Default audible but quiet; user mute is always visible.
- Maintain a global maximum of 16 active SFX voices. When full, suppress or release the oldest P2 voice before allocating P0/P1; never create an unbounded oscillator for every particle or shard.
- `hurt`, `boss`, `win` and `lose` duck music by approximately 5 dB with 25 ms attack and 250–500 ms release. A new duck extends the existing envelope rather than multiplying repeated attenuation.
- Design ceiling: absolute summed sample peak ≤0.70 (approximately −3.1 dBFS), including overlapping music and SFX; do not equate a compressor with a guaranteed true-peak limiter. Verify the actual implementation with an offline render or output meter. Do not claim a measured LUFS value without measuring it.
- Seeded noise buffer: one mono second or less at the AudioContext sample rate, reused for all effects and gently looped filtered wind. Oscillators stop after their release and disconnect when ended. No network downloads, audio asset loading screens or persistent timers per voice.

## 4. 生命周期与无障碍

- Create/resume AudioContext only after a user gesture. A failed or unavailable audio context must leave the game playable silently.
- Explicit pause, document hidden and losing window focus stop gameplay and music scheduling. Fade active game sounds over 30–50 ms, then suspend; resuming schedules from the next beat rather than replaying accumulated events.
- Dialogue and upgrade choices pause combat. Gentle background music may continue while menus/dialogue are visible; one-shot `interact`/`levelup` cues finish naturally. Do not suspend the entire audio context so early that interaction cues are cut off. Explicit pause and hidden tabs still silence everything.
- Mute ramps master to zero over 20–30 ms and applies to every bus, including result/menu cues. Persist the setting when local storage is available; storage failure must not block play. Unmute restores the current mix without replaying old sounds.
- Every critical state has a visible alternative in the table. No warning, collision, invulnerability window, victory or defeat is conveyed by sound alone. Avoid flashing faster than three times per second and avoid abrupt full-volume transients.

## 5. 验证要点

1. Repeated melee/magic and simultaneous pickups remain quiet and bounded; damage feedback is still easy to hear.
2. Damage and result sounds trigger once for real state transitions, not once per animation frame.
3. Pause/tab hiding and mute silence music and SFX; resume does not create duplicate music schedulers.
4. Dialogue/chest, potion, upgrade, boss, win and lose cues remain audible through their intended tails and have visible text/state equivalents.
5. Test with audio disabled, unsupported or blocked: the complete run remains playable.

This artifact specifies design targets only. Browser playback observations are recorded in the [short-story verification](../../qa/verification.md) and [long-campaign verification](../../qa/journey-verification.md). The output-level ceiling and subjective mixing targets above have not been measured or confirmed by this document.
