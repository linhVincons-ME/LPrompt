import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'python', 'dspy_optimizer.py');

export function runDspyOptimizer(payload, { timeoutMs = 90_000, pythonCommand = process.env.LPROMPT_PYTHON || (process.platform === 'win32' ? 'py' : 'python3'), scriptPath = SCRIPT } = {}) {
  return new Promise((resolve, reject) => {
    const args = process.platform === 'win32' && pythonCommand.toLowerCase().endsWith('py') ? ['-3', scriptPath] : [scriptPath];
    const child = spawn(pythonCommand, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env, PYTHONUNBUFFERED: '1' } });
    let stdout = '';
    let stderr = '';
    let settled = false;
    const finish = (callback) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      callback();
    };
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      finish(() => reject(new Error(`DSPy vượt quá thời gian chờ ${Math.round(timeoutMs / 1000)} giây.`)));
    }, timeoutMs);
    child.stdout.on('data', (chunk) => { stdout += chunk; if (stdout.length > 2_000_000) child.kill('SIGKILL'); });
    child.stderr.on('data', (chunk) => { stderr += chunk; if (stderr.length > 200_000) child.kill('SIGKILL'); });
    child.on('error', (error) => finish(() => reject(new Error(`Không khởi động được Python/DSPy: ${error.message}`))));
    child.on('close', (code) => finish(() => {
      if (code !== 0) return reject(new Error(stderr.trim() || `DSPy kết thúc với mã ${code}.`));
      try { resolve(JSON.parse(stdout)); } catch { reject(new Error('DSPy trả về dữ liệu không hợp lệ.')); }
    }));
    child.stdin.on('error', () => undefined);
    child.stdin.end(JSON.stringify(payload));
  });
}
