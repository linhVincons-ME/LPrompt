const CONTEXT_MENU_ID = 'lprompt-use-selection';

function configureSidePanel(): void {
  void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
    console.error('LPrompt could not enable side-panel behavior:', error);
  });
}

chrome.runtime.onInstalled.addListener(() => {
  configureSidePanel();
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: CONTEXT_MENU_ID,
      title: 'Đưa phần đã chọn vào LPrompt',
      contexts: ['selection']
    });
  });
});

chrome.runtime.onStartup.addListener(() => {
  configureSidePanel();
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText?.trim()) return;
  const source = info.selectionText.trim().slice(0, 200_000);
  void chrome.storage.local.get('lpromptDraft').then((stored) => {
    const previous = stored.lpromptDraft && typeof stored.lpromptDraft === 'object' ? stored.lpromptDraft : {};
    return chrome.storage.local.set({ lpromptDraft: { ...previous, source } });
  }).then(() => chrome.runtime.sendMessage({ type: 'LPROMPT_DRAFT_UPDATED', source }).catch(() => undefined))
    .then(() => tab?.windowId === undefined ? undefined : chrome.sidePanel.open({ windowId: tab.windowId }))
    .catch((error) => console.error('LPrompt could not import selected text:', error));
});
