export type PromptDomain = 'research' | 'image' | 'video' | 'code' | 'audio';

export type QualityTier = 'Xuất sắc' | 'Khá' | 'Trung bình' | 'Yếu';

export interface ScoreBreakdown {
  role_context: number;    // max 20
  task_clarity: number;    // max 25
  constraints: number;     // max 20
  output_format: number;   // max 20
  examples_specs: number;  // max 15
}

export interface PromptEvaluation {
  total_score: number;
  tier: QualityTier;
  breakdown: ScoreBreakdown;
  critique: {
    pros: string[];
    missing: string[];
  };
  improved_prompt: string;
  target_domain: PromptDomain;
  evaluated_at?: string;
  source: 'local' | 'gemini';
}

export interface SavedPrompt {
  id: string;
  title: string;
  domain: PromptDomain;
  original_prompt: string;
  improved_prompt: string;
  score: number;
  tier: QualityTier;
  tags: string[];
  created_at: string;
}

export interface GeminiConfig {
  apiKey: string;
  model: 'gemini-2.0-flash' | 'gemini-1.5-flash' | 'gemini-1.5-pro';
  temperature: number;
}

export interface PromptExecutionResult {
  output: string;
  latencyMs: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  estimatedCostUsd: number;
  modelUsed: string;
  executedAt: string;
  source: 'api' | 'simulation';
}

export type ExportLanguage = 'python' | 'typescript' | 'curl' | 'json';
