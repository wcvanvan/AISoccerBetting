/**
 * Shared helper for running prompts via the Claude CLI (`claude --print`).
 * Used by report-analyzer.ts when LLM_MODE=cli (the default).
 */

import { spawn } from 'child_process';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export interface ClaudeCliOptions {
  /** Timeout in milliseconds (default: 10 minutes) */
  timeoutMs?: number;
  /** Optional log callback for stderr lines */
  onLog?: (line: string) => void;
}

/**
 * Run a prompt through `claude --print` and return the text output.
 * The prompt is piped via stdin to avoid OS arg length limits.
 */
export function runClaudeCli(
  prompt: string,
  opts: ClaudeCliOptions = {},
): Promise<string> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, onLog } = opts;

  return new Promise<string>((resolve, reject) => {
    const child = spawn(
      'claude',
      ['--print', '--output-format', 'text'],
      {
        cwd: PROJECT_ROOT,
        env: { ...process.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let timedOut = false;

    const timeout = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
    }, timeoutMs);

    child.stdin.write(prompt);
    child.stdin.end();

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString().trim();
      if (text && onLog) onLog(text);
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      reject(
        new Error(
          `Claude CLI not found. Install it: npm install -g @anthropic-ai/claude-code. ${err.message}`,
        ),
      );
    });

    child.on('exit', (code) => {
      clearTimeout(timeout);

      if (timedOut) {
        reject(new Error(`Claude CLI timed out after ${timeoutMs / 1000}s`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`Claude CLI exited with code ${code}`));
        return;
      }

      const output = stdout.trim();
      if (output) {
        resolve(output);
      } else {
        reject(new Error('Claude CLI produced no output'));
      }
    });
  });
}
