import { z } from 'zod';
import type { GeminiConfig } from '../types';
import { DEFAULT_GEMINI_MODEL } from './modelCatalog';

const geminiResponseSchema = z.object({
  candidates: z.array(z.object({
    content: z.object({
      parts: z.array(z.object({ text: z.string().optional() })).optional()
    }).optional()
  })).optional(),
  usageMetadata: z.object({
    promptTokenCount: z.number().optional(),
    candidatesTokenCount: z.number().optional(),
    totalTokenCount: z.number().optional()
  }).optional()
}).passthrough();

export class GeminiRequestError extends Error {
  readonly code: 'CONFIG' | 'TIMEOUT' | 'NETWORK' | 'HTTP' | 'INVALID_RESPONSE' | 'ABORTED';
  readonly status?: number;

  constructor(
    message: string,
    code: 'CONFIG' | 'TIMEOUT' | 'NETWORK' | 'HTTP' | 'INVALID_RESPONSE' | 'ABORTED',
    status?: number
  ) {
    super(message);
    this.name = 'GeminiRequestError';
    this.code = code;
    this.status = status;
  }
}

export interface GeminiGenerateOptions {
  responseMimeType?: 'application/json' | 'text/plain';
  temperature?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

export interface GeminiGenerateResult {
  text: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

function mergeAbortSignals(timeoutMs: number, external?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(new DOMException('Timeout', 'TimeoutError')), timeoutMs);
  const onAbort = () => controller.abort(external?.reason);
  external?.addEventListener('abort', onAbort, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      globalThis.clearTimeout(timeout);
      external?.removeEventListener('abort', onAbort);
    }
  };
}

export async function generateGeminiContent(
  prompt: string,
  config: GeminiConfig,
  options: GeminiGenerateOptions = {}
): Promise<GeminiGenerateResult> {
  if (!config.apiKey?.trim()) {
    throw new GeminiRequestError('Chưa cấu hình Gemini API Key.', 'CONFIG');
  }

  const model = config.model || DEFAULT_GEMINI_MODEL;
  const timeoutMs = options.timeoutMs ?? config.timeoutMs ?? 30_000;
  const { signal, cleanup } = mergeAbortSignals(timeoutMs, options.signal);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.apiKey.trim()
        },
        signal,
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options.temperature ?? config.temperature ?? 0.2,
            ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {})
          }
        })
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as { error?: { message?: string } };
      throw new GeminiRequestError(
        errorData.error?.message || `Gemini API trả về HTTP ${response.status}.`,
        'HTTP',
        response.status
      );
    }

    const parsed = geminiResponseSchema.safeParse(await response.json());
    if (!parsed.success) {
      throw new GeminiRequestError('Gemini trả về response không đúng schema.', 'INVALID_RESPONSE');
    }

    const text = parsed.data.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? '')
      .join('')
      .trim();
    if (!text) {
      throw new GeminiRequestError('Gemini không trả về nội dung.', 'INVALID_RESPONSE');
    }

    const inputTokens = parsed.data.usageMetadata?.promptTokenCount ?? Math.ceil(prompt.length / 4);
    const outputTokens = parsed.data.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4);
    return {
      text,
      model,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens: parsed.data.usageMetadata?.totalTokenCount ?? inputTokens + outputTokens
      }
    };
  } catch (error) {
    if (error instanceof GeminiRequestError) throw error;
    if (signal.aborted) {
      const externalAbort = options.signal?.aborted;
      throw new GeminiRequestError(
        externalAbort ? 'Yêu cầu Gemini đã bị hủy.' : `Gemini không phản hồi sau ${Math.round(timeoutMs / 1000)} giây.`,
        externalAbort ? 'ABORTED' : 'TIMEOUT'
      );
    }
    throw new GeminiRequestError(
      error instanceof Error ? error.message : 'Không thể kết nối Gemini API.',
      'NETWORK'
    );
  } finally {
    cleanup();
  }
}

export function parseGeminiJson<T>(text: string, schema: z.ZodType<T>): T {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
  let value: unknown;
  try {
    value = JSON.parse(cleaned);
  } catch {
    throw new GeminiRequestError('Gemini trả về JSON không hợp lệ.', 'INVALID_RESPONSE');
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) {
    throw new GeminiRequestError(`Dữ liệu Gemini thiếu trường bắt buộc: ${parsed.error.issues[0]?.message ?? 'schema mismatch'}.`, 'INVALID_RESPONSE');
  }
  return parsed.data;
}
