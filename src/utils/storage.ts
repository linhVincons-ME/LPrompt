export function safeStorageGet(key: string): string | null {
  try { return globalThis.localStorage?.getItem(key) ?? null; } catch { return null; }
}

export function safeStorageSet(key: string, value: unknown): boolean {
  try {
    globalThis.localStorage?.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    return true;
  } catch { return false; }
}

export function safeStorageRemove(key: string): void {
  try { globalThis.localStorage?.removeItem(key); } catch { /* unavailable or read-only storage */ }
}
