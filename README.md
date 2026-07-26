# VibeRadio

**Your agent's output as audio.**

Turns an agentic coding session into something you can _listen to_ instead of read. Narration is the core — spoken monologue, two-host podcast, or reactive music — so you can follow a Claude Code / Codex / Gemini agent's progress while away from the desk, commuting, or multitasking. Reactive music (below) is one style among several.

**Styles:** spoken monologue · two-host podcast · reactive music (lo-fi, synthwave, ambient, classical, 8-bit).
**Modes:** ambient stream (narrates live as the agent works) · task summary (one message when a task finishes) · session recap (a longer podcast/musical wrap).
**Timing:** sync/live (updates as the agent works) or async (after a turn/session) — user-configurable, per-hook. See [`spec.md`](spec.md).

## Quick start

```sh
npm i -g @pooriaarab/viberadio
```

```sh
viberadio say "hello"                       # narrate a line now (on-device, offline)
viberadio recap session.json                 # build a script from session events and speak it
viberadio recap session.json --style podcast  # two-host podcast style
```

**Works offline, on-device, with zero keys.** v0 routes all narration through the
on-device tier of the shared `@pooriaarab/vibe-core` model cascade — macOS `say` /
Linux `espeak` / `spd-say` — so it runs with nothing configured and nothing leaves
your machine. Bring-your-own-key TTS (ElevenLabs, OpenAI, …) plugs into the same
cascade later; the `createNarrator()` seam is already there.

Use it as a **library** too:

```ts
import { narrate, recap, buildRecapScript } from '@pooriaarab/viberadio';

await narrate('build passed');                              // speaks via on-device TTS
const { script } = await recap(events, { style: 'podcast' }); // script + speak a session
buildRecapScript(events);                                   // pure: events -> script, no audio
```

### MCP

`viberadio mcp` starts a stdio MCP server exposing `narrate({ text, style? })` and
`recap({ events, style?, mode? })` tools, so an agent can ask for an audio recap
mid-session. Add it to your client's MCP config:

```json
{
  "mcpServers": {
    "viberadio": { "command": "viberadio", "args": ["mcp"] }
  }
}
```

## Why Build This

- Developers already listen to lo-fi while coding — this makes it reactive and personal
- Extremely visual and shareable — imagine a tweet: "My code literally makes music"
- No one has done reactive music for coding before — genuinely novel
- Combines two massive communities: developers and lo-fi/music lovers
- The demo video alone could go viral — watching music change as code is written

## Features

- **Reactive soundtrack** — Music dynamically shifts based on coding events
  - Commit → beat drop
  - Test pass → melodic resolution
  - Test fail → minor key shift
  - Error/exception → dramatic tension
  - Idle → ambient drone
  - Deploy → triumphant crescendo
- **Genre modes** — Lo-fi, synthwave, ambient, classical, 8-bit
- **Visualizer** — Terminal-based audio visualizer that shows the music reacting
- **Session recording** — Save your coding soundtrack as an MP3/WAV
- **Spotify-style wrap** — Weekly "Your Vibe Radio Wrapped" with stats and generated playlist
- **Collaborative mode** — Team coding sessions merge into one shared soundtrack
- **Stream mode** — OBS integration for streaming your reactive coding music

## Distribution

- **CLI** — `viberadio start` — runs in background, hooks into git/terminal events
- **npm package** — `npm install -g @pooriaarab/viberadio`
- **Claude Code hook** — Auto-starts when Claude Code session begins
- **Claude Code skill** — `/viberadio` to control playback
- **skills.sh** — Listed on skills.sh marketplace
- **macOS menubar app** — Visual controls + now-playing display

## Voices & models (bring your own, mix freely)

Text-to-speech follows the shared `@vibe/core` cascade and is **mix-and-match**: use
your agent's existing provider if it does audio → or a TTS key you supply
(ElevenLabs, OpenAI, etc.) → or a **local/on-device voice** so it works with no key
and no network. Different styles can use different models — e.g. an ElevenLabs voice
for the monologue, two distinct voices for the podcast hosts, on-device TTS when
offline. Per-style voice/model selection is a user setting.

## Tech Stack

- Node.js + TypeScript
- TTS: `@vibe/core` cascade (agent provider → BYO key → on-device); Web Speech /
  system TTS as the local tier
- Tone.js / Web Audio API (reactive-music style)
- Claude Code hooks + git/watcher (event detection, via `@vibe/core`)
- Electron or Tauri (optional desktop app)

## Prototype

Interactive, self-contained UX prototype (no build, no network): open
[`docs/prototype.html`](docs/prototype.html) in a browser. The "Speak this line"
button uses your browser's on-device speech synthesis — real, offline narration.

## Local-first

Runs on your own machine. Nothing leaves it unless you opt a flow into a hosted
provider; the on-device tier works fully offline. Enforced by the `@vibe/core`
consent model.

## Vibe Suite

Part of the **Vibe Suite** — companion tools for agentic coding CLIs (Claude Code,
Codex, Cursor, Gemini, Grok, pi, Kimi, and other harnesses). Ships as **CLI + npm
package + MCP server**.

## Revenue Potential

- Free tier: basic narration + lo-fi mode, on-device voices
- Pro: all styles, premium voices, recording, visualizer, Wrapped
- Creator tier: OBS integration, custom sound/voice packs
