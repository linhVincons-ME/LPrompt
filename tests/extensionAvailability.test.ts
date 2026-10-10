import { describe, expect, it } from 'vitest';
import { classifyTransientFailure, getCooldownMs, recordTransientFailure } from '../extension/availability';

describe('extension overload protection', () => {
  it('classifies high demand, rate limit and temporary outage messages', () => {
    expect(classifyTransientFailure('This model is currently experiencing high demand. Please try again later.')?.kind).toBe('overloaded');
    expect(classifyTransientFailure('429 Too many requests')?.kind).toBe('rate_limited');
    expect(classifyTransientFailure('Service temporarily unavailable')?.kind).toBe('temporarily_unavailable');
    expect(classifyTransientFailure('Hệ thống đang quá tải, vui lòng thử lại sau.')?.kind).toBe('overloaded');
    expect(classifyTransientFailure('A normal model response')).toBeNull();
    expect(classifyTransientFailure('Dây cáp bị quá tải phát nhiệt. Thử lại sau khi kiểm tra điện trở.')).toBeNull();
  });

  it('uses bounded exponential cooldowns', () => {
    expect([1, 2, 3, 4, 5].map(getCooldownMs)).toEqual([15_000, 30_000, 60_000, 120_000, 120_000]);
  });

  it('deduplicates the same DOM notification and resets stale failure chains', () => {
    const failure = classifyTransientFailure('This model is currently experiencing high demand.')!;
    const first = recordTransientFailure(null, failure, 1_000);
    expect(recordTransientFailure(first, failure, 5_000)).toBe(first);
    expect(recordTransientFailure(first, failure, 12_000).consecutiveFailures).toBe(2);
    expect(recordTransientFailure(first, failure, 700_000).consecutiveFailures).toBe(1);
  });
});
