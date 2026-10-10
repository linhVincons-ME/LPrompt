import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { flushDeletions, pendingDeletionIds, queueDeletion, withoutPendingDeletions } from '../src/services/deletionOutbox';

describe('persistent deletion outbox', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value)
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('hides deleted server records while offline and retries idempotently', async () => {
    expect(queueDeletion('prompts', 'deleted')).toBe(true);
    queueDeletion('prompts', 'deleted');
    expect(await flushDeletions('prompts', async () => false)).toBe(false);
    expect(pendingDeletionIds('prompts')).toEqual(['deleted']);
    expect(withoutPendingDeletions('prompts', [{ id: 'deleted' }, { id: 'kept' }])).toEqual([{ id: 'kept' }]);
    expect(await flushDeletions('prompts', async () => true)).toBe(true);
    expect(pendingDeletionIds('prompts')).toEqual([]);
    expect(withoutPendingDeletions('prompts', [{ id: 'deleted' }])).toEqual([]);
  });

  it('retains failures and keeps new deletions queued during a retry', async () => {
    queueDeletion('versions', 'old');
    await flushDeletions('versions', async () => {
      queueDeletion('versions', 'new');
      return true;
    });
    expect(pendingDeletionIds('versions')).toEqual(['new']);
    expect(await flushDeletions('versions', async () => { throw new Error('offline'); })).toBe(false);
    expect(pendingDeletionIds('versions')).toEqual(['new']);
  });

  it('does not claim persistence when storage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined);
    expect(queueDeletion('prompts', 'deleted')).toBe(false);
  });
});
