import { describe, expect, it, vi } from 'vitest';
import { exportPromptCode } from '../src/services/codeExporter';
import { generateGeminiContent, GeminiRequestError } from '../src/services/geminiClient';

describe('secret-safe export and Gemini client', () => {
  it('never emits the configured API key', () => {
    const config = { apiKey: 'VERY_SECRET_REAL_KEY', model: 'gemini-test', temperature: 0.2 };
    for (const language of ['python', 'typescript', 'curl', 'json'] as const) {
      const output = exportPromptCode('Hello', language, config);
      expect(output).not.toContain(config.apiKey);
    }
  });
  it('validates empty Gemini responses', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ candidates: [] }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
    await expect(generateGeminiContent('x', { apiKey: 'long-enough-test-key', model: 'test', temperature: 0 })).rejects.toMatchObject<Partial<GeminiRequestError>>({ code: 'INVALID_RESPONSE' });
  });
  it('honors external cancellation without hanging', async () => {
    vi.stubGlobal('fetch', vi.fn((_url, init: RequestInit) => new Promise((_resolve, reject) => init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))));
    const controller = new AbortController();
    const pending = generateGeminiContent('x', { apiKey: 'long-enough-test-key', model: 'test', temperature: 0 }, { signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toMatchObject<Partial<GeminiRequestError>>({ code: 'ABORTED' });
  });
});
