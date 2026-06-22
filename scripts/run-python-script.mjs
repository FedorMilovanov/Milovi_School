/**
 * Simple wrapper to run Python scripts from npm scripts.
 * Usage: node run-python-script.mjs <script.py> [args...]
 */
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const script = process.argv[2];
if (!script) {
  console.error('Usage: node run-python-script.mjs <script.py> [args...]');
  process.exit(1);
}

const scriptPath = resolve(script);
const args = process.argv.slice(3);

const python = process.platform === 'win32' ? 'python' : 'python3';
const child = spawn(python, [scriptPath, ...args], {
  stdio: 'inherit',
  cwd: process.cwd(),
});

child.on('exit', (code) => {
  process.exit(code ?? 0);
});
