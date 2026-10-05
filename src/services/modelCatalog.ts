export interface GeminiModelDefinition {
  id: string;
  label: string;
  description: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  recommended?: boolean;
  preview?: boolean;
}

/**
 * Central model registry. Keep model identifiers in one place so UI, execution,
 * exporters, presets and cost estimation cannot silently drift apart.
 */
export const GEMINI_MODELS: GeminiModelDefinition[] = [
  {
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash',
    description: 'Model Flash hiện hành cho tác vụ tổng quát và PromptOps.',
    inputUsdPerMillion: 0.75,
    outputUsdPerMillion: 3.75,
    recommended: true
  },
  {
    id: 'gemini-3.5-flash-lite',
    label: 'Gemini 3.5 Flash-Lite',
    description: 'Chi phí thấp cho batch evaluation và tác vụ nhẹ.',
    inputUsdPerMillion: 0.3,
    outputUsdPerMillion: 2.5
  },
  {
    id: 'gemini-3.1-pro-preview',
    label: 'Gemini 3.1 Pro Preview',
    description: 'Suy luận chuyên sâu; preview nên cần cơ chế fallback.',
    inputUsdPerMillion: 2,
    outputUsdPerMillion: 12,
    preview: true
  }
];

export const DEFAULT_GEMINI_MODEL = GEMINI_MODELS.find((model) => model.recommended)?.id ?? GEMINI_MODELS[0].id;

export function getGeminiModel(modelId: string): GeminiModelDefinition {
  return GEMINI_MODELS.find((model) => model.id === modelId) ?? GEMINI_MODELS[0];
}

export function estimateGeminiCost(modelId: string, inputTokens: number, outputTokens: number): number {
  const model = getGeminiModel(modelId);
  const total = (inputTokens / 1_000_000) * model.inputUsdPerMillion
    + (outputTokens / 1_000_000) * model.outputUsdPerMillion;
  return Number(total.toFixed(6));
}
