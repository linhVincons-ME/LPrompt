import { safeStorageGet, safeStorageSet } from '../utils/storage';

export type DeletionCollection = 'prompts' | 'versions';
const deletedThisSession: Record<DeletionCollection, Set<string>> = { prompts: new Set(), versions: new Set() };

function storageKey(collection: DeletionCollection): string {
  return `lprompt_pending_deletions_${collection}`;
}

export function pendingDeletionIds(collection: DeletionCollection): string[] {
  try {
    const parsed: unknown = JSON.parse(safeStorageGet(storageKey(collection)) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}

export function queueDeletion(collection: DeletionCollection, id: string): boolean {
  const saved = safeStorageSet(storageKey(collection), [...new Set([...pendingDeletionIds(collection), id])]);
  if (saved) deletedThisSession[collection].add(id);
  return saved;
}

export function withoutPendingDeletions<T extends { id: string }>(collection: DeletionCollection, records: T[]): T[] {
  const pending = new Set([...pendingDeletionIds(collection), ...deletedThisSession[collection]]);
  return records.filter((record) => !pending.has(record.id));
}

export async function flushDeletions(
  collection: DeletionCollection,
  remove: (id: string) => Promise<boolean>
): Promise<boolean> {
  let complete = true;
  for (const id of pendingDeletionIds(collection)) {
    try {
      if (!await remove(id)) {
        complete = false;
        continue;
      }
      if (!safeStorageSet(storageKey(collection), pendingDeletionIds(collection).filter((pendingId) => pendingId !== id))) complete = false;
    } catch {
      complete = false;
    }
  }
  return complete;
}
