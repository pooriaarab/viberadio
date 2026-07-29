# Setup

How to install viberadio-fm and wire up its MCP server on macOS, Windows, and Linux.

## What you need

- Node.js 18 or newer (`node --version` to check).
- An agentic coding CLI or Claude Desktop, if you want the MCP server.

viberadio-fm lets you narrate your coding session like a radio show.

## Install

You don't have to install anything. `npx` runs the latest published version:

```
npx viberadio-fm --help
```

To get a persistent `viberadio` command, install it globally:

```
npm install -g viberadio-fm
```

## MCP setup

The MCP server lets an agent drive viberadio through tool calls instead of a terminal.
The package is `viberadio-fm` but the command is `viberadio`, so the server starts with `viberadio mcp` (note the `-p viberadio-fm` below, which tells npx which package the `viberadio` command lives in).

### Claude Code (all platforms)

One command, no file editing:

```
# macOS and Linux
claude mcp add viberadio -- npx -y -p viberadio-fm@latest viberadio mcp

# Windows
claude mcp add viberadio -- cmd /c npx -y -p viberadio-fm@latest viberadio mcp
```

### Claude Desktop (editing the config file)

Open the config file, add the `viberadio` block, then fully quit and reopen Claude.

**macOS** — `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "viberadio": { "command": "npx", "args": ["-y", "-p", "viberadio-fm@latest", "viberadio", "mcp"] }
  }
}
```

**Linux** — `~/.config/Claude/claude_desktop_config.json`: same as macOS.

**Windows** — `%APPDATA%\Claude\claude_desktop_config.json` (paste that into the
Explorer address bar, open with Notepad):

```json
{
  "mcpServers": {
    "viberadio": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "-p", "viberadio-fm@latest", "viberadio", "mcp"]
    }
  }
}
```

### Two things that break MCP on Windows

Most "MCP failed" or "not connected" reports on Windows come down to one of these.

1. **`"command": "npx"` on its own doesn't work.** Windows can't run `npx`
   directly, so the server never starts. Wrap it: `"command": "cmd"` with
   `"args": ["/c", "npx", ...]`. macOS and Linux don't need this.
2. **A stale cached version.** `npx` caches packages, so it can keep serving an
   old build. `viberadio-fm@latest` forces the current release.

## Check it works

```
viberadio --version
```

If the MCP server won't connect, run `npx -y -p viberadio-fm@latest viberadio mcp` in a terminal on its own.
It should start and wait for input rather than exiting straight away.
