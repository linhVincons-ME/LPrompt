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

function importResponse(): { ok: boolean; text?: string; error?: string } {
  const selected = window.getSelection()?.toString().trim();
  if (selected) return { ok: true, text: selected };
  const selectors = ['model-response', '.model-response-text', '[data-message-author-role="model"]', 'message-content'];
  const responses = selectors.flatMap((selector) => [...document.querySelectorAll<HTMLElement>(selector)]).filter((element) => element.offsetParent !== null);
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
