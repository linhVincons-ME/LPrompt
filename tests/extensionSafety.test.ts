import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const manifest = JSON.parse(readFileSync(new URL('../extension/public/manifest.json', import.meta.url), 'utf8')) as {
  permissions: string[];
  host_permissions: string[];
  side_panel: { default_path: string };
};
const firefoxManifest = JSON.parse(readFileSync(new URL('../extension/public-firefox/manifest.json', import.meta.url), 'utf8')) as {
  permissions: string[];
  host_permissions: string[];
  sidebar_action: { default_panel: string };
  browser_specific_settings: { gecko: { id: string } };
};
const contentScript = readFileSync(new URL('../extension/contentScript.ts', import.meta.url), 'utf8');
const serviceWorker = readFileSync(new URL('../extension/serviceWorker.ts', import.meta.url), 'utf8');

describe('extension safety contract', () => {
  it('limits host access to Gemini and the loopback bridge without broad site access', () => {
    expect(manifest.host_permissions).toEqual(['https://gemini.google.com/*', 'http://127.0.0.1:8484/*']);
    expect(manifest.permissions).toEqual(['sidePanel', 'storage', 'contextMenus']);
    expect(manifest.permissions).not.toContain('cookies');
    expect(manifest.host_permissions).not.toContain('<all_urls>');

    expect(firefoxManifest.host_permissions).toEqual(['https://gemini.google.com/*', 'http://127.0.0.1:8484/*']);
    expect(firefoxManifest.permissions).toEqual(['storage', 'contextMenus']);
    expect(firefoxManifest.permissions).not.toContain('cookies');
    expect(firefoxManifest.host_permissions).not.toContain('<all_urls>');
  });

  it('does not implement automatic submit behavior', () => {
    expect(contentScript).not.toMatch(/\.click\s*\(/);
    expect(contentScript).not.toMatch(/requestSubmit|\.submit\s*\(/);
    expect(manifest.side_panel.default_path).toBe('extension/sidepanel.html');
    expect(firefoxManifest.sidebar_action.default_panel).toBe('extension/sidepanel.html');
  });

  it('keeps the content script self-contained for classic MV3 injection', () => {
    expect(contentScript).not.toMatch(/^import\s/m);
    expect(contentScript).toContain('classifyTransientFailure');
  });

  it('imports only explicit user selection through the context menu', () => {
    expect(serviceWorker).toContain("contexts: ['selection']");
    expect(serviceWorker).toContain('info.selectionText');
    expect(manifest.permissions).not.toContain('scripting');
    expect(firefoxManifest.permissions).not.toContain('scripting');
  });

  it('integrates construction prompt compiler into the extension panel', () => {
    const extensionPanel = readFileSync(new URL('../extension/ExtensionPanel.tsx', import.meta.url), 'utf8');
    expect(extensionPanel).toContain('compileConstructionPrompt');
    expect(extensionPanel).toContain('Prompt thi công công trình');
    expect(extensionPanel).toContain('lpromptConstructionDraft');
    expect(extensionPanel).toContain('insertConstruction');
    expect(extensionPanel).toContain('constructionReferenceFiles');
    expect(contentScript).toContain('DataTransfer');
    expect(contentScript).toContain('attachReferenceImages');
  });
});
