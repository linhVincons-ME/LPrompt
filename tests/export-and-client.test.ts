import { describe, expect, it } from 'vitest';
import { exportPromptCode } from '../src/services/codeExporter';

describe('provider-neutral prompt export', () => {
  it('exports only local prompt artifacts without API wiring', () => {
    for (const language of ['markdown', 'text', 'json'] as const) {
      const output = exportPromptCode('Hello', language);
      expect(output).toContain('Hello');
      expect(output).not.toMatch(/api.?key|generativelanguage|google-genai|@google\/genai/i);
    }
  });
});
