import type { Plugin } from "@opencode-ai/plugin"
import { execFileSync } from "node:child_process"
import { dirname } from "node:path"

const TSINDEX_EXTENSIONS = new Set([
  ".py",
  ".pyi",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".rs",
  ".go",
  ".java",
  ".kt",
  ".cs",
  ".rb",
  ".php",
  ".phtml",
  ".c",
  ".h",
  ".cc",
  ".cpp",
  ".cxx",
  ".hpp",
  ".hh",
  ".hxx",
  ".css",
  ".scss",
  ".sh",
  ".bash",
  ".mk",
  ".mak",
  ".json",
  ".yaml",
  ".yml",
  ".md",
  ".markdown",
])

function getRepoName(cwd: string): string {
  try {
    const root = execFileSync("git", ["-C", cwd, "rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim()
    return root.split("/").filter(Boolean).at(-1) ?? cwd
  } catch {
    return cwd.split("/").filter(Boolean).at(-1) ?? cwd
  }
}

function supportsTsindex(filePath: unknown): filePath is string {
  if (typeof filePath !== "string" || filePath.length === 0) return false
  const lower = filePath.toLowerCase()
  for (const ext of TSINDEX_EXTENSIONS) {
    if (lower.endsWith(ext)) return true
  }
  return false
}

function systemGuidance(repo: string): string {
  return [
    `[tsindex] Code navigation: this workspace has the tsindex MCP tools (mcp__tsindex__*) — often the faster, more precise way to read and navigate code, so reach for them before a full-file Read when you need structure or specific symbols. Use your judgment, though: Read, grep, and Edit are still the right tools when they fit better. When tsindex fits, the workflow is: list_file_outline (structure without bodies) -> get_symbol (function/class/type by name; include_body=false to scan, true for the keeper) -> find_references before editing a symbol; enclosing_symbol to map file:line to its owning symbol; query as the raw tree-sitter escape hatch.`,
    `Batch to save round-trips: get_symbol/find_references take names:[...], enclosing_symbol takes rows:[...], and list_file_outline takes include_bodies_for:[...]. To rewrite a whole symbol, replace_symbol edits by name with no prior Read. Scope every tsindex call with repo="${repo}". Use grep for literals/config/env/log strings, and full-file Read when you need the whole file or tsindex is unavailable or clearly stale.`,
    `Markdown note: Markdown is supported for heading-based outline/symbol lookup (.md/.markdown knowledge files, READMEs, docs). list_file_outline/get_symbol are usually leaner for headings before falling back to Read/grep for prose details.`,
  ].join("\n\n")
}

function taskPreamble(repo: string): string {
  return `${systemGuidance(repo)}\n\n---\n`
}

const plugin: Plugin = async ({ directory }) => {
  const defaultRepo = getRepoName(directory)

  return {
    "experimental.chat.system.transform": async (_input, output) => {
      const guidance = systemGuidance(defaultRepo)
      if (!output.system.some((entry) => entry.includes("[tsindex] Code navigation:"))) {
        output.system.push(guidance)
      }
    },

    "tool.execute.before": async (input, output) => {
      if (input.tool === "task") {
        const args = output.args as Record<string, unknown>
        const prompt = args?.prompt
        if (typeof prompt !== "string" || prompt.length === 0) return
        if (/tsindex/i.test(prompt)) return
        args.prompt = `${taskPreamble(defaultRepo)}${prompt}`
        return
      }

      if (input.tool !== "read") return

      const args = output.args as Record<string, unknown>
      if (args == null || Array.isArray(args)) return
      if (args.offset != null || args.limit != null) return

      const filePath = args.filePath
      if (!supportsTsindex(filePath)) return

      const repo = getRepoName(dirname(filePath))
      process.stderr.write(
        `[tsindex-guidance] Full-file Read for ${filePath}. mcp__tsindex__list_file_outline/get_symbol (repo=\"${repo}\") are usually leaner if you just need structure or a few symbols — your call. Markdown files are supported for heading outlines.\n`,
      )
    },
  }
}

export default plugin
