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
  source: 'local';
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

export interface PromptExecutionResult {
  output: string;
  latencyMs: number;
  tokens: {
    input: number;
    output: number;
    total: number;
  };
  executedAt: string;
  source: 'local-preview';
}

export type ExportLanguage = 'markdown' | 'text' | 'json';

// ==========================================
// V1.2 PROMPTOPS, VERSIONING & RED-TEAMING
// ==========================================

export type VersionStage = 'draft' | 'testing' | 'production';

export interface PromptVersion {
  id: string;
  versionNumber: string; // e.g. "v1.0", "v1.1", "v2.0"
  content: string;
  commitMessage: string;
  stage: VersionStage;
  score?: number;
  createdAt: string;
  branchName: string;
  parentId?: string;
  mergeParentId?: string;
  contentHash: string;
  promptId?: string;
}

export interface SecurityCheckItem {
  id: string;
  category: string;
  title: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
  recommendation: string;
}

export interface RedTeamSecurityReport {
  safetyScore: number; // 0 - 100
  riskLevel: 'An toàn' | 'Rủi ro trung bình' | 'Nguy cơ cao';
  checks: SecurityCheckItem[];
  patchedPrompt?: string;
  evaluatedAt: string;
  attackResults?: SecurityAttackResult[];
  dynamicPassRate?: number;
  mode?: 'static' | 'dynamic';
}

export interface SecurityAttackResult {
  id: string;
  category: string;
  payload: string;
  status: 'pass' | 'fail' | 'error';
  output?: string;
  reason: string;
  latencyMs?: number;
}

export interface DiffToken {
  type: 'added' | 'removed' | 'unchanged';
  value: string;
}

// ==========================================
// V2.0 BATCH EVALS, LOCAL FEW-SHOT & PRESET HUB
// ==========================================

export interface FewShotExample {
  id: string;
  input: string;
  output: string;
  explanation?: string;
}

export interface FewShotSynthesisResult {
  examples: FewShotExample[];
  integratedPrompt: string;
}

export type AssertionType = 'contains' | 'not_contains' | 'regex' | 'min_length';

export interface TestCase {
  id: string;
  name: string;
  variables: Record<string, string>;
  assertionType: AssertionType;
  expectedValue: string;
}

export interface TestCaseRunResult {
  testCaseId: string;
  testCaseName: string;
  status: 'pass' | 'fail' | 'error';
  actualOutput: string;
  latencyMs: number;
  tokensUsed?: number;
  reason?: string;
}

export interface BatchEvaluationSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  passRate: number; // 0 - 100
  avgLatencyMs: number;
  results: TestCaseRunResult[];
}

export interface FabricPreset {
  id: string;
  title: string;
  category: 'business' | 'engineering' | 'copywriting' | 'multimodal' | 'research';
  description: string;
  prompt: string;
  tags: string[];
}
