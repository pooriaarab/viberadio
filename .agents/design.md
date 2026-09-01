---
schema: design-context/v1
surface: developer-ui
sources:
  - src/cli.ts
  - src/index.ts
  - docs/prototype.html
  - docs/launch-video.html
  - branding/logo.png
---

# VibeRadio design context

## Overview

The shipped surface is a text-based CLI with audio output. `src/cli.ts` defines
its help, status, fallback, and error messages.

`docs/prototype.html` defines an interactive product direction. It is not part
of the npm build. The launch-video files define promotional frames.

Keep these states explicit. Do not describe prototype controls as shipped UI.

## Colors

The CLI does not own a color palette. Its status chip comes from
`@pooriaarab/vibe-core`.

The prototype uses these tokens from `docs/prototype.html`:

- Canvas: `#0a0b0d`; panel: `#121319`; raised panel: `#16181f`.
- Primary text: `#ece9e4`; dim text: `#a8a39b`; faint text: `#7c776f`.
- Primary accent and focus: amber `#ffb454`.
- Offline status: teal `#5fe3c4`; success: green `#59d98c`.
- Alternate-mode accents: cyan `#57d3ff` and magenta `#ff5fa8`.
- Danger: red `#ff6a5f`.

The prototype has no light theme. Never use accent color as the only status
signal. Keep labels or icons beside status colors.

The logo is a separate orange-and-black asset. Sample its source file when an
exact production value is required.

## Typography

The prototype uses the system sans stack for controls and prose:
`-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `Helvetica Neue`,
`Arial`, then `sans-serif`.

It uses `ui-monospace`, `SFMono-Regular`, `Menlo`, `Consolas`, then `monospace`
for terminal and event content.

Body text is `15px` with `1.5` line height. The wordmark is `18px` at weight
`650`. Track titles are `22px` at weight `650`.

CLI headings use uppercase labels such as `USAGE` and `RECAP OPTIONS`. Options
use two-space indentation.

## Layout

CLI help uses this order: identity, usage, recap options, then the offline note.
Errors go to standard error. Machine-readable MCP traffic stays on standard
input and output.

The prototype centers an `1180px` maximum-width app. It uses `28px` horizontal
padding and a `20px` grid gap.

The main grid uses a `1.7fr 1fr` split. It becomes one column below `880px`.
Panels use `24px` internal padding.

## Elevation & Depth

CLI depth is not applicable because its owned output is text and audio.

The prototype separates surfaces by fill instead of heavy borders. A seven
percent white hairline divides lists.

Launch-video frames may use deep shadows and amber glows. Do not copy those
effects into routine controls.

## Shapes

The prototype uses a `14px` panel radius. Small controls use radii from `5px`
to `10px`.

Status chips and scrubber tracks use a `999px` pill. The play button and status
dots are circular.

Use the radio-wave logo from `branding/logo.png`. Do not replace it with a
generic speaker or waveform icon.

## Components

- Help output uses stable uppercase sections and aligned option descriptions.
- Status output pairs a speaker icon with the resolved provider tier.
- Missing-speech output prints the unsaid text before the setup warning.
- Prototype panels group player, trigger, and transcript tasks.
- Segmented controls keep selected text and a tinted background together.
- Trigger controls label every `on`, `ask`, and `off` state.
- The prototype play button scales on hover and press.
- The pulsing status dot stops under `prefers-reduced-motion: reduce`.
- Every icon-only control needs an accessible name.

## Do's and Don'ts

- Do keep audio status readable without color or sound.
- Don't add ANSI styling directly to ordinary CLI strings.
- Do keep CLI errors actionable and name the missing input or tool.
- Don't claim that prototype controls exist in the published package.
- Do preserve the prototype's amber focus outline.
- Don't remove focus styles or reduced-motion behavior.
- Do keep local and offline claims beside their current limits.
- Don't use promotional animation rules as application defaults.
