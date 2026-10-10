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
});
