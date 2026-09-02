import { describe, it, expect } from "vitest";

import { buildRecapScript } from "./index.js";
import type { VibeEvent } from "@pooriaarab/vibe-core";

function ev(partial: Partial<VibeEvent> & Pick<VibeEvent, "kind">): VibeEvent {
  return { agent: "claude-code", cwd: "/repo", ts: 0, ...partial };
}

describe("buildRecapScript", () => {
  it("handles an empty session with a friendly message", () => {
    expect(buildRecapScript([])).toBe("Nothing has happened yet — nothing to recap.");
  });

  it("narrates a single task-done with its detail", () => {
    const script = buildRecapScript([
      ev({ kind: "task-done", payload: { change: "fixed the token check" } }),
    ]);
    expect(script).toBe("Here is what happened: fixed the token check.");
  });

  it('joins many events with an Oxford "and"', () => {
    const script = buildRecapScript([
      ev({ kind: "task-done", payload: { file: "auth.ts", change: "fixed the token check" } }),
      ev({ kind: "tests-pass", payload: { count: 12 } }),
      ev({ kind: "pr-opened", payload: { pr: 42 } }),
    ]);
    expect(script).toBe(
      "Here is what happened: fixed the token check (auth.ts), tests passed (12), and opened PR #42.",
    );
  });

  it("attaches a file to pr-opened", () => {
    const script = buildRecapScript([
      ev({ kind: "pr-opened", payload: { pr: 7, file: "src/cli.ts" } }),
    ]);
    expect(script).toBe("Here is what happened: opened PR #7 (src/cli.ts).");
  });

  it("uses a default clause when a kind has no detail", () => {
    expect(buildRecapScript([ev({ kind: "error" })])).toBe(
      "Here is what happened: ran into an error.",
    );
    expect(buildRecapScript([ev({ kind: "tests-fail" })])).toBe(
      "Here is what happened: tests failed.",
    );
  });

  it('says "worked in <file>" for a file-only task-done', () => {
    expect(buildRecapScript([ev({ kind: "task-done", payload: { file: "auth.ts" } })])).toBe(
      "Here is what happened: worked in auth.ts.",
    );
  });

  it("skips unknown kinds that carry no human-readable detail", () => {
    const script = buildRecapScript([
      ev({ kind: "task-done", payload: { change: "shipped it" } }),
      ev({ kind: "some-future-kind" }),
      ev({ kind: "another-kind", payload: { message: "but this one has a note" } }),
    ]);
    expect(script).toBe("Here is what happened: shipped it, and but this one has a note.");
  });

  it("reads convenience top-level fields from a RawEvent", () => {
    const script = buildRecapScript([
      { kind: "pr-opened", pr: 99 } as never,
      { message: "manual checkpoint note" } as never,
    ]);
    expect(script).toBe("Here is what happened: opened PR #99, and manual checkpoint note.");
  });

  it("renders a podcast style with two-host framing", () => {
    const script = buildRecapScript(
      [ev({ kind: "task-done", payload: { change: "shipped it" } })],
      { style: "podcast" },
    );
    expect(script).toBe(
      "Quick session recap. — So, what happened? — shipped it. — That is the recap.",
    );
  });

  it("renders a podcast mode walkthrough", () => {
    const script = buildRecapScript(
      [ev({ kind: "task-done", payload: { change: "shipped it" } })],
      { mode: "podcast" },
    );
    expect(script).toBe("Here is a walkthrough of what happened in this session: shipped it.");
  });

  it("combines podcast style + podcast mode", () => {
    const script = buildRecapScript([ev({ kind: "tests-pass", payload: { count: 3 } })], {
      style: "podcast",
      mode: "podcast",
    });
    expect(script).toBe(
      "Welcome back to the session. Let us walk through what just happened. — So, what happened? — tests passed (3). — And that wraps this one. Back to work.",
    );
  });

  it("reports nothing-yet in podcast style too", () => {
    expect(buildRecapScript([], { style: "podcast" })).toContain("Nothing has happened yet");
  });
});
