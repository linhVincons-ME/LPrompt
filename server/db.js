import { DatabaseSync } from 'node:sqlite';
import { createHash, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DATA_DIR = path.resolve(__dirname, '..', 'data');
const DB_FILE = process.env.LPROMPT_DB_FILE ? path.resolve(process.env.LPROMPT_DB_FILE) : path.join(DEFAULT_DATA_DIR, 'lprompt.db');
const DATA_DIR = process.env.LPROMPT_DB_FILE ? path.dirname(DB_FILE) : DEFAULT_DATA_DIR;
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');

fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
fs.mkdirSync(BACKUPS_DIR, { recursive: true });
const db = new DatabaseSync(DB_FILE);
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');

function parseJson(value, fallback) {
  if (!value) return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function addColumnIfMissing(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all().map((item) => item.name);
  if (!columns.includes(column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export function hashContent(content) {
  return createHash('sha256').update(String(content ?? ''), 'utf8').digest('hex');
}

function mapVersion(row) {
  return {
    id: row.id,
    versionNumber: row.version_number,
    commitMessage: row.commit_message,
    content: row.content,
    stage: row.stage,
    score: row.score ?? undefined,
    createdAt: row.created_at,
    branchName: row.branch_name || 'main',
    parentId: row.parent_id || undefined,
    mergeParentId: row.merge_parent_id || undefined,
    contentHash: row.content_hash || hashContent(row.content),
    promptId: row.prompt_id || undefined
  };
}

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, domain TEXT NOT NULL,
      original_prompt TEXT NOT NULL, improved_prompt TEXT NOT NULL,
      score REAL, tier TEXT, tags TEXT, created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS prompt_versions (
      id TEXT PRIMARY KEY, version_number TEXT NOT NULL, commit_message TEXT NOT NULL,
      content TEXT NOT NULL, stage TEXT NOT NULL, score REAL, created_at TEXT NOT NULL,
      branch_name TEXT NOT NULL DEFAULT 'main', parent_id TEXT, merge_parent_id TEXT,
      content_hash TEXT, prompt_id TEXT
    );
    CREATE TABLE IF NOT EXISTS test_suites (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, prompt_template TEXT NOT NULL,
      test_cases TEXT NOT NULL, last_summary TEXT, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS security_audits (
      id TEXT PRIMARY KEY, prompt_text TEXT NOT NULL, safety_score REAL NOT NULL,
      risk_level TEXT NOT NULL, checks TEXT NOT NULL, patched_prompt TEXT, evaluated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL
    );
  `);
  addColumnIfMissing('prompt_versions', 'branch_name', "TEXT NOT NULL DEFAULT 'main'");
  addColumnIfMissing('prompt_versions', 'parent_id', 'TEXT');
  addColumnIfMissing('prompt_versions', 'merge_parent_id', 'TEXT');
  addColumnIfMissing('prompt_versions', 'content_hash', 'TEXT');
  addColumnIfMissing('prompt_versions', 'prompt_id', 'TEXT');
  db.exec("UPDATE prompt_versions SET branch_name = 'main' WHERE branch_name IS NULL OR branch_name = ''");
  db.exec('CREATE INDEX IF NOT EXISTS idx_versions_branch_created ON prompt_versions(branch_name, created_at DESC)');
  console.log(`[LPrompt DB] SQLite initialized at: ${DB_FILE}`);
  autoBackupSnapshot();
}

export function getAllPrompts() {
  return db.prepare('SELECT * FROM prompts ORDER BY created_at DESC').all()
    .map((row) => ({ ...row, tags: parseJson(row.tags, []) }));
}

export function savePrompt(prompt) {
  if (!prompt || typeof prompt !== 'object') throw new TypeError('Prompt payload không hợp lệ.');
  for (const field of ['id', 'title', 'domain', 'original_prompt', 'improved_prompt']) {
    if (typeof prompt[field] !== 'string' || !prompt[field].trim()) throw new TypeError(`Thiếu trường prompt.${field}.`);
  }
  db.prepare(`
    INSERT INTO prompts (id, title, domain, original_prompt, improved_prompt, score, tier, tags, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET title=excluded.title, domain=excluded.domain,
      original_prompt=excluded.original_prompt, improved_prompt=excluded.improved_prompt,
      score=excluded.score, tier=excluded.tier, tags=excluded.tags
  `).run(
    prompt.id, prompt.title, prompt.domain, prompt.original_prompt, prompt.improved_prompt,
    Number.isFinite(prompt.score) ? prompt.score : 0, prompt.tier || 'Khá',
    JSON.stringify(prompt.tags || []), prompt.created_at || new Date().toISOString()
  );
  autoBackupSnapshot();
  return prompt;
}

export function deletePrompt(id) {
  db.prepare('DELETE FROM prompt_versions WHERE prompt_id = ?').run(id);
  const result = db.prepare('DELETE FROM prompts WHERE id = ?').run(id);
  autoBackupSnapshot();
  return { success: result.changes > 0, id };
}

export function getAllVersions(branchName) {
  const rows = branchName
    ? db.prepare('SELECT * FROM prompt_versions WHERE branch_name = ? ORDER BY created_at DESC').all(branchName)
    : db.prepare('SELECT * FROM prompt_versions ORDER BY created_at DESC').all();
  return rows.map(mapVersion);
}

export function saveVersion(version) {
  if (!version || typeof version !== 'object' || typeof version.content !== 'string' || !version.content.trim()) {
    throw new TypeError('Version phải có content không rỗng.');
  }
  const normalized = {
    id: version.id || `ver-${randomUUID()}`,
    versionNumber: version.versionNumber || version.version_number || `snapshot-${Date.now()}`,
    commitMessage: version.commitMessage || version.commit_message || 'Update prompt',
    content: version.content,
    stage: ['draft', 'testing', 'production'].includes(version.stage) ? version.stage : 'draft',
    score: Number.isFinite(version.score) ? version.score : 0,
    createdAt: version.createdAt || version.created_at || new Date().toISOString(),
    branchName: version.branchName || version.branch_name || 'main',
    parentId: version.parentId || version.parent_id || null,
    mergeParentId: version.mergeParentId || version.merge_parent_id || null,
    contentHash: version.contentHash || version.content_hash || hashContent(version.content),
    promptId: version.promptId || version.prompt_id || null
  };
  db.prepare(`
    INSERT INTO prompt_versions
      (id, version_number, commit_message, content, stage, score, created_at, branch_name, parent_id, merge_parent_id, content_hash, prompt_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET version_number=excluded.version_number,
      commit_message=excluded.commit_message, content=excluded.content, stage=excluded.stage,
      score=excluded.score, branch_name=excluded.branch_name, parent_id=excluded.parent_id,
      merge_parent_id=excluded.merge_parent_id, content_hash=excluded.content_hash, prompt_id=excluded.prompt_id
  `).run(
    normalized.id, normalized.versionNumber, normalized.commitMessage, normalized.content,
    normalized.stage, normalized.score, normalized.createdAt, normalized.branchName,
    normalized.parentId, normalized.mergeParentId, normalized.contentHash, normalized.promptId
  );
  autoBackupSnapshot();
  return normalized;
}

export function deleteVersion(id) {
  const result = db.prepare('DELETE FROM prompt_versions WHERE id = ?').run(id);
  autoBackupSnapshot();
  return { success: result.changes > 0, id };
}

export function getSetting(key) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? parseJson(row.value, null) : null;
}

export function setSetting(key, value) {
  db.prepare(`INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at`)
    .run(key, JSON.stringify(value), new Date().toISOString());
  autoBackupSnapshot();
  return value;
}

function getAllRows(table) {
  const allowed = new Set(['test_suites', 'security_audits', 'settings']);
  if (!allowed.has(table)) throw new Error('Invalid backup table.');
  return db.prepare(`SELECT * FROM ${table}`).all();
}

function collectBackupData() {
  return {
    schemaVersion: 3,
    exportedAt: new Date().toISOString(),
    prompts: getAllPrompts(),
    versions: getAllVersions(),
    testSuites: getAllRows('test_suites').map((row) => ({ ...row, test_cases: parseJson(row.test_cases, []), last_summary: parseJson(row.last_summary, null) })),
    securityAudits: getAllRows('security_audits').map((row) => ({ ...row, checks: parseJson(row.checks, []) })),
    settings: getAllRows('settings').map((row) => ({ ...row, value: parseJson(row.value, null) }))
  };
}

function writeJsonAtomic(targetPath, data) {
  const temporaryPath = `${targetPath}.${process.pid}.tmp`;
  fs.writeFileSync(temporaryPath, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(temporaryPath, targetPath);
}

const MAX_BACKUP_SNAPSHOTS = 10;
const SNAPSHOT_THROTTLE_MS = 60_000;
let lastBackupAt = 0;
let backupThrottleTimer = null;

function pruneOldBackups(keepCount = MAX_BACKUP_SNAPSHOTS) {
  try {
    const files = fs.readdirSync(BACKUPS_DIR)
      .filter((file) => file.startsWith('lprompt_snapshot_') && file.endsWith('.json'))
      .map((file) => {
        const fullPath = path.join(BACKUPS_DIR, file);
        return { file, fullPath, mtime: fs.statSync(fullPath).mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);

    if (files.length > keepCount) {
      for (const item of files.slice(keepCount)) {
        try { fs.unlinkSync(item.fullPath); } catch {}
      }
    }
  } catch (error) {
    console.warn('[LPrompt DB] Prune backups warning:', error instanceof Error ? error.message : error);
  }
}

export function autoBackupSnapshot(force = false) {
  const now = Date.now();
  if (!force && now - lastBackupAt < SNAPSHOT_THROTTLE_MS) {
    if (!backupThrottleTimer) {
      backupThrottleTimer = setTimeout(() => {
        backupThrottleTimer = null;
        autoBackupSnapshot(true);
      }, SNAPSHOT_THROTTLE_MS);
      backupThrottleTimer.unref?.();
    }
    return null;
  }

  if (backupThrottleTimer) {
    clearTimeout(backupThrottleTimer);
    backupThrottleTimer = null;
  }
  lastBackupAt = now;

  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const backupFile = path.join(BACKUPS_DIR, `lprompt_snapshot_${today}.json`);
    writeJsonAtomic(backupFile, collectBackupData());
    pruneOldBackups();
    return backupFile;
  } catch (error) {
    console.warn('[LPrompt DB] Backup snapshot warning:', error instanceof Error ? error.message : error);
    return null;
  }
}

export function exportFullBackup() {
  const data = collectBackupData();
  const filename = `lprompt_full_backup_${Date.now()}.json`;
  const fullPath = path.join(BACKUPS_DIR, filename);
  writeJsonAtomic(fullPath, data);
  return { success: true, filename, path: fullPath, data };
}

export function closeDatabase() {
  if (backupThrottleTimer) {
    clearTimeout(backupThrottleTimer);
    backupThrottleTimer = null;
    autoBackupSnapshot(true);
  }
  try { db.close(); } catch (error) {
    if (!String(error?.message || error).includes('not open')) throw error;
  }
}

export { db, DB_FILE, DATA_DIR, BACKUPS_DIR };
