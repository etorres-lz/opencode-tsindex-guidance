# opencode-tsindex-guidance

[![npm version](https://img.shields.io/npm/v/opencode-tsindex-guidance.svg)](https://www.npmjs.com/package/opencode-tsindex-guidance)
[![npm downloads](https://img.shields.io/npm/dm/opencode-tsindex-guidance.svg)](https://www.npmjs.com/package/opencode-tsindex-guidance)
[![license](https://img.shields.io/npm/l/opencode-tsindex-guidance.svg)](LICENSE)

An [opencode](https://opencode.ai) plugin that adds tsindex code-navigation guidance to each session and nudges agents away from expensive full-file reads when `mcp__tsindex__*` tools are a better fit.

## Problem

When a workspace has tsindex MCP tools available, agents can navigate code more precisely by asking for file outlines, symbols, references, and enclosing symbols instead of reading whole files. Without a reminder in the active system prompt, agents may fall back to broad `Read` calls and miss the faster structural workflow.

## How it works

The plugin registers two hooks:

- `experimental.chat.system.transform` appends concise tsindex navigation guidance to the chat system prompt once per session.
- `tool.execute.before` prepends the same guidance to subagent `task` prompts, writes a stderr hint when an agent attempts a full-file `read` on a tsindex-supported file type, and writes a stderr hint when an agent runs `edit` on one — surfacing `replace_symbol` for whole-symbol rewrites.

The read and edit hints are advisory only. They do not block or rewrite the tool call.

## Installation

Add the package to your opencode config:

```jsonc
{
  "plugin": [
    "opencode-tsindex-guidance"
  ]
}
```

Then restart opencode so the plugin is loaded.

## Supported file types

The full-file read hint applies to common source and documentation files, including TypeScript, JavaScript, Python, Rust, Go, Java, Kotlin, C/C++, CSS, shell scripts, JSON, YAML, and Markdown.

## Development

```bash
npm install
npm run typecheck
npm run pack:dry-run
```

## Publishing

```bash
npm login     # one-time, opens browser to authenticate with npmjs.org
npm publish
```

The package is unscoped, so it publishes publicly by default. Bump the `version` in `package.json` before each release.

## License

[MIT](LICENSE)
