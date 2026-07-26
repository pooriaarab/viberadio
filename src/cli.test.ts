import { describe, it, expect } from 'vitest';

import { parseArgs } from './cli.js';

describe('parseArgs', () => {
  it('defaults to help when given no args', () => {
    expect(parseArgs([])).toEqual({ command: 'help' });
  });

  it('recognizes help flags', () => {
    expect(parseArgs(['--help'])).toEqual({ command: 'help' });
    expect(parseArgs(['-h'])).toEqual({ command: 'help' });
    expect(parseArgs(['help'])).toEqual({ command: 'help' });
  });

  it('recognizes version flags', () => {
    expect(parseArgs(['--version'])).toEqual({ command: 'version' });
    expect(parseArgs(['-v'])).toEqual({ command: 'version' });
  });

  it('recognizes the mcp command', () => {
    expect(parseArgs(['mcp'])).toEqual({ command: 'mcp' });
  });

  it('parses say with text', () => {
    expect(parseArgs(['say', 'hello world'])).toEqual({
      command: 'say',
      text: 'hello world',
      style: undefined,
    });
  });

  it('parses say with a valid --style', () => {
    expect(parseArgs(['say', 'hi', '--style', 'podcast'])).toEqual({
      command: 'say',
      text: 'hi',
      style: 'podcast',
    });
  });

  it('drops an invalid --style for say', () => {
    expect(parseArgs(['say', 'hi', '--style', 'bogus'])).toEqual({
      command: 'say',
      text: 'hi',
      style: undefined,
    });
  });

  it('parses recap with no file (stdin)', () => {
    expect(parseArgs(['recap'])).toEqual({
      command: 'recap',
      file: undefined,
      style: undefined,
      mode: undefined,
    });
  });

  it('parses recap with a file', () => {
    expect(parseArgs(['recap', 'session.json'])).toEqual({
      command: 'recap',
      file: 'session.json',
      style: undefined,
      mode: undefined,
    });
  });

  it('parses recap with style and mode flags', () => {
    expect(parseArgs(['recap', 'session.json', '--style', 'podcast', '--mode', 'summary'])).toEqual({
      command: 'recap',
      file: 'session.json',
      style: 'podcast',
      mode: 'summary',
    });
  });

  it('allows flags before the file', () => {
    expect(parseArgs(['recap', '--mode', 'podcast'])).toEqual({
      command: 'recap',
      file: undefined,
      style: undefined,
      mode: 'podcast',
    });
  });

  it('returns null for an unknown command', () => {
    expect(parseArgs(['bogus'])).toEqual({ command: null });
  });
});
