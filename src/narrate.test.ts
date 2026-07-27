import { describe, it, expect } from 'vitest';

import type { LocalRunner, VibeEvent } from '@pooriaarab/vibe-core';

import { createNarrator, narrate, recap, TtsUnavailableError } from './index.js';

/** Build a recording fake of the on-device audio runner. */
function fakeRunner(): { runner: LocalRunner; calls: ReadonlyArray<{ text: string }> } {
  const calls: { text: string }[] = [];
  const runner: LocalRunner = {
    capability: 'audio',
    available: async () => true,
    generate: async <TReq, TOut>(req: TReq): Promise<TOut> => {
      calls.push(req as { text: string });
      return undefined as unknown as TOut;
    },
  };
  return { runner, calls };
}

describe('narrate — cascade wiring', () => {
  it('resolves the local tier and speaks via generate({ text })', async () => {
    const { runner, calls } = fakeRunner();

    const result = await narrate('hello world', {
      deps: { pickLocal: async () => runner },
    });

    expect(result.tier).toBe('local');
    expect(result.label).toBe('on-device · offline');
    expect(calls).toHaveLength(1);
    expect(calls[0]?.text).toBe('hello world');
  });

  it('works equivalently through createNarrator()', async () => {
    const { runner, calls } = fakeRunner();
    const narrator = createNarrator({ pickLocal: async () => runner });

    const result = await narrator.narrate('testing');

    expect(result.tier).toBe('local');
    expect(calls[0]?.text).toBe('testing');
  });

  it('throws TtsUnavailableError when no local runner is available', async () => {
    await expect(
      narrate('hi', { deps: { pickLocal: async () => null } }),
    ).rejects.toBeInstanceOf(TtsUnavailableError);
  });

  it('rejects empty text with a TypeError', async () => {
    const { runner } = fakeRunner();
    await expect(
      narrate('', { deps: { pickLocal: async () => runner } }),
    ).rejects.toBeInstanceOf(TypeError);
  });

  it('does not call the runner when resolve fails', async () => {
    const { runner, calls } = fakeRunner();
    await expect(
      narrate('no voice', { deps: { pickLocal: async () => null } }),
    ).rejects.toBeInstanceOf(TtsUnavailableError);
    expect(calls).toHaveLength(0);
  });
});

describe('recap', () => {
  it('builds a script from events and narrates it on the local tier', async () => {
    const { runner, calls } = fakeRunner();
    const result = await recap(
      [
        { kind: 'task-done', agent: 'pi', cwd: '/r', ts: 1, payload: { change: 'shipped it' } },
        { kind: 'tests-pass', agent: 'pi', cwd: '/r', ts: 2, payload: { count: 5 } },
      ],
      { deps: { pickLocal: async () => runner } },
    );

    expect(result.tier).toBe('local');
    expect(result.script).toBe('Here is what happened: shipped it, and tests passed (5).');
    expect(calls).toHaveLength(1);
    expect(calls[0]?.text).toBe(result.script);
  });
});

describe('recap — notify bridge', () => {
  it('pushes a task-done event to the notify sink after the recap is spoken', async () => {
    const { runner, calls } = fakeRunner();
    const seen: VibeEvent[] = [];

    const result = await recap(
      [{ kind: 'task-done', agent: 'pi', cwd: '/r', ts: 1, payload: { change: 'shipped it' } }],
      {
        deps: {
          pickLocal: async () => runner,
          notify: (e) => {
            seen.push(e);
          },
        },
      },
    );

    expect(calls).toHaveLength(1); // spoken first
    expect(seen).toHaveLength(1);
    expect(seen[0]?.kind).toBe('task-done');
    expect(seen[0]?.agent).toBe('viberadio');
    expect(seen[0]?.payload?.['summary']).toBe(result.script);
    expect(seen[0]?.payload?.['count']).toBe(1);
  });

  it('still completes when the notify sink throws', async () => {
    const { runner, calls } = fakeRunner();

    const result = await recap(
      [{ kind: 'tests-pass', agent: 'pi', cwd: '/r', ts: 1, payload: { count: 3 } }],
      {
        deps: {
          pickLocal: async () => runner,
          notify: () => {
            throw new Error('disk full');
          },
        },
      },
    );

    expect(result.tier).toBe('local');
    expect(calls).toHaveLength(1);
  });

  it('does not notify when narration itself fails', async () => {
    const seen: VibeEvent[] = [];

    await expect(
      recap([{ kind: 'manual', agent: 'pi', cwd: '/r', ts: 1 }], {
        deps: {
          pickLocal: async () => null,
          notify: (e) => {
            seen.push(e);
          },
        },
      }),
    ).rejects.toBeInstanceOf(TtsUnavailableError);
    expect(seen).toHaveLength(0);
  });
});
