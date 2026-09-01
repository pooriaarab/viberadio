# VibeRadio brand

## Identity

VibeRadio is a local-first audio companion for agentic coding sessions.

The shipped package turns text or session events into spoken narration. It
works through on-device system speech tools.

VibeRadio belongs to the Vibe Suite. It ships as a CLI, npm library, and MCP
server.

## Audience

The primary audience is developers who want to hear an agent's progress while
they step away or work on another task.

The secondary audience is tool authors who add spoken narration or recaps to
agent workflows.

## Promise

Use this primary message: **Your agent's output as audio.**

Support it with these verified points:

- The `say` command speaks supplied text.
- The `recap` command turns session events into a narration script.
- The MCP server exposes `narrate` and `recap` tools.
- The current provider uses macOS `say`, Linux `espeak`, or `spd-say`.
- The current path works offline and needs no API key.

## Voice

Write calm, concise, factual copy that remains clear when heard aloud.

Lead with the result. Use plain verbs and short sentences. Explain provider
limits without alarm.

Use playful radio language only when it clarifies audio behavior. Do not let a
metaphor hide the product state.

## Naming

- Use **VibeRadio** for the product name.
- Use `viberadio` for the executable and MCP runtime display name.
- Use `viberadio-fm` for the npm package.
- Use `io.github.pooriaarab/viberadio-fm` for the MCP manifest name.
- Use **Vibe Suite** for the related product family.
- Use `@pooriaarab/vibe-core` for the shipped dependency.

## Claims

Treat source code as the authority for shipped behavior.

`docs/prototype.html`, launch-video HTML, and `docs/spec.md` show product
direction. They do not prove that a feature ships.

Reactive music, cloud voices, a menubar app, recording, and Wrapped reports do
not ship in the current package.

The `podcast` option changes the recap script. The current version still speaks
that script through one on-device voice.

When no speech tool exists, the CLI prints the script and a setup warning.

## Assets

`branding/logo.png` is the product logo. It is a 400-pixel square with rounded
orange corners and a black radio-wave mark.

`branding/launch-video.mp4` is the current launch video. Its HTML source files
live in `docs/`.

Keep the radio-wave mark intact. Do not redraw it from memory.

## Avoid

- Do not claim that reactive music ships.
- Do not claim two distinct voices ship.
- Do not imply that an account, cloud service, or API key is required.
- Do not turn planned revenue ideas into product promises.
- Do not use broad novelty or virality claims as facts.
