/**
 * Shared helper for running prompts via the Claude CLI (`claude --print`).
 * Used by report-analyzer.ts when LLM_MODE=cli (the default).
 *
 * Uses `--output-format stream-json --verbose` and parses stdout to capture
 * all assistant text across multiple turns (e.g. when the model uses web
 * search mid-analysis).
 */

import { spawn } from 'child_process';
import * as path from 'path';
import { config } from '../config';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

export interface ClaudeCliOptions {
  /** Optional log callback for stderr lines */
  onLog?: (line: string) => void;
  /** Override the model (defaults to config.analysis.model) */
  model?: string;
  /** Override max output tokens (defaults to 128000) */
  maxOutputTokens?: number;
  /** CLI effort level (defaults to 'high') */
  effort?: 'low' | 'medium' | 'high' | 'max';
  /** Timeout in milliseconds. If set, kills the subprocess after this duration. */
  timeoutMs?: number;
}

/**
 * Run a prompt through `claude --print` and return the text output.
 * The prompt is piped via stdin to avoid OS arg length limits.
 *
 * Parses stream-json output from stdout to concatenate text from all
 * assistant turns, ensuring nothing is lost when the model uses tools.
 */
export function runClaudeCli(
  prompt: string,
  opts: ClaudeCliOptions = {},
): Promise<string> {
  const { onLog } = opts;

  return new Promise<string>((resolve, reject) => {
    // Remove CLAUDECODE env vars to prevent "nested session" error
    // when the web server is started from inside a Claude Code terminal
    const env = { ...process.env };
    delete env.CLAUDECODE;
    delete env.CLAUDE_CODE_ENTRYPOINT;
    env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = String(opts.maxOutputTokens ?? 128_000);

    const model = opts.model ?? config.analysis.model;
    const child = spawn(
      'claude',
      [
        '--print', '--output-format', 'stream-json', '--verbose',
        '--model', model,
        '--effort', opts.effort ?? 'high', // 'max' crashes silently with large prompts (35KB+)
        '--dangerously-skip-permissions',
      ],
      {
        cwd: PROJECT_ROOT,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    let stdout = '';

    child.stdin.write(prompt);
    child.stdin.end();

    // stream-json with --verbose routes JSON lines to stdout
    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString().trim();
      if (text && onLog) onLog(text);
    });

    // Optional timeout: kill the subprocess if it exceeds the deadline
    let timedOut = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if (opts.timeoutMs) {
      timeoutId = setTimeout(() => {
        timedOut = true;
        child.kill('SIGTERM');
        // SIGKILL fallback in case SIGTERM is ignored
        setTimeout(() => child.kill('SIGKILL'), 5_000);
        reject(new Error(`Claude CLI timed out after ${Math.round(opts.timeoutMs! / 1000)}s`));
      }, opts.timeoutMs);
    }

    child.on('error', (err) => {
      if (timeoutId) clearTimeout(timeoutId);
      reject(
        new Error(
          `Claude CLI not found. Install it: npm install -g @anthropic-ai/claude-code. ${err.message}`,
        ),
      );
    });

    child.on('exit', (code) => {
      if (timeoutId) clearTimeout(timeoutId);
      if (timedOut) return; // promise already rejected by timeout
      const output = extractAllText(stdout);
      if (!output) {
        const detail = code !== 0 ? ` (exit code ${code})` : '';
        reject(new Error(`Claude CLI produced no output${detail}`));
        return;
      }

      if (code !== 0 && onLog) {
        onLog(`Warning: Claude CLI exited with code ${code} but output was extracted`);
      }

      resolve(output);
    });
  });
}

/**
 * Parse stream-json lines and concatenate text content from all assistant messages.
 * Skips thinking blocks and tool-use blocks — only extracts visible text.
 */
function extractAllText(raw: string): string {
  const parts: string[] = [];

  for (const line of raw.split('\n')) {
    if (!line.trim()) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'assistant' && obj.message?.content) {
        for (const block of obj.message.content) {
          if (block.type === 'text' && block.text) {
            parts.push(block.text);
          }
        }
      }
    } catch {
      // skip non-JSON lines (progress messages, etc.)
    }
  }

  return parts.join('\n\n').trim();
}

