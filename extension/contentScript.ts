type TransientFailure = {
  kind: 'overloaded' | 'rate_limited' | 'temporarily_unavailable';
  message: string;
};

function classifyTransientFailure(text: string): TransientFailure | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  const patterns: Array<{ kind: TransientFailure['kind']; pattern: RegExp }> = [
    { kind: 'overloaded', pattern: /high demand|spikes? in demand|quá tải|lưu lượng (?:đang )?cao/i },
    { kind: 'rate_limited', pattern: /too many requests|rate limit|resource exhausted|\b429\b|quá nhiều yêu cầu|giới hạn (?:tốc độ|yêu cầu)/i },
    { kind: 'temporarily_unavailable', pattern: /temporarily unavailable|service unavailable|try again later|please try again|tạm thời không khả dụng|thử lại sau/i }
  ];
  const match = patterns.find((candidate) => candidate.pattern.test(normalized));
  return match ? { kind: match.kind, message: normalized.slice(0, 500) } : null;
}

type LPromptMessage =
  | { type: 'LPROMPT_INSERT'; prompt: string }
  | { type: 'LPROMPT_IMPORT_RESPONSE' };

function findComposer(): HTMLElement | null {
  const selectors = [
    'rich-textarea .ql-editor[contenteditable="true"]',
    '[role="textbox"][contenteditable="true"]',
    'textarea'
  ];
  for (const selector of selectors) {
    const candidates = [...document.querySelectorAll<HTMLElement>(selector)];
    const visible = candidates.find((element) => element.offsetParent !== null && !element.closest('[aria-hidden="true"]'));
    if (visible) return visible;
  }
  return null;
}

function insertPrompt(prompt: string): { ok: boolean; error?: string } {
  const composer = findComposer();
  if (!composer) return { ok: false, error: 'Không tìm thấy ô nhập Gemini. Hãy mở một cuộc trò chuyện rồi thử lại.' };
  composer.focus();
  if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
    const prototype = composer instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
    if (!setter) return { ok: false, error: 'Ô nhập Gemini không hỗ trợ thao tác chèn an toàn.' };
    setter.call(composer, prompt);
    composer.dispatchEvent(new Event('input', { bubbles: true }));
    composer.dispatchEvent(new Event('change', { bubbles: true }));
  } else {
    composer.replaceChildren(document.createTextNode(prompt));
    composer.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: prompt }));
  }
  return { ok: true };
}

function getVisibleResponseElements(): HTMLElement[] {
  const selectors = ['model-response', '.model-response-text', '[data-message-author-role="model"]', 'message-content'];
  return selectors.flatMap((selector) => [...document.querySelectorAll<HTMLElement>(selector)])
    .filter((element) => element.offsetParent !== null);
}

function findTransientFailure(): TransientFailure | null {
  const selectors = ['[role="alert"]', '[aria-live="assertive"]', '[aria-live="polite"]'];
  const candidates = [
    ...getVisibleResponseElements(),
    ...selectors.flatMap((selector) => [...document.querySelectorAll<HTMLElement>(selector)])
      .filter((element) => element.offsetParent !== null)
  ];
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const failure = classifyTransientFailure(candidates[index].innerText);
    if (failure) return failure;
  }
  return null;
}

function importResponse(): { ok: boolean; text?: string; error?: string; transientFailure?: TransientFailure } {
  const selected = window.getSelection()?.toString().trim();
  const selectedFailure = selected ? classifyTransientFailure(selected) : null;
  if (selectedFailure) return { ok: false, error: 'Gemini đang tạm thời quá tải.', transientFailure: selectedFailure };
  if (selected) return { ok: true, text: selected };
  const pageFailure = findTransientFailure();
  if (pageFailure) return { ok: false, error: 'Gemini đang tạm thời quá tải.', transientFailure: pageFailure };
  const responses = getVisibleResponseElements();
  const text = responses.at(-1)?.innerText.trim();
  return text
    ? { ok: true, text }
    : { ok: false, error: 'Không tìm thấy phản hồi. Hãy chọn đoạn văn bản cần nhập trên trang Gemini rồi thử lại.' };
}

chrome.runtime.onMessage.addListener((message: LPromptMessage, _sender, sendResponse) => {
  try {
    if (message.type === 'LPROMPT_INSERT') sendResponse(insertPrompt(message.prompt));
    else if (message.type === 'LPROMPT_IMPORT_RESPONSE') sendResponse(importResponse());
    else sendResponse({ ok: false, error: 'LPrompt nhận được message không hợp lệ.' });
  } catch (error) {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Content script gặp lỗi không xác định.' });
  }
  return false;
});

let lastFailureFingerprint = '';
let lastFailureNotifiedAt = 0;
const observer = new MutationObserver(() => {
  const failure = findTransientFailure();
  if (!failure) return;
  const fingerprint = `${failure.kind}:${failure.message}`;
  const now = Date.now();
  if (fingerprint === lastFailureFingerprint && now - lastFailureNotifiedAt < 30_000) return;
  lastFailureFingerprint = fingerprint;
  lastFailureNotifiedAt = now;
  void chrome.runtime.sendMessage({ type: 'LPROMPT_TRANSIENT_FAILURE', failure }).catch(() => undefined);
});

observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
