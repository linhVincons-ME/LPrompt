import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync(new URL('../extension/public/manifest.json', import.meta.url), 'utf8')) as {
  permissions: string[];
  host_permissions: string[];
  side_panel: { default_path: string };
};
const contentScript = readFileSync(new URL('../extension/contentScript.ts', import.meta.url), 'utf8');

describe('extension safety contract', () => {
  it('limits host access to Gemini and avoids broad tab/cookie permissions', () => {
    expect(manifest.host_permissions).toEqual(['https://gemini.google.com/*']);
    expect(manifest.permissions).toEqual(['sidePanel', 'storage']);
    expect(manifest.permissions).not.toContain('cookies');
  });

  it('does not implement automatic submit behavior', () => {
    expect(contentScript).not.toMatch(/\.click\s*\(/);
    expect(contentScript).not.toMatch(/requestSubmit|\.submit\s*\(/);
    expect(manifest.side_panel.default_path).toBe('extension/sidepanel.html');
  });

  it('keeps the content script self-contained for classic MV3 injection', () => {
    expect(contentScript).not.toMatch(/^import\s/m);
    expect(contentScript).toContain('classifyTransientFailure');
  });
});
