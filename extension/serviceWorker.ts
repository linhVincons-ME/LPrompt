const CONTEXT_MENU_ID = 'lprompt-use-selection';

function getChromeSidePanel(): { setPanelBehavior?: (opts: { openPanelOnActionClick: boolean }) => Promise<void>; open?: (opts: { windowId: number }) => Promise<void> } | undefined {
  return typeof chrome !== 'undefined' ? (chrome as Record<string, any>)['sidePanel'] : undefined;
}

function configureSidePanel(): void {
  const sidePanel = getChromeSidePanel();
  if (sidePanel && typeof sidePanel.setPanelBehavior === 'function') {
    void sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch((error) => {
      console.error('LPrompt could not enable side-panel behavior:', error);
    });
  }
}

function openLPromptSideView(windowId?: number): Promise<void> | void {
  // Firefox WebExtensions sidebar
  const browserGlobal = (globalThis as unknown as { browser?: { sidebarAction?: { open?: () => Promise<void>; toggle?: () => Promise<void> } } }).browser;
  if (typeof browserGlobal?.sidebarAction?.open === 'function') {
    return browserGlobal.sidebarAction.open();
  }
  const chromeSidebar = (chrome as unknown as { sidebarAction?: { open?: () => void; toggle?: () => void } }).sidebarAction;
  if (typeof chromeSidebar?.open === 'function') {
    chromeSidebar.open();
    return;
  }
  // Chrome MV3 sidePanel
  const sidePanel = getChromeSidePanel();
  if (sidePanel && typeof sidePanel.open === 'function' && windowId !== undefined) {
    return sidePanel.open({ windowId });
  }
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

// For Firefox & browsers where action click should open the sidebar
const actionApi = chrome.action ?? (chrome as unknown as { browserAction?: typeof chrome.action }).browserAction;
if (actionApi?.onClicked) {
  actionApi.onClicked.addListener((tab) => {
    void Promise.resolve(openLPromptSideView(tab?.windowId)).catch((error) => console.error('LPrompt could not open side view:', error));
  });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID || !info.selectionText?.trim()) return;
  void Promise.resolve(openLPromptSideView(tab?.windowId)).catch((error) => console.error('LPrompt could not open side view:', error));
  const source = info.selectionText.trim().slice(0, 200_000);
  void chrome.storage.local.get('lpromptDraft').then((stored) => {
    const previous = stored.lpromptDraft && typeof stored.lpromptDraft === 'object' ? stored.lpromptDraft : {};
    return chrome.storage.local.set({ lpromptDraft: { ...previous, source } });
  }).then(() => chrome.runtime.sendMessage({ type: 'LPROMPT_DRAFT_UPDATED', source }).catch(() => undefined))
    .catch((error) => console.error('LPrompt could not import selected text:', error));
});
