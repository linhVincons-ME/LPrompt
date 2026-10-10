type TransientFailure = {
  kind: 'overloaded' | 'rate_limited' | 'temporarily_unavailable';
  message: string;
};

function classifyTransientFailure(text: string): TransientFailure | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  const patterns: Array<{ kind: TransientFailure['kind']; pattern: RegExp }> = [
    { kind: 'overloaded', pattern: /high demand|spikes? in demand|(?:hệ thống|máy chủ|gemini).{0,20}quá tải|lưu lượng (?:truy cập )?(?:đang )?cao/i },
    { kind: 'rate_limited', pattern: /too many requests|rate limit|resource exhausted|\b429\b|quá nhiều yêu cầu|vượt quá giới hạn (?:tốc độ|yêu cầu)/i },
    { kind: 'temporarily_unavailable', pattern: /temporarily unavailable|service unavailable|try again later|please try again|(?:dịch vụ )?tạm thời không khả dụng|vui lòng thử lại sau/i }
  ];
  const match = patterns.find((candidate) => candidate.pattern.test(normalized));
  return match ? { kind: match.kind, message: normalized.slice(0, 500) } : null;
}

type LPromptMessage =
  | { type: 'LPROMPT_INSERT'; prompt: string; attachments?: Array<{ name: string; type: string; dataUrl: string }> }
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

function findAttachmentInput(): HTMLInputElement | null {
  const inputs = [...document.querySelectorAll<HTMLInputElement>('input[type="file"]')];
  return inputs.find((input) => input.multiple && /image|png|jpe?g|webp/i.test(input.accept))
    ?? inputs.find((input) => input.multiple && !input.accept)
    ?? inputs.find((input) => /image|png|jpe?g|webp/i.test(input.accept))
    ?? null;
}

function dataUrlToFile(attachment: { name: string; type: string; dataUrl: string }): File {
  const parts = attachment.dataUrl.split(',');
  if (parts.length !== 2 || !parts[0].includes(';base64')) throw new Error(`Dữ liệu ảnh ${attachment.name} không hợp lệ.`);
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], attachment.name, { type: attachment.type });
}

async function attachReferenceImages(attachments: Array<{ name: string; type: string; dataUrl: string }>): Promise<{ ok: boolean; error?: string }> {
  if (attachments.length === 0) return { ok: true };
  if (attachments.length > 4) return { ok: false, error: 'Chỉ được đính kèm tối đa 4 ảnh tham chiếu.' };
  const invalid = attachments.find((attachment) => !/^image\/(png|jpeg|webp)$/i.test(attachment.type) || attachment.dataUrl.length > 7_000_000);
  if (invalid) return { ok: false, error: `Ảnh ${invalid.name} không hợp lệ hoặc vượt quá giới hạn 5 MB.` };
  const input = findAttachmentInput();
  if (!input) return { ok: false, error: 'Không tìm thấy ô đính kèm của Gemini. Hãy mở menu tải tệp trên Gemini rồi bấm Chèn lại.' };
  const transfer = new DataTransfer();
  attachments.forEach((attachment) => transfer.items.add(dataUrlToFile(attachment)));
  input.files = transfer.files;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
  return { ok: true };
}

async function insertPrompt(prompt: string, attachments: Array<{ name: string; type: string; dataUrl: string }> = []): Promise<{ ok: boolean; error?: string }> {
  const attachmentResult = await attachReferenceImages(attachments);
  if (!attachmentResult.ok) return attachmentResult;
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
  const alertSelectors = [
    '[role="alert"]',
    '[aria-live="assertive"]',
    '.notification-container',
    '.snack-bar',
    '.toast',
    '[data-is-error="true"]',
    '.error-message'
  ];
  const candidates = alertSelectors
    .flatMap((selector) => [...document.querySelectorAll<HTMLElement>(selector)])
    .filter((element) => element.offsetParent !== null && !element.closest('rich-textarea') && !element.closest('.model-response-text'));
  for (let index = candidates.length - 1; index >= 0; index -= 1) {
    const text = candidates[index].innerText;
    if (text && text.length < 800) {
      const failure = classifyTransientFailure(text);
      if (failure) return failure;
    }
  }

  // Backup check: only the very last response bubble, if short and matching strict English system errors
  const lastResponse = getVisibleResponseElements().at(-1);
  if (lastResponse && (lastResponse.textContent?.length ?? 0) < 400) {
    const bubbleText = lastResponse.innerText?.trim();
    if (bubbleText && bubbleText.length < 300 && /high demand|too many requests|\b429\b|temporarily unavailable|service unavailable/i.test(bubbleText)) {
      const failure = classifyTransientFailure(bubbleText);
      if (failure) return failure;
    }
  }
  return null;
}

function importResponse(): { ok: boolean; text?: string; error?: string; transientFailure?: TransientFailure } {
  const selected = window.getSelection()?.toString().trim();
  if (selected) {
    return { ok: true, text: selected };
  }
  const pageFailure = findTransientFailure();
  if (pageFailure) return { ok: false, error: 'Gemini đang tạm thời quá tải.', transientFailure: pageFailure };
  const responses = getVisibleResponseElements();
  const text = responses.at(-1)?.innerText.trim();
  return text
    ? { ok: true, text }
    : { ok: false, error: 'Không tìm thấy phản hồi. Hãy chọn đoạn văn bản cần nhập trên trang Gemini rồi thử lại.' };
}

chrome.runtime.onMessage.addListener((message: LPromptMessage, _sender, sendResponse) => {
  if (message.type === 'LPROMPT_INSERT') {
    void insertPrompt(message.prompt, message.attachments).then(sendResponse).catch((error) => {
      sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Không thể đính kèm ảnh tham chiếu.' });
    });
    return true;
  }
  try {
    if (message.type === 'LPROMPT_IMPORT_RESPONSE') sendResponse(importResponse());
    else sendResponse({ ok: false, error: 'LPrompt nhận được message không hợp lệ.' });
  } catch (error) {
    sendResponse({ ok: false, error: error instanceof Error ? error.message : 'Content script gặp lỗi không xác định.' });
  }
  return false;
});

let lastFailureFingerprint = '';
let lastFailureNotifiedAt = 0;
let mutationDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let firstMutationAt = 0;

const observer = new MutationObserver(() => {
  const now = Date.now();
  if (mutationDebounceTimer === null) {
    firstMutationAt = now;
  } else {
    clearTimeout(mutationDebounceTimer);
  }
  const wait = now - firstMutationAt >= 1000 ? 0 : 500;
  mutationDebounceTimer = setTimeout(() => {
    mutationDebounceTimer = null;
    const failure = findTransientFailure();
    if (!failure) return;
    const fingerprint = `${failure.kind}:${failure.message}`;
    const triggerNow = Date.now();
    if (fingerprint === lastFailureFingerprint && triggerNow - lastFailureNotifiedAt < 30_000) return;
    lastFailureFingerprint = fingerprint;
    lastFailureNotifiedAt = triggerNow;
    void chrome.runtime.sendMessage({ type: 'LPROMPT_TRANSIENT_FAILURE', failure }).catch(() => undefined);
  }, wait);
});

observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
