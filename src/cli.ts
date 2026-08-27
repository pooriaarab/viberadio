#!/usr/bin/env node
/**
 * VibeRadio CLI.
 *
 *   viberadio say "<text>"          Narrate text now (on-device, offline).
 *   viberadio recap [file.json]     Build a script from session events and speak it.
 *   viberadio mcp                   Start the stdio MCP server.
 *   viberadio --version | --help
 *
 * Hand-rolled arg parsing — no new deps. The parser is exported as
 * {@link parseArgs} so it is unit-testable in isolation.
 */

import { readFileSync, realpathSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

import { tierChip } from '@pooriaarab/vibe-core';

import {
  buildRecapScript,
  narrate,
  type NarrateStyle,
  type RecapMode,
  type SessionEvent,
} from './index.js';

/* -------------------------------------------------------------------------- */
/* Arg parsing (pure)                                                          */
/* -------------------------------------------------------------------------- */

const STYLES = new Set<NarrateStyle>(['monologue', 'podcast']);
const MODES = new Set<RecapMode>(['summary', 'podcast']);

export type CliCommand = 'say' | 'recap' | 'mcp' | 'help' | 'version' | null;

export interface ParsedArgs {
  readonly command: CliCommand;
  readonly text?: string;
  readonly file?: string;
  readonly style?: NarrateStyle;
  readonly mode?: RecapMode;
}

function parseStyle(v: string | undefined): NarrateStyle | undefined {
  return v !== undefined && STYLES.has(v as NarrateStyle) ? (v as NarrateStyle) : undefined;
}

function parseMode(v: string | undefined): RecapMode | undefined {
  return v !== undefined && MODES.has(v as RecapMode) ? (v as RecapMode) : undefined;
}

function parseMetaCommand(first: string): CliCommand | undefined {
  if (first === '--help' || first === '-h' || first === 'help') return 'help';
  if (first === '--version' || first === '-v') return 'version';
  if (first === 'mcp') return 'mcp';
  return undefined;
}

function parseSayArgs(args: readonly string[]): ParsedArgs {
  let style: NarrateStyle | undefined;
  // args[1] is the text (quoted); flags may follow.
  for (let i = 2; i < args.length; i++) {
    const a = args[i] ?? '';
    if (a === '--style' || a === '-s') {
      style = parseStyle(args[i + 1]);
      i += 1;
    }
  }
  return { command: 'say', text: args[1], style };
}

function parseRecapArgs(args: readonly string[]): ParsedArgs {
  let file: string | undefined;
  let style: NarrateStyle | undefined;
  let mode: RecapMode | undefined;
  for (let i = 1; i < args.length; i++) {
    const a = args[i] ?? '';
    if (a === '--style' || a === '-s') {
      style = parseStyle(args[i + 1]);
      i += 1;
    } else if (a === '--mode' || a === '-m') {
      mode = parseMode(args[i + 1]);
      i += 1;
    } else if (!a.startsWith('-') && file === undefined) {
      file = a;
    }
  }
  return { command: 'recap', file, style, mode };
}

/**
 * Parse VibeRadio CLI args (i.e. `process.argv.slice(2)`). Pure — no IO, no
 * process state — so it is trivially unit-testable.
 *
 * Supported shapes:
 *   ['say', "hello world", ['--style', 'podcast']]
 *   ['recap', 'session.json', '--style', 'podcast', '--mode', 'summary']
 *   ['recap', '--mode', 'podcast']            (reads stdin)
 *   ['mcp']
 *   ['--version' | '-v']  ['--help' | '-h']
 */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const args = [...argv];
  if (args.length === 0) return { command: 'help' };

  const first = args[0] ?? '';
  const meta = parseMetaCommand(first);
  if (meta !== undefined) return { command: meta };
  if (first === 'say') return parseSayArgs(args);
  if (first === 'recap') return parseRecapArgs(args);
  return { command: null };
}

/* -------------------------------------------------------------------------- */
/* IO helpers                                                                  */
/* -------------------------------------------------------------------------- */

function readVersion(): string {
  try {
    // dist/cli.js → ../package.json (the package root).
    const here = dirname(fileURLToPath(import.meta.url));
    const pkg = JSON.parse(readFileSyncText(resolvePath(here, '..', 'package.json'))) as {
      version?: string;
    };
    return pkg.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
}

function readFileSyncText(path: string): string {
  return readFileSync(path, 'utf8');
}

function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    const stdin = process.stdin;
    if (stdin.isTTY) {
      resolve('');
      return;
    }
    let data = '';
    stdin.setEncoding('utf8');
    stdin.on('data', (chunk: string) => {
      data += chunk;
    });
    stdin.once('end', () => resolve(data));
    stdin.once('error', reject);
  });
}

async function readEvents(file: string | undefined): Promise<SessionEvent[]> {
  if (!file && process.stdin.isTTY) {
    throw new Error(
      'recap needs events: pass a file (`viberadio recap session.json`) or pipe JSON on stdin.',
    );
  }
  const raw = file && file !== '-' ? await readFile(resolvePath(file), 'utf8') : await readStdin();
  const parsed = JSON.parse(raw) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error('recap input must be a JSON array of session events.');
  }
  return parsed as SessionEvent[];
}

/* -------------------------------------------------------------------------- */
/* Output helpers                                                              */
/* -------------------------------------------------------------------------- */

function printHelp(): void {
  const out = process.stdout;
  out.write(`viberadio ${readVersion()} — your agent's output as audio\n`);
  out.write('\n');
  out.write('USAGE\n');
  out.write('  viberadio say "<text>"          Narrate text now (on-device voice, offline).\n');
  out.write('  viberadio recap [file.json]     Build a script from session events and speak it.\n');
  out.write('  viberadio mcp                   Start the MCP server (stdio).\n');
  out.write('  viberadio --version             Print version.\n');
  out.write('  viberadio --help                Show this help.\n');
  out.write('\n');
  out.write('RECAP OPTIONS\n');
  out.write('  --style monologue|podcast       Narration voice (default: monologue).\n');
  out.write('  --mode summary|podcast          Verbosity / shape (default: summary).\n');
  out.write('  [file.json]                     Read events from a file; omit to read JSON from stdin.\n');
  out.write('\n');
  out.write('Works offline on-device with zero keys (macOS say / Linux espeak / spd-say).\n');
}

/** Graceful no-TTS fallback: print the script, note TTS unavailable, exit 0. */
function handleNoTts(scriptOrText: string, err: unknown): number {
  const err2 = process.stderr;
  err2.write(`\n${scriptOrText}\n\n`);
  err2.write(
    "⚠️  TTS unavailable — no on-device voice found. Install macOS `say` or Linux `espeak`/`spd-say`.\n",
  );
  if (process.env['VIBERADIO_DEBUG']) {
    err2.write(`   (${err instanceof Error ? err.message : String(err)})\n`);
  }
  return 0;
}

/* -------------------------------------------------------------------------- */
/* main                                                                        */
/* -------------------------------------------------------------------------- */

async function runMcp(): Promise<number> {
  // Lazy-load so `say`/`recap` never pay the MCP SDK / zod import cost.
  const mcpUrl = new URL('./mcp.js', import.meta.url);
  const mod = (await import(mcpUrl.href)) as { startMcpServer: () => Promise<void> };
  await mod.startMcpServer();
  return 0;
}

async function runSay(parsed: ParsedArgs): Promise<number> {
  const text = parsed.text;
  if (typeof text !== 'string' || text.length === 0) {
    process.stderr.write('Usage: viberadio say "<text>"\n');
    return 2;
  }
  try {
    const { tier } = await narrate(text, parsed.style ? { style: parsed.style } : {});
    process.stderr.write(`${tierChip('🔊', tier)}\n`);
    return 0;
  } catch (err) {
    return handleNoTts(text, err);
  }
}

async function runRecap(parsed: ParsedArgs): Promise<number> {
  let events: SessionEvent[];
  try {
    events = await readEvents(parsed.file);
  } catch (err) {
    process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
    return 2;
  }
  const opts = { style: parsed.style, mode: parsed.mode };
  const script = buildRecapScript(events, opts);
  try {
    const { tier } = await narrate(script, opts);
    process.stderr.write(`${tierChip('🔊', tier)}\n`);
    return 0;
  } catch (err) {
    return handleNoTts(script, err);
  }
}

/** CLI entry. Returns the desired exit code. */
export async function main(argv: readonly string[] = process.argv.slice(2)): Promise<number> {
  const parsed = parseArgs(argv);

  switch (parsed.command) {
    case 'version': {
      process.stdout.write(`viberadio ${readVersion()}\n`);
      return 0;
    }
    case 'help': {
      printHelp();
      return 0;
    }
    case 'mcp':
      return runMcp();
    case 'say':
      return runSay(parsed);
    case 'recap':
      return runRecap(parsed);
    default: {
      process.stderr.write(`Unknown command. Run 'viberadio --help'.\n`);
      return 2;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Run when executed as a script                                              */
/* -------------------------------------------------------------------------- */

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  try {
    return realpathSync(entry) === realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
}

if (isMainModule()) {
  void main().then(
    (code) => {
      process.exitCode = code;
    },
    (err) => {
      process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
      process.exitCode = 1;
    },
  );
}


