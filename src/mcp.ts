/**
 * VibeRadio MCP server (stdio).
 *
 * Exposes two tools so an agent can ask for audio mid-session:
 *   - `narrate({ text, style? })`  — speak arbitrary text now
 *   - `recap({ events, style?, mode? })` — build a script from session events and speak it
 *
 * Both resolve through the on-device TTS cascade, so the server works offline
 * with zero keys. Runnable via `viberadio mcp`.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { buildRecapScript, narrate, type NarrateStyle, type RawEvent, type RecapMode, type SessionEvent } from './index.js';

export const SERVER_NAME = 'viberadio';
export const SERVER_VERSION = '0.1.0';

const styleSchema = z.enum(['monologue', 'podcast']).optional();
const modeSchema = z.enum(['summary', 'podcast']).optional();

/** Build a configured McpServer (not yet connected to a transport). Exported for tests. */
export function createServer(): McpServer {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION });

  server.registerTool(
    'narrate',
    {
      title: 'Narrate text',
      description:
        'Narrate arbitrary text as audio via VibeRadio. Uses on-device TTS (macOS `say` / Linux `espeak`), so it works offline with zero keys.',
      inputSchema: {
        text: z.string().min(1).describe('The text to speak aloud.'),
        style: styleSchema.describe('Reserved for future per-style voice selection.'),
      },
    },
    async (args) => {
      const style = (args.style ?? undefined) as NarrateStyle | undefined;
      const { tier } = await narrate(args.text, style ? { style } : {});
      return {
        content: [{ type: 'text' as const, text: `narrated via ${tier} tier (on-device, offline)` }],
      };
    },
  );

  server.registerTool(
    'recap',
    {
      title: 'Recap a session',
      description:
        'Build a spoken narration script from a list of session milestone events (VibeEvent[]), then speak it aloud. Kind may be task-done, pr-opened, tests-pass, tests-fail, error, spec-completed, prototype-finished, session-end, or manual.',
      inputSchema: {
        events: z
          .array(z.record(z.string(), z.unknown()))
          .min(1)
          .describe('Session milestone events (VibeEvent[] / RawEvent[]).'),
        style: styleSchema.describe('monologue (single voice) or podcast (two-host).'),
        mode: modeSchema.describe('summary (terse) or podcast (walkthrough).'),
      },
    },
    async (args) => {
      const events = args.events as unknown as SessionEvent[];
      const style = (args.style ?? undefined) as NarrateStyle | undefined;
      const mode = (args.mode ?? undefined) as RecapMode | undefined;
      const script = buildRecapScript(events, { style, mode });
      const { tier } = await narrate(script, style ? { style } : {});
      return {
        content: [
          { type: 'text' as const, text: `${script}\n\n(narrated via ${tier} tier, on-device, offline)` },
        ],
      };
    },
  );

  return server;
}

/** Start the stdio MCP server. Resolves only on shutdown. */
export async function startMcpServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

// `RawEvent` is referenced in a cast above; keep the import live under
// `verbatimModuleSyntax` even if structural typing strips the direct use.
export type { RawEvent };
