import type { SavedPrompt, PromptVersion } from '../types';

function getApiBase(): string {
  const configured = import.meta.env.VITE_LPROMPT_API_BASE?.trim();
  if (configured) return configured.replace(/\/$/, '');
  if (typeof window !== 'undefined' && window.location.port === '8484') return '';
  return 'http://127.0.0.1:8484';
}
const API_BASE = getApiBase();

async function apiFetch(path: string, init: RequestInit = {}, timeoutMs = 3000): Promise<Response> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal });
  } finally {
    globalThis.clearTimeout(timeout);
  }
}

function normalizeVersion(value: Record<string, unknown>): PromptVersion {
  return {
    id: String(value.id ?? ''),
    versionNumber: String(value.versionNumber ?? value.version_number ?? ''),
    commitMessage: String(value.commitMessage ?? value.commit_message ?? ''),
    content: String(value.content ?? ''),
    stage: value.stage === 'testing' || value.stage === 'production' ? value.stage : 'draft',
    score: typeof value.score === 'number' ? value.score : undefined,
    createdAt: String(value.createdAt ?? value.created_at ?? new Date(0).toISOString()),
    branchName: String(value.branchName ?? value.branch_name ?? 'main'),
    parentId: value.parentId || value.parent_id ? String(value.parentId ?? value.parent_id) : undefined,
    mergeParentId: value.mergeParentId || value.merge_parent_id ? String(value.mergeParentId ?? value.merge_parent_id) : undefined,
    contentHash: String(value.contentHash ?? value.content_hash ?? ''),
    promptId: value.promptId || value.prompt_id ? String(value.promptId ?? value.prompt_id) : undefined
  };
}

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
    const res = await apiFetch('/health', {}, 1500);
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
    const res = await apiFetch('/api/prompts');
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
    const res = await apiFetch('/api/prompts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
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
    const res = await apiFetch(`/api/prompts/${encodeURIComponent(id)}`, {
      method: 'DELETE'
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
    const res = await apiFetch('/api/versions');
    if (res.ok) {
      const json = await res.json();
      return Array.isArray(json.data) ? json.data.map((item: Record<string, unknown>) => normalizeVersion(item)) : [];
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
    const res = await apiFetch('/api/versions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(version)
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
    const res = await apiFetch(`/api/versions/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function sendDraftToExtension(source: string): Promise<boolean> {
  if (!source.trim()) return false;
  try {
    const res = await apiFetch('/api/extension/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source })
    });
    return res.ok;
  } catch {
    return false;
  }
}
