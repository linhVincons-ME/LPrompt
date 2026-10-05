import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data paths directly inside the app folder for 100% portable embedded persistence
const DATA_DIR = path.resolve(__dirname, '..', 'data');
const BACKUPS_DIR = path.join(DATA_DIR, 'backups');
const DB_FILE = path.join(DATA_DIR, 'lprompt.db');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Initialize SQLite database
const db = new DatabaseSync(DB_FILE);

// Run initial migration schemas
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      domain TEXT NOT NULL,
      original_prompt TEXT NOT NULL,
      improved_prompt TEXT NOT NULL,
      score REAL,
      tier TEXT,
      tags TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS prompt_versions (
      id TEXT PRIMARY KEY,
      version_number TEXT NOT NULL,
      commit_message TEXT NOT NULL,
      content TEXT NOT NULL,
      stage TEXT NOT NULL,
      score REAL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS test_suites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      prompt_template TEXT NOT NULL,
      test_cases TEXT NOT NULL,
      last_summary TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS security_audits (
      id TEXT PRIMARY KEY,
      prompt_text TEXT NOT NULL,
      safety_score REAL NOT NULL,
      risk_level TEXT NOT NULL,
      checks TEXT NOT NULL,
      patched_prompt TEXT,
      evaluated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  console.log(`[LPrompt DB] Embedded SQLite initialized at: ${DB_FILE}`);
  autoBackupSnapshot();
}

// ==================== PROMPTS CRUD ====================

export function getAllPrompts() {
  const stmt = db.prepare('SELECT * FROM prompts ORDER BY created_at DESC');
  const rows = stmt.all();
  return rows.map((r) => ({
    ...r,
    tags: r.tags ? JSON.parse(r.tags) : []
  }));
}

export function savePrompt(prompt) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO prompts (id, title, domain, original_prompt, improved_prompt, score, tier, tags, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    prompt.id,
    prompt.title,
    prompt.domain,
    prompt.original_prompt,
    prompt.improved_prompt,
    prompt.score ?? 0,
    prompt.tier ?? 'Khá',
    JSON.stringify(prompt.tags || []),
    prompt.created_at || new Date().toISOString()
  );
  return prompt;
}

export function deletePrompt(id) {
  const stmt = db.prepare('DELETE FROM prompts WHERE id = ?');
  stmt.run(id);
  return { success: true, id };
}

// ==================== VERSIONS CRUD ====================

export function getAllVersions() {
  const stmt = db.prepare('SELECT * FROM prompt_versions ORDER BY created_at DESC');
  return stmt.all();
}

export function saveVersion(version) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO prompt_versions (id, version_number, commit_message, content, stage, score, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    version.id,
    version.versionNumber || version.version_number,
    version.commitMessage || version.commit_message,
    version.content,
    version.stage,
    version.score ?? 0,
    version.createdAt || version.created_at || new Date().toISOString()
  );
  return version;
}

export function deleteVersion(id) {
  const stmt = db.prepare('DELETE FROM prompt_versions WHERE id = ?');
  stmt.run(id);
  return { success: true, id };
}

// ==================== SETTINGS CRUD ====================

export function getSetting(key) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const row = stmt.get(key);
  return row ? JSON.parse(row.value) : null;
}

export function setSetting(key, val) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO settings (key, value, updated_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(key, JSON.stringify(val), new Date().toISOString());
  return val;
}

// ==================== BACKUP & SNAPSHOT ====================

export function autoBackupSnapshot() {
  try {
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const backupFile = path.join(BACKUPS_DIR, `lprompt_snapshot_${today}.json`);
    
    // Only snapshot if not already done today
    if (!fs.existsSync(backupFile)) {
      const data = {
        exportedAt: new Date().toISOString(),
        prompts: getAllPrompts(),
        versions: getAllVersions(),
      };
      fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`[LPrompt DB] Daily automated snapshot created: ${backupFile}`);
    }
  } catch (err) {
    console.warn('[LPrompt DB] Backup snapshot warning:', err.message);
  }
}

export function exportFullBackup() {
  const data = {
    exportedAt: new Date().toISOString(),
    prompts: getAllPrompts(),
    versions: getAllVersions()
  };
  const filename = `lprompt_full_backup_${Date.now()}.json`;
  const fullPath = path.join(BACKUPS_DIR, filename);
  fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8');
  return { success: true, filename, path: fullPath, data };
}

export { db, DB_FILE, DATA_DIR, BACKUPS_DIR };
