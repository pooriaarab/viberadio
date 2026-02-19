# VibeRadio

**Music that reacts to your code.**

Generates ambient lo-fi music that dynamically responds to your coding activity. More commits = upbeat. Errors = dramatic. Idle = chill. Your coding session becomes a soundtrack.

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
- **npm package** — `npm install -g viberadio`
- **Claude Code hook** — Auto-starts when Claude Code session begins
- **Claude Code skill** — `/viberadio` to control playback
- **skills.sh** — Listed on skills.sh marketplace
- **macOS menubar app** — Visual controls + now-playing display

## Tech Stack

- Node.js + TypeScript
- Tone.js / Web Audio API (music generation)
- chokidar (file system watching)
- Claude Code hooks (event detection)
- Electron or Tauri (optional desktop app)

## Revenue Potential

- Free tier: basic lo-fi mode
- Pro: all genres, recording, visualizer, Wrapped
- Creator tier: OBS integration, custom sound packs
