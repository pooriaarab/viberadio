# VibeRadio

[![npm version](https://img.shields.io/npm/v/viberadio-fm)](https://www.npmjs.com/package/viberadio-fm)
[![Downloads/month](https://img.shields.io/npm/dm/viberadio-fm)](https://www.npmjs.com/package/viberadio-fm)
[![MIT license](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

[Website](https://getvibe.dev/viberadio) · [Setup](#install) · [Library and MCP](#library-and-mcp)

VibeRadio is an open-source text-to-speech CLI and library that turns supplied text or coding-session events into local spoken narration for developers.

## Install

```sh
npm install -g viberadio-fm
viberadio say "Build passed"
```

Requires Node.js 18 or newer and a system speech tool: macOS `say`, Linux `espeak`, or Linux `spd-say`.
Success: you hear “Build passed” and see a local-provider status message.
If speech is unavailable, the CLI prints the text and a setup warning, then exits successfully.
No API key or environment variables are required. The CLI does not load `.env` files.

## Recap a session

```sh
printf '[{"kind":"tests-pass","count":12}]' | viberadio recap
printf '[{"kind":"tests-pass","count":12}]' | viberadio recap --style podcast
```

The second command changes the script to host-labelled dialogue. Both styles use one system voice.
You can also pass a JSON-array file: `viberadio recap session.json --mode podcast`.

## Features and limits

- **Local speech:** the default audio path disables network egress and uses the system speech runner from `@pooriaarab/vibe-core`.
- **Recap scripts:** formats milestone events; accepts `monologue` or `podcast` styles and `summary` or `podcast` modes.
- **Library bridge:** successful library `recap()` appends a best-effort event for vibenotifications; CLI and MCP recaps call narration directly.
- **Two MCP tools:** `narrate` speaks text; `recap` builds and speaks an event recap.

```text
text / event array -> narration script -> system speech tool -> audio
```

There is no automatic agent-session watcher or background `start` command.
Reactive music, cloud voices, distinct podcast voices, recording, visualizers, and a menubar application do not ship.
This package does not include Claude Code, Codex, or Gemini adapters; pass text or events from your workflow.
Source inspection confirms three system-tool choices through the shared runner. No physical audio output was verified for this rewrite.

## Library and MCP

```js
import { buildRecapScript, narrate, recap } from 'viberadio-fm';

console.log(buildRecapScript([{ kind: 'tests-pass', count: 12 }]));
await narrate('Build passed');
await recap([{ kind: 'task-done', message: 'Fixed login' }]);
```

`buildRecapScript()` is pure and works without speech tools. `narrate()` throws `TtsUnavailableError` when audio cannot run.
`createNarrator()` exposes dependency injection; TypeScript declarations ship with the package.
Configure an MCP client with:

```json
{"mcpServers":{"viberadio":{"command":"viberadio","args":["mcp"]}}}
```

CLI commands: `say`, `recap`, `mcp`, `help`/`--help`/`-h`, and `--version`/`-v`.
The `say` command accepts `--style`/`-s`; `recap` also accepts `--mode`/`-m` and file or stdin input.
Set `VIBERADIO_DEBUG=1` for speech-failure details.

## Status and links

Version 0.2.4 is pre-1.0. Interfaces can change; this package provides no managed audio service.
The repository's interactive prototype and launch video show product direction, not shipped functionality.
[Report an issue](https://github.com/pooriaarab/viberadio/issues) · [Vibe Suite](https://getvibe.dev) · [MIT license](https://opensource.org/license/mit)
