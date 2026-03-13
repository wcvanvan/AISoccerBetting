/**
 * Shared helper for running prompts via the Claude CLI (`claude --print`).
 * Used by report-analyzer.ts when LLM_MODE=cli (the default).
 *
 * NOTE: `claude --print` buffers all output until the full response is ready,
 * so real-time file streaming is not possible in CLI mode.
 * Use LLM_MODE=api for incremental streaming to file.
 */

import { spawn } from 'child_process';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../..');

export interface ClaudeCliOptions {
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
  const { onLog } = opts;

  return new Promise<string>((resolve, reject) => {
    // Remove CLAUDECODE env vars to prevent "nested session" error
    // when the web server is started from inside a Claude Code terminal
    const env = { ...process.env };
    delete env.CLAUDECODE;
    delete env.CLAUDE_CODE_ENTRYPOINT;

    const child = spawn(
      'claude',
      ['--print', '--output-format', 'text'],
      {
        cwd: PROJECT_ROOT,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';

    child.stdin.write(prompt);
    child.stdin.end();

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk: Buffer) => {
      const text = chunk.toString().trim();
      if (text) {
        stderr += text + '\n';
        if (onLog) onLog(text);
      }
    });

    child.on('error', (err) => {
      reject(
        new Error(
          `Claude CLI not found. Install it: npm install -g @anthropic-ai/claude-code. ${err.message}`,
        ),
      );
    });

    child.on('exit', (code) => {
      if (code !== 0) {
        const detail = stderr.trim() ? `: ${stderr.trim()}` : '';
        reject(new Error(`Claude CLI exited with code ${code}${detail}`));
        return;
      }

      const output = stdout.trim();
      if (!output) {
        reject(new Error('Claude CLI produced no output'));
        return;
      }

      resolve(output);
    });
  });
}
