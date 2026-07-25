# viberadio — spec

Status: DRAFT (Opus-authored) · 2026-07-25 · depends on `@vibe/core`
Identity: viberadio.dev (available $12/yr) · ships CLI + npm + MCP

## What it is
An agentic coding session you can **listen to** instead of read. Narration is the
core; reactive music is one style. For anyone who'd rather hear the agent's progress
— stepping away, commuting, multitasking.

## Output = Style × Mode × Timing (all user-configurable)
- **Style** (the voice/character): spoken **monologue** · two-host **podcast** ·
  **music** (lo-fi / synthwave / ambient / classical / 8-bit, the existing reactive
  engine). Music reacts to events (commit → beat drop, error → tension, deploy →
  crescendo, idle → drone).
- **Mode** (the unit): **ambient stream** (narrates activity live) · **task
  summary** (one message when a task finishes) · **session recap** (a longer
  podcast/musical wrap, incl. "Vibe Radio Wrapped" stats).
- **Timing** (`@vibe/core` §4c): **sync/live** (narrate as it happens) or **async**
  (after a turn/session). Per-hook default, overridable.

## Model cascade (audio capability, `@vibe/core` §2)
1. agent's existing provider if it does TTS/audio → 2. a TTS key you bring
(ElevenLabs/OpenAI/PlayHT…) → 3. **on-device voice** (Web Speech / system TTS), works
offline, no key. Music style uses local synth (Tone.js/Web Audio) — inherently tier-3.

**Multi-model mix (§4d):** different slots, different models. Podcast host A on
ElevenLabs voice X, host B on voice Y; monologue on your OpenAI; fall to on-device
when offline. Per-style voice/model is a user setting.

## Triggers (`@vibe/core` §3)
Milestones: task done, PR opened, tests pass/fail, error, session end + manual
(`viberadio say`, MCP tool, keybind). Each trigger = `(timing, off|ask|auto)`.
Global + per-trigger switches.

## Surfaces
- **CLI:** `viberadio start` (background, streams live) · `viberadio recap
  [--session id]` · `viberadio say "<text>"` · `viberadio config`.
- **npm:** `renderAudio({events, style, mode})` → audio buffer/stream + transcript.
- **MCP:** `viberadio.narrate`, `viberadio.recap`, `viberadio.set_style` — so the
  agent itself can trigger "want an audio recap?" mid-session.
- Optional macOS menubar (now-playing) — post-v0.

## Cross-harness (`@vibe/core` §4b)
Events come from the normalized `VibeEvent` stream, so it narrates Claude Code /
Codex / Cursor / Gemini / Grok / pi / Kimi / Hermes / OpenClaw identically. No
per-harness code in viberadio.

## Hard parts / open questions
- Live narration latency vs the agent outpacing the voice — buffer + summarize, skip
  stale lines rather than queue (don't narrate a diff that's already 30s old).
- On-device voice quality is the weak tier — set expectations, make premium voices a
  one-line upgrade, never hard-fail.
- Music + narration mixed at once? (ducking narration over a music bed) — v2.
- "Wrapped"/recording exports (MP3/WAV) — local render, no upload.
