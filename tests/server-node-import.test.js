import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';

describe('server modules plain Node import compatibility', () => {
  it('loads server modules directly in plain Node without transpilation runtime', () => {
    expect(() => {
      execFileSync(
        process.execPath,
        ['-e', "import('./server/mcpServer.js').then(m => { if (typeof m.evaluatePromptLocally !== 'function') process.exit(1); })"],
        { stdio: 'pipe' }
      );
    }).not.toThrow();
  });

  it('loads presetsData (re-exports a .ts module) in plain Node', () => {
    expect(() => {
      execFileSync(
        process.execPath,
        ['-e', "import('./server/presetsData.js').then(m => { if (!Array.isArray(m.FABRIC_PRESETS) || m.FABRIC_PRESETS.length === 0) process.exit(1); })"],
        { stdio: 'pipe' }
      );
    }).not.toThrow();
  });
});
