import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'python', 'dspy_optimizer.py');
const activeProcesses = new Set();

export function getActiveDspyProcessCount() {
  return activeProcesses.size;
}

export async function cancelActiveDspyProcesses(reason = 'LPrompt service đang dừng.', { graceMs = 2_000 } = {}) {
  const entries = [...activeProcesses];
  for (const entry of entries) entry.cancel(reason, graceMs);
  if (entries.length > 0) {
    let timer;
    await Promise.race([
      Promise.allSettled(entries.map((entry) => entry.done)),
      new Promise((resolve) => { timer = setTimeout(resolve, Math.max(500, graceMs + 1_000)); })
    ]);
    clearTimeout(timer);
  }
  return entries.length;
}

export function runDspyOptimizer(payload, { timeoutMs = 90_000, pythonCommand = process.env.LPROMPT_PYTHON || (process.platform === 'win32' ? 'py' : 'python3'), scriptPath = SCRIPT } = {}) {
  return new Promise((resolve, reject) => {
    const args = process.platform === 'win32' && pythonCommand.toLowerCase().endsWith('py') ? ['-3', scriptPath] : [scriptPath];
    const child = spawn(pythonCommand, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true, env: { ...process.env, PYTHONUNBUFFERED: '1' } });
    let stdout = '';
    let stderr = '';
    let settled = false;
    let terminationReason = '';
    let forceTimer;
    let resolveDone;
    const done = new Promise((doneResolve) => { resolveDone = doneResolve; });
    const entry = {
      child,
      done,
      cancel(reason, graceMs) {
        if (settled || terminationReason) return;
        terminationReason = reason;
        try { child.kill(); } catch { /* process already stopped */ }
        forceTimer = setTimeout(() => {
          try { child.kill('SIGKILL'); } catch { /* process already stopped */ }
        }, Math.max(100, graceMs));
        forceTimer.unref?.();
      }
    };
    activeProcesses.add(entry);
    const finish = (callback) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(forceTimer);
      activeProcesses.delete(entry);
      resolveDone();
      callback();
    };
    const timer = setTimeout(() => {
      terminationReason = `DSPy vượt quá thời gian chờ ${Math.round(timeoutMs / 1000)} giây.`;
      try { child.kill('SIGKILL'); } catch { /* process already stopped */ }
    }, timeoutMs);
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
      if (stdout.length > 2_000_000) {
        terminationReason = 'DSPy trả về stdout vượt giới hạn 2 MB.';
        try { child.kill('SIGKILL'); } catch { /* process already stopped */ }
      }
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      if (stderr.length > 200_000) {
        terminationReason = 'DSPy trả về stderr vượt giới hạn 200 KB.';
        try { child.kill('SIGKILL'); } catch { /* process already stopped */ }
      }
    });
    child.on('error', (error) => finish(() => reject(new Error(`Không khởi động được Python/DSPy: ${error.message}`))));
    child.on('close', (code) => finish(() => {
      if (terminationReason) return reject(new Error(terminationReason));
      if (code !== 0) return reject(new Error(stderr.trim() || `DSPy kết thúc với mã ${code}.`));
      try { resolve(JSON.parse(stdout)); } catch { reject(new Error('DSPy trả về dữ liệu không hợp lệ.')); }
    }));
    child.stdin.on('error', () => undefined);
    child.stdin.end(JSON.stringify(payload));
  });
}
