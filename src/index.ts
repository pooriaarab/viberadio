/**
 * VibeRadio — your agent's output as audio.
 *
 * Library API: turn an agentic-coding session's milestone events into spoken
 * narration. Audio is resolved through the `@pooriaarab/vibe-core` model cascade.
 *
 * v0 ships the **on-device tier** only (system TTS: macOS `say` / Linux
 * `espeak` / `spd-say`), so it works fully offline with zero keys. The
 * {@link createNarrator} factory is the seam where BYO-key TTS (ElevenLabs /
 * OpenAI / …) and the host agent's own provider will plug in later — the cascade
 * already knows how to route to them once egress + consent are enabled.
 */

import {
  createCascade,
  createConsentLedger,
  makeEvent,
  notify,
  pickLocalRunner,
  type Capability,
  type Cascade,
  type CascadeTier,
  type ConsentLedger,
  type LocalRunner,
  type ProviderAdapter,
  type ResolvedProvider,
  type VibeEvent,
} from "@pooriaarab/vibe-core";

/* -------------------------------------------------------------------------- */
/* Public types                                                               */
/* -------------------------------------------------------------------------- */

/** Narration voice / character. v0 routes both through the single on-device voice. */
export type NarrateStyle = "monologue" | "podcast";

/** Verbosity / shape of a recap. */
export type RecapMode = "summary" | "podcast";

/**
 * A loose event shape accepted from JSON files, stdin, or MCP tool args, where
 * fields may be missing or use free-text descriptions. Normalized into
 * narration by {@link buildRecapScript}. A {@link VibeEvent} is assignable to
 * this, so the two can be freely mixed in an input array.
 */
export interface RawEvent {
  readonly kind?: string;
  readonly agent?: string;
  readonly cwd?: string;
  readonly ts?: number;
  readonly payload?: Readonly<Record<string, unknown>>;
  /** Free-text description, emitted directly by some sources. */
  readonly message?: string;
  /** A file the event concerns. */
  readonly file?: string;
  /** A pull-request number. */
  readonly pr?: number;
  /** A count (e.g. number of tests). */
  readonly count?: number;
}

/** A session event, in either normalized or loose form. */
export type SessionEvent = VibeEvent | RawEvent;

/** Dependencies for resolving the audio cascade. Inject one in tests; omit for defaults. */
export interface NarratorDeps {
  /** Tier-3 on-device runner resolver. Defaults to vibe-core's `pickLocalRunner`. */
  readonly pickLocal?: (capability: Capability) => Promise<LocalRunner | null>;
  /** Egress gate for tiers agent/byo. Defaults to a fresh empty in-memory ledger. */
  readonly consent?: ConsentLedger;
  /** Tier-1: the host agent's already-configured provider (future). */
  readonly hostProvider?: () => Promise<ProviderAdapter | null>;
  /** Tier-2: capability-specific providers from keys you supplied (future). */
  readonly byoProviders?: readonly ProviderAdapter[];
  /**
   * Sink notified with a `task-done` event after a recap is spoken — the
   * vibenotifications bridge. Defaults to vibe-core's `notify`, which appends
   * to the local `~/.vibe/notify.jsonl` channel. Inject a fake in tests.
   */
  readonly notify?: (event: VibeEvent) => void;
}

/** Options for {@link narrate}. */
export interface NarrateOptions {
  /** Reserved for future per-style voice selection (v0 uses one on-device voice). */
  readonly style?: NarrateStyle;
  /** @internal injection point for tests / advanced wiring. */
  readonly deps?: NarratorDeps;
}

/** Result of {@link narrate}. */
export interface NarrateResult {
  /** Which cascade tier satisfied the request (v0: always `'local'`). */
  readonly tier: CascadeTier;
  /** Human-facing label, e.g. `"on-device · offline"`. */
  readonly label: string;
}

/** Options for {@link buildRecapScript} and {@link recap}. */
export interface RecapOptions {
  readonly style?: NarrateStyle;
  readonly mode?: RecapMode;
}

/** Result of {@link recap}. */
export interface RecapResult {
  readonly tier: CascadeTier;
  readonly script: string;
}

/** A narrating client bound to a cascade. Created via {@link createNarrator}. */
export interface Narrator {
  readonly cascade: Cascade;
  narrate(text: string, opts?: NarrateOptions): Promise<NarrateResult>;
}

/** Thrown when no audio provider could be resolved (e.g. no on-device TTS binary). */
export class TtsUnavailableError extends Error {
  readonly code = "TTS_UNAVAILABLE" as const;
  constructor(
    message = "No audio provider available — on-device TTS not found.",
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "TtsUnavailableError";
  }
}

/* -------------------------------------------------------------------------- */
/* buildRecapScript — pure, unit-testable, no audio                            */
/* -------------------------------------------------------------------------- */

interface NormalizedEvent {
  readonly kind: string;
  readonly detail: string | undefined;
  readonly file: string | undefined;
  readonly pr: number | undefined;
  readonly count: number | undefined;
}

const asString = (v: unknown): string | undefined =>
  typeof v === "string" && v.length > 0 ? v : undefined;

const asNumber = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;

function firstString(...values: unknown[]): string | undefined {
  for (const v of values) {
    const s = asString(v);
    if (s !== undefined) return s;
  }
  return undefined;
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const v of values) {
    const n = asNumber(v);
    if (n !== undefined) return n;
  }
  return undefined;
}

function normalizeEvent(ev: SessionEvent): NormalizedEvent {
  const r = ev as RawEvent;
  const kind = typeof r.kind === "string" ? r.kind : "manual";
  const p: Record<string, unknown> = r.payload ?? {};
  return {
    kind,
    detail: firstString(
      p["message"],
      p["summary"],
      p["detail"],
      p["title"],
      p["description"],
      p["change"],
      r.message,
    ),
    file: firstString(p["file"], p["path"], r.file),
    pr: firstNumber(p["pr"], p["number"], r.pr),
    count: firstNumber(p["count"], r.count),
  };
}

type EventFormatter = (ev: NormalizedEvent) => string | null;

const EVENT_FORMATTERS: Record<string, EventFormatter> = {
  "pr-opened": (ev) => {
    const where = ev.file ? ` (${ev.file})` : "";
    return ev.pr !== undefined ? `opened PR #${ev.pr}${where}` : `opened a pull request${where}`;
  },
  "tests-pass": (ev) => `tests passed${ev.count !== undefined ? ` (${ev.count})` : ""}`,
  "tests-fail": (ev) => `tests failed${ev.count !== undefined ? ` (${ev.count})` : ""}`,
  "task-done": (ev) => {
    if (ev.detail) return ev.file ? `${ev.detail} (${ev.file})` : ev.detail;
    return ev.file ? `worked in ${ev.file}` : "finished a task";
  },
  "spec-completed": (ev) => ev.detail ?? "finished the spec",
  "prototype-finished": (ev) => ev.detail ?? "finished a prototype",
  error: (ev) => ev.detail ?? "ran into an error",
  "session-end": (ev) => ev.detail ?? "wrapped up the session",
  manual: (ev) => ev.detail ?? "hit a checkpoint",
};

/** Map one normalized event to a spoken clause, or `null` to skip it. */
function describeEvent(ev: NormalizedEvent): string | null {
  const formatter = Object.hasOwn(EVENT_FORMATTERS, ev.kind)
    ? EVENT_FORMATTERS[ev.kind]
    : undefined;
  if (formatter) return formatter(ev);
  return ev.detail ?? null;
}

/** Join spoken clauses with commas and an Oxford "and" before the last. */
function joinClauses(clauses: readonly string[]): string {
  if (clauses.length === 0) return "";
  if (clauses.length === 1) return clauses[0] ?? "";
  const last = clauses.at(-1) ?? "";
  const head = clauses.slice(0, -1).join(", ");
  return `${head}, and ${last}`;
}

function collectClauses(events: readonly SessionEvent[]): string[] {
  const clauses: string[] = [];
  for (const ev of events) {
    const clause = describeEvent(normalizeEvent(ev));
    if (clause !== null) clauses.push(clause);
  }
  return clauses;
}

function emptyRecapScript(style: NarrateStyle): string {
  return style === "podcast"
    ? "Welcome back. Nothing has happened yet, so there is nothing to recap. Check back after the next turn."
    : "Nothing has happened yet — nothing to recap.";
}

function podcastScript(mode: RecapMode, body: string): string {
  const opener =
    mode === "podcast"
      ? "Welcome back to the session. Let us walk through what just happened."
      : "Quick session recap.";
  const closer =
    mode === "podcast" ? "And that wraps this one. Back to work." : "That is the recap.";
  return `${opener} — So, what happened? — ${body}. — ${closer}`;
}

function monologueScript(mode: RecapMode, body: string): string {
  const opener =
    mode === "podcast"
      ? "Here is a walkthrough of what happened in this session:"
      : "Here is what happened:";
  return `${opener} ${body}.`;
}

/**
 * Turn session milestone events into a narration script. Pure — no IO, no audio,
 * fully deterministic — so it is trivially unit-testable and safe to call from a
 * server, a worker, or a preview.
 *
 * Accepts either normalized {@link VibeEvent}s or loose {@link RawEvent}s (the
 * shape you'd get from a JSON file / stdin / MCP args). Unknown kinds with no
 * human-readable detail are skipped rather than narrated verbatim.
 *
 * @example
 * ```ts
 * buildRecapScript([
 *   { kind: 'task-done', agent: 'claude-code', cwd: '/repo', ts: 0,
 *     payload: { file: 'auth.ts', change: 'fixed the token check' } },
 *   { kind: 'tests-pass', agent: 'claude-code', cwd: '/repo', ts: 1, payload: { count: 12 } },
 *   { kind: 'pr-opened', agent: 'claude-code', cwd: '/repo', ts: 2, payload: { pr: 42 } },
 * ]);
 * // => "Here is what happened: fixed the token check (auth.ts), tests passed (12), and opened PR #42."
 * ```
 */
export function buildRecapScript(events: readonly SessionEvent[], opts: RecapOptions = {}): string {
  const style: NarrateStyle = opts.style ?? "monologue";
  const mode: RecapMode = opts.mode ?? "summary";
  const clauses = collectClauses(events);
  const body = joinClauses(clauses);
  if (clauses.length === 0) return emptyRecapScript(style);
  if (style === "podcast") return podcastScript(mode, body);
  return monologueScript(mode, body);
}

/* -------------------------------------------------------------------------- */
/* Narrator + narrate + recap                                                  */
/* -------------------------------------------------------------------------- */

/** A `ProviderAdapter | LocalRunner` has different `generate` arities — narrow it. */
function isLocalRunner(p: ProviderAdapter | LocalRunner): p is LocalRunner {
  return typeof (p as { capability?: unknown }).capability === "string";
}

/** Speak `text` through either kind of resolved provider. */
async function speak(provider: ProviderAdapter | LocalRunner, text: string): Promise<void> {
  if (isLocalRunner(provider)) {
    await provider.generate<{ readonly text: string }, void>({ text });
    return;
  }
  // Egress provider (agent/byo): capability-first generate signature.
  await provider.generate<{ readonly text: string }, void>("audio", { text });
}

/**
 * Build a {@link Narrator} bound to an audio cascade. The default cascade routes
 * `'audio'` to vibe-core's on-device system-TTS runner; pass {@link NarratorDeps}
 * to inject a fake `pickLocal` in tests, or — later — `hostProvider` / `byoProviders`
 * to add BYO-key TTS voices.
 */
export function createNarrator(deps: NarratorDeps = {}): Narrator {
  const consent: ConsentLedger = deps.consent ?? createConsentLedger();
  const cascade = createCascade({
    pickLocal: deps.pickLocal ?? ((cap: Capability) => pickLocalRunner(cap)),
    consent,
    ...(deps.hostProvider ? { hostProvider: deps.hostProvider } : {}),
    ...(deps.byoProviders ? { byoProviders: deps.byoProviders } : {}),
  });

  return {
    cascade,
    async narrate(text, opts = {}): Promise<NarrateResult> {
      if (typeof text !== "string" || text.length === 0) {
        throw new TypeError("narrate() expects a non-empty text string");
      }
      // `style` is accepted for API symmetry; v0 routes all styles through the
      // single on-device voice. Future BYO-key voices will vary per style here.
      void opts.style;
      try {
        const resolved: ResolvedProvider = await cascade.resolve({
          capability: "audio",
          allowEgress: false, // v0: on-device only — offline, zero keys
        });
        await speak(resolved.provider, text);
        return { tier: resolved.tier, label: resolved.label };
      } catch (err) {
        throw new TtsUnavailableError(err instanceof Error ? err.message : String(err), {
          cause: err,
        });
      }
    },
  };
}

let defaultNarrator: Narrator | undefined;
function getDefaultNarrator(): Narrator {
  if (!defaultNarrator) defaultNarrator = createNarrator();
  return defaultNarrator;
}

/**
 * Resolve an audio provider via the cascade and speak `text` now. With the
 * default dependency set this is the on-device system voice (offline, no keys).
 *
 * @returns the cascade tier that satisfied the request (v0: `'local'`).
 */
export function narrate(text: string, opts: NarrateOptions = {}): Promise<NarrateResult> {
  const narrator = opts.deps ? createNarrator(opts.deps) : getDefaultNarrator();
  return narrator.narrate(text, opts);
}

/**
 * Build a narration script from `events`, then speak it. Returns both the
 * resolved cascade tier and the script that was spoken.
 *
 * After the recap is spoken, a `task-done` event is pushed to the local
 * notify channel (`~/.vibe/notify.jsonl` via vibe-core's `notify`) so
 * vibenotifications can surface it. That bridge is best-effort: a channel
 * IO failure never fails the recap.
 */
export async function recap(
  events: readonly SessionEvent[],
  opts: RecapOptions & { readonly deps?: NarratorDeps } = {},
): Promise<RecapResult> {
  const script = buildRecapScript(events, { style: opts.style, mode: opts.mode });
  const { tier } = await narrate(script, { style: opts.style, deps: opts.deps });
  const sink = opts.deps?.notify ?? notify;
  try {
    sink(
      makeEvent("task-done", "viberadio", process.cwd(), {
        summary: script,
        count: events.length,
      }),
    );
  } catch {
    /* the notify channel is best-effort — narration already succeeded */
  }
  return { tier, script };
}
