[WORKER] Implement `src/` for @pooriaarab/viberadio — a working v0. Read README.md and docs/spec.md first for product intent. The package scaffold (package.json, tsconfig, workflow, LICENSE) is DONE — do NOT modify those. Implement ONLY under src/, plus polish README.md.

## Dependency you build on: @pooriaarab/vibe-core (already published, already a dependency)
Run `npm install` first. Key exports you will use (import from '@pooriaarab/vibe-core'):
- `createConsentLedger()` → ConsentLedger
- `createCascade({ pickLocal, consent, hostProvider?, byoProviders? })` → Cascade; `cascade.resolve({ capability, allowEgress, prefer?, slot? })` → `{ provider, tier, egress, label }`
- `pickLocalRunner(capability)` → Promise<LocalRunner|null>  (from the local module; use it as `pickLocal`)
- `createSystemTtsRunner()` → a LocalRunner for 'audio' (macOS `say`/Linux `espeak`)
- types: Capability, VibeEvent, ProviderAdapter, LocalRunner
Inspect the installed package's dist/index.d.ts to confirm exact names before using.

## v0 scope (minimal but genuinely working — ship real, not stubs)
Audio via the **on-device tier** (tier 3, `allowEgress: false`) so it works offline with zero keys — that's the guaranteed path for v0. (Leave a clear seam to add BYO-key TTS later, don't build it.)

### src/index.ts — library API
- `narrate(text: string, opts?: { style?: 'monologue'|'podcast' }): Promise<{ tier: string }>` — resolves an audio provider via the cascade (capability 'audio', allowEgress:false → local system TTS) and speaks the text. Returns the tier used.
- `buildRecapScript(events: VibeEvent[] | RawEvent[], opts?: { style?, mode?: 'summary'|'podcast' }): string` — PURE function turning session events into a narration script (e.g. "Opened auth.ts, fixed the token check, tests passed, PR #42 opened"). Keep this pure + exported so it's unit-testable without audio.
- `recap(events, opts?): Promise<{ tier, script }>` — buildRecapScript then narrate.

### src/cli.ts — CLI (shebang `#!/usr/bin/env node` at top)
Commands (tiny hand-rolled arg parse, NO new deps):
- `viberadio say "<text>"` — narrate it now.
- `viberadio recap [file.json]` — read events from file or stdin, buildRecapScript, narrate. `--style monologue|podcast`, `--mode summary|podcast`.
- `viberadio --version` / `--help`.
Print the resolved cascade tier chip (e.g. "🔊 on-device · offline") using @vibe/core's ui `tierChip`/`badge` if exported, else a plain line. Handle no-TTS-binary gracefully (print the script, note TTS unavailable, exit 0).

### src/mcp.ts — MCP server (uses `@modelcontextprotocol/sdk`)
A stdio MCP server exposing tools `narrate` ({text, style?}) and `recap` ({events, style?, mode?}) that call the library. Runnable via `viberadio mcp` (wire a `mcp` subcommand in cli.ts that imports and starts it). Follow the current @modelcontextprotocol/sdk server API (McpServer + StdioServerTransport) — check the installed version's types.

### tests — src/*.test.ts (vitest)
- buildRecapScript: events → expected script (the core value, pure, easy).
- narrate: cascade wiring with a mocked pickLocal (assert it resolves local tier, calls generate with {text}).
- CLI arg parsing (pure parser function extracted from cli.ts).

### README.md — polish for npm
Keep the existing rich content. Add near the top: install (`npm i -g @pooriaarab/viberadio`), a 3-line quick start (`viberadio say "hello"`, `viberadio recap session.json`, MCP setup), and a note it works offline on-device. Don't delete the existing feature/why sections.

## Definition of done (MUST all pass — run them)
`npm install` → `npm run build` (produces dist/cli.js, dist/index.js, dist/mcp.js) → `npm run typecheck` → `npm run test` all green. Match the strict tsconfig (noUncheckedIndexedAccess, verbatimModuleSyntax — use `import type` for types, `.js` extensions on relative imports). Then `git add -A && git commit -m "feat: viberadio v0 — CLI + lib + MCP"` on branch build-v0. Do NOT push. Report what you built, test count, and any judgment calls.
