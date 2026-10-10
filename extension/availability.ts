export type TransientFailureKind = 'overloaded' | 'rate_limited' | 'temporarily_unavailable';

export interface TransientFailure {
  kind: TransientFailureKind;
  message: string;
}

export interface AvailabilityState {
  failure: TransientFailure;
  consecutiveFailures: number;
  detectedAt: number;
  retryAt: number;
}

const FAILURE_PATTERNS: Array<{ kind: TransientFailureKind; pattern: RegExp }> = [
  {
    kind: 'overloaded',
    pattern: /high demand|spikes? in demand|(?:hệ thống|máy chủ|gemini).{0,20}quá tải|lưu lượng (?:truy cập )?(?:đang )?cao/i
  },
  {
    kind: 'rate_limited',
    pattern: /too many requests|rate limit|resource exhausted|\b429\b|quá nhiều yêu cầu|vượt quá giới hạn (?:tốc độ|yêu cầu)/i
  },
  {
    kind: 'temporarily_unavailable',
    pattern: /temporarily unavailable|service unavailable|try again later|please try again|(?:dịch vụ )?tạm thời không khả dụng|vui lòng thử lại sau/i
  }
];

export function classifyTransientFailure(text: string): TransientFailure | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  const match = FAILURE_PATTERNS.find((candidate) => candidate.pattern.test(normalized));
  return match ? { kind: match.kind, message: normalized.slice(0, 500) } : null;
}

export function getCooldownMs(consecutiveFailures: number): number {
  const safeCount = Math.max(1, Math.min(Math.trunc(consecutiveFailures) || 1, 4));
  return Math.min(15_000 * 2 ** (safeCount - 1), 120_000);
}

export function recordTransientFailure(
  previous: AvailabilityState | null,
  failure: TransientFailure,
  now = Date.now()
): AvailabilityState {
  if (previous && previous.failure.kind === failure.kind && previous.failure.message === failure.message && now - previous.detectedAt < 10_000) {
    return previous;
  }
  const stillRelated = previous && now - previous.detectedAt < 10 * 60_000;
  const consecutiveFailures = stillRelated ? previous.consecutiveFailures + 1 : 1;
  return {
    failure,
    consecutiveFailures,
    detectedAt: now,
    retryAt: now + getCooldownMs(consecutiveFailures)
  };
}
