// @vitest-environment jsdom
import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { ExtensionPanel } from '../extension/ExtensionPanel';

describe('ExtensionPanel compilation and selection import lifecycle', () => {
  let storageData: Record<string, unknown> = {};
  let storageListeners: Array<(changes: Record<string, unknown>, area: string) => void> = [];
  let messageListeners: Array<(message: unknown) => void> = [];

  beforeEach(() => {
    storageData = {};
    storageListeners = [];
    messageListeners = [];

    // Mock URL.createObjectURL for jsdom
    if (!globalThis.URL.createObjectURL) {
      globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock');
      globalThis.URL.revokeObjectURL = vi.fn();
    }

    // Mock fetch for bridge polling (returns 204 no content)
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: () => Promise.resolve({})
    });

    (globalThis as unknown as { chrome: unknown }).chrome = {
      storage: {
        local: {
          get: vi.fn((keys: unknown) => {
            if (Array.isArray(keys)) {
              const res: Record<string, unknown> = {};
              keys.forEach((k) => { res[k] = storageData[k]; });
              return Promise.resolve(res);
            }
            if (typeof keys === 'string') {
              return Promise.resolve({ [keys]: storageData[keys] });
            }
            return Promise.resolve({ ...storageData });
          }),
          set: vi.fn((items: Record<string, unknown>) => {
            const changes: Record<string, unknown> = {};
            for (const [k, v] of Object.entries(items)) {
              changes[k] = { oldValue: storageData[k], newValue: v };
              storageData[k] = v;
            }
            // Trigger storage.onChanged listeners synchronously like real Chrome
            storageListeners.forEach((listener) => listener(changes, 'local'));
            return Promise.resolve();
          })
        },
        onChanged: {
          addListener: vi.fn((cb) => storageListeners.push(cb)),
          removeListener: vi.fn((cb) => {
            const idx = storageListeners.indexOf(cb);
            if (idx !== -1) storageListeners.splice(idx, 1);
          })
        }
      },
      runtime: {
        onMessage: {
          addListener: vi.fn((cb) => messageListeners.push(cb)),
          removeListener: vi.fn((cb) => {
            const idx = messageListeners.indexOf(cb);
            if (idx !== -1) messageListeners.splice(idx, 1);
          })
        },
        sendMessage: vi.fn(() => Promise.resolve())
      },
      tabs: {
        query: vi.fn(() => Promise.resolve([{ id: 101, url: 'https://gemini.google.com/app' }])),
        sendMessage: vi.fn(() => Promise.resolve({ ok: true }))
      }
    };
  });

  afterEach(() => {
    cleanup();
  });

  it('keeps the compiled prompt visible after clicking Compile without being wiped by storage onChanged', async () => {
    render(<ExtensionPanel />);

    // Wait for initial storage load
    const textarea = await screen.findByPlaceholderText(/Mô tả điều bạn muốn Gemini thực hiện/i);
    fireEvent.change(textarea, { target: { value: 'Viết kế hoạch kiểm tra tuyến cáp điện hạ thế 0.4kV.' } });

    // Click Compile
    const compileButton = screen.getByRole('button', { name: /Biên dịch/i });
    fireEvent.click(compileButton);

    // After compile, saveDraft will have written to lpromptDraft and fired onChanged.
    // The compiled result must remain visible on screen!
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Chèn vào Gemini/i })).toBeTruthy();
      expect(screen.getByRole('button', { name: /Sao chép/i })).toBeTruthy();
    });

    // The compiled prompt textarea should contain the compiled sections
    const textareas = screen.getAllByRole('textbox');
    const compiledTextarea = textareas.find((el) => (el as HTMLTextAreaElement).value.includes('[VAI TRÒ]'));
    expect(compiledTextarea).toBeTruthy();
    expect((compiledTextarea as HTMLTextAreaElement).value).toContain('Viết kế hoạch kiểm tra tuyến cáp điện hạ thế 0.4kV.');
  });

  it('imports selection text via dedicated lpromptSelectionImport and deduplicates', async () => {
    render(<ExtensionPanel />);

    const textarea = await screen.findByPlaceholderText(/Mô tả điều bạn muốn Gemini thực hiện/i) as HTMLTextAreaElement;

    // Simulate context menu import via storage
    const importPayload = { id: 'import-uuid-123', source: 'Đoạn văn bản mẫu được chọn từ trang web', at: Date.now() };
    const changes = {
      lpromptSelectionImport: { oldValue: undefined, newValue: importPayload }
    };
    storageListeners.forEach((l) => l(changes, 'local'));

    await waitFor(() => {
      expect(textarea.value).toBe('Đoạn văn bản mẫu được chọn từ trang web');
    });

    // Fire duplicate event with same ID; should be ignored without state flicker
    storageListeners.forEach((l) => l(changes, 'local'));
    expect(textarea.value).toBe('Đoạn văn bản mẫu được chọn từ trang web');
  });
});
