#!/usr/bin/env node

/**
 * Claude Code ログのリアルタイム整形表示
 *
 * 使い方:
 *   node scripts/tail-claude-code-log.js                 (新しいログのみリアルタイム表示)
 *   node scripts/tail-claude-code-log.js --history        (過去ログ全件 + リアルタイム)
 *   node scripts/tail-claude-code-log.js --history=20     (過去ログ直近20件 + リアルタイム)
 *   node scripts/tail-claude-code-log.js --no-thinking    (thinkingブロックを非表示)
 *   node scripts/tail-claude-code-log.js --history --no-thinking  (組み合わせ可)
 */

const fs = require("fs");
const path = require("path");

const LOG_DIR = path.join(
  __dirname,
  "../claude-data/projects/-home-node--openclaw-workspace"
);

const showThinking = !process.argv.includes("--no-thinking");

// --history or --history=N
const historyArg = process.argv.find((a) => a.startsWith("--history"));
const showHistory = !!historyArg;
const historyLimit = historyArg && historyArg.includes("=")
  ? parseInt(historyArg.split("=")[1], 10)
  : 0; // 0 = unlimited

// ANSI colors
const c = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  red: "\x1b[31m",
  gray: "\x1b[90m",
  white: "\x1b[37m",
  bgBlue: "\x1b[44m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgMagenta: "\x1b[45m",
};

function timestamp(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return c.gray + d.toLocaleTimeString("ja-JP") + c.reset;
}

function separator() {
  return c.gray + "─".repeat(60) + c.reset;
}

function truncate(str, max = 200) {
  if (!str) return "";
  const oneLine = str.replace(/\n/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return oneLine.slice(0, max) + "...";
}

function formatLine(line) {
  if (!line.trim()) return null;

  let data;
  try {
    data = JSON.parse(line);
  } catch {
    return null;
  }

  const lines = [];
  const ts = timestamp(data.timestamp);

  // queue-operation
  if (data.type === "queue-operation") {
    const op = data.operation === "enqueue" ? "ENQUEUE" : "DEQUEUE";
    lines.push(`${ts} ${c.bgBlue}${c.white} ${op} ${c.reset}`);
    if (data.content) {
      lines.push(`  ${c.cyan}${truncate(data.content, 120)}${c.reset}`);
    }
    return lines.join("\n");
  }

  // user message
  if (data.type === "user") {
    const msg = data.message;
    if (!msg) return null;

    // tool result
    if (data.toolUseResult != null) {
      const success = data.toolUseResult.success;
      const icon = success ? `${c.green}✓` : `${c.red}✗`;
      const name = data.toolUseResult.commandName || "";
      lines.push(
        `${ts} ${c.bgGreen}${c.white} TOOL RESULT ${c.reset} ${icon} ${name}${c.reset}`
      );
      return lines.join("\n");
    }

    // skill injection (isMeta)
    if (data.isMeta) {
      lines.push(
        `${ts} ${c.bgMagenta}${c.white} SKILL ${c.reset} ${c.magenta}スキル内容注入${c.reset}`
      );
      return lines.join("\n");
    }

    // normal user message
    const content = msg.content;
    if (typeof content === "string") {
      lines.push(
        `${ts} ${c.bgBlue}${c.white} USER ${c.reset} ${c.cyan}${truncate(content, 120)}${c.reset}`
      );
    } else if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === "text") {
          lines.push(
            `${ts} ${c.bgBlue}${c.white} USER ${c.reset} ${c.cyan}${truncate(block.text, 120)}${c.reset}`
          );
        } else if (block.type === "tool_result") {
          lines.push(
            `${ts} ${c.bgGreen}${c.white} TOOL RESULT ${c.reset} ${c.dim}(content omitted)${c.reset}`
          );
        }
      }
    }
    return lines.length ? lines.join("\n") : null;
  }

  // assistant message
  if (data.type === "assistant") {
    const msg = data.message;
    if (!msg || !msg.content) return null;

    for (const block of msg.content) {
      // thinking
      if (block.type === "thinking" && block.thinking) {
        if (showThinking) {
          lines.push(
            `${ts} ${c.yellow}💭 THINKING${c.reset} ${c.dim}${truncate(block.thinking, 150)}${c.reset}`
          );
        }
      }

      // text output
      if (block.type === "text") {
        lines.push(
          `${ts} ${c.bgYellow}${c.white} ASSISTANT ${c.reset} ${c.white}${truncate(block.text, 300)}${c.reset}`
        );
      }

      // tool_use
      if (block.type === "tool_use") {
        const name = block.name || "unknown";
        const input = block.input || {};
        let detail = "";

        if (name.startsWith("mcp__playwright__")) {
          const short = name.replace("mcp__playwright__", "🌐 ");
          detail = input.url || input.selector || input.text || "";
          lines.push(
            `${ts} ${c.bgMagenta}${c.white} MCP ${c.reset} ${c.magenta}${short}${c.reset} ${c.dim}${truncate(detail, 100)}${c.reset}`
          );
        } else if (name === "Skill") {
          lines.push(
            `${ts} ${c.bgMagenta}${c.white} SKILL ${c.reset} ${c.magenta}${input.skill || ""}${c.reset}`
          );
        } else {
          detail = input.command || input.pattern || input.file_path || input.url || "";
          lines.push(
            `${ts} ${c.bgGreen}${c.white} TOOL ${c.reset} ${c.green}${name}${c.reset} ${c.dim}${truncate(detail, 100)}${c.reset}`
          );
        }
      }
    }

    // usage info
    if (msg.usage && lines.length > 0) {
      const u = msg.usage;
      const tokens = `in:${u.input_tokens || 0} out:${u.output_tokens || 0}`;
      lines.push(`  ${c.gray}tokens: ${tokens}${c.reset}`);
    }

    return lines.length ? lines.join("\n") : null;
  }

  return null;
}

function findLatestJsonl(dir) {
  if (!fs.existsSync(dir)) return null;
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".jsonl"))
    .map((f) => ({
      name: f,
      path: path.join(dir, f),
      mtime: fs.statSync(path.join(dir, f)).mtimeMs,
    }))
    .sort((a, b) => b.mtime - a.mtime);
  return files.length > 0 ? files[0].path : null;
}

function printHistory(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");
  const formatted = [];

  for (const line of lines) {
    const result = formatLine(line);
    if (result) formatted.push(result);
  }

  // Apply limit (take last N entries)
  const toShow = historyLimit > 0 ? formatted.slice(-historyLimit) : formatted;

  if (toShow.length < formatted.length) {
    console.log(
      `${c.dim}   ... ${formatted.length - toShow.length} 件省略 ...${c.reset}`
    );
    console.log(separator());
  }

  for (const entry of toShow) {
    console.log(entry);
    console.log(separator());
  }

  console.log(
    `${c.bold}${c.green}--- 過去ログ ここまで (${toShow.length}件) --- 以降リアルタイム ---${c.reset}`
  );
  console.log(separator());
}

function tailFile(filePath) {
  console.log(`${c.bold}${c.cyan}📋 Watching: ${filePath}${c.reset}`);
  console.log(
    `${c.dim}   オプション: --history[=N] --no-thinking${c.reset}`
  );
  console.log(separator());

  // Show history if requested
  if (showHistory) {
    printHistory(filePath);
  }

  let position = 0;
  const stats = fs.statSync(filePath);
  // Start from current end of file (only show new entries)
  position = stats.size;

  function readNew() {
    const stats = fs.statSync(filePath);
    if (stats.size <= position) return;

    const stream = fs.createReadStream(filePath, {
      start: position,
      encoding: "utf8",
    });

    let buffer = "";
    stream.on("data", (chunk) => {
      buffer += chunk;
    });
    stream.on("end", () => {
      position = stats.size;
      const lines = buffer.split("\n");
      for (const line of lines) {
        const formatted = formatLine(line);
        if (formatted) {
          console.log(formatted);
          console.log(separator());
        }
      }
    });
  }

  fs.watchFile(filePath, { interval: 500 }, () => {
    readNew();
  });
}

function watchDir() {
  console.log(`${c.bold}${c.cyan}🔍 ログディレクトリ監視中...${c.reset}`);
  console.log(`${c.dim}   ${LOG_DIR}${c.reset}`);
  console.log(separator());

  // Check for existing file first
  const existing = findLatestJsonl(LOG_DIR);
  if (existing) {
    tailFile(existing);
    return;
  }

  // Wait for directory and file to appear
  const check = setInterval(() => {
    const found = findLatestJsonl(LOG_DIR);
    if (found) {
      clearInterval(check);
      tailFile(found);
    }
  }, 1000);

  // Also watch for new files in the directory
  if (fs.existsSync(LOG_DIR)) {
    fs.watch(LOG_DIR, (eventType, filename) => {
      if (filename && filename.endsWith(".jsonl")) {
        const filePath = path.join(LOG_DIR, filename);
        if (fs.existsSync(filePath)) {
          clearInterval(check);
          tailFile(filePath);
        }
      }
    });
  }
}

// Start
console.log(`\n${c.bold}═══ Claude Code Log Viewer ═══${c.reset}\n`);
watchDir();
