import { describe, expect, it } from 'vitest';
import { runDspyOptimizer } from '../server/dspyRunner.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const hangFixture = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'hang.js');

describe('DSPy process boundary', () => {
  it('reports a missing Python executable instead of hanging', async () => {
    await expect(runDspyOptimizer({}, { pythonCommand: 'definitely-not-a-real-python-command', timeoutMs: 1000 })).rejects.toThrow('Không khởi động được Python/DSPy');
  });
  it('kills an optimizer process at the configured deadline', async () => {
    await expect(runDspyOptimizer({}, { timeoutMs: 30, pythonCommand: process.execPath, scriptPath: hangFixture })).rejects.toThrow('DSPy vượt quá thời gian chờ');
  });
});
