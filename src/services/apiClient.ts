import type { SavedPrompt, PromptVersion } from '../types';

const API_BASE = 'http://localhost:8484';

export interface ServiceHealth {
  online: boolean;
  port?: number;
  memoryMb?: number;
  uptimeSeconds?: number;
  dbPath?: string;
  storageType?: string;
}

/**
 * Check if the background LPrompt Service is running
 */
export async function checkServiceHealth(): Promise<ServiceHealth> {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      return {
        online: true,
        port: data.port,
        memoryMb: data.memoryRssMb,
        uptimeSeconds: data.uptimeSeconds,
        dbPath: data.database,
        storageType: data.storageType
      };
    }
  } catch {
    // Service offline, fallback to local storage
  }
  return { online: false };
}

/**
 * Fetch prompts from embedded SQLite service (falls back to null if offline)
 */
export async function fetchServerPrompts(): Promise<SavedPrompt[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/prompts`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch {
    // Offline
  }
  return null;
}

/**
 * Save prompt to embedded SQLite service
 */
export async function saveServerPrompt(prompt: SavedPrompt): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt),
      signal: AbortSignal.timeout(2000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Delete prompt from embedded SQLite service
 */
export async function deleteServerPrompt(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/prompts/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(2000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetch versions from embedded SQLite service
 */
export async function fetchServerVersions(): Promise<PromptVersion[] | null> {
  try {
    const res = await fetch(`${API_BASE}/api/versions`, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const json = await res.json();
      return json.data || [];
    }
  } catch {
    // Offline
  }
  return null;
}

/**
 * Save version to embedded SQLite service
 */
export async function saveServerVersion(version: PromptVersion): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/versions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(version),
      signal: AbortSignal.timeout(2000)
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Delete version from embedded SQLite service
 */
export async function deleteServerVersion(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/versions/${id}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(2000)
    });
    return res.ok;
  } catch {
    return false;
  }
}
