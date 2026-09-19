import type { Command } from "./shared/messages";
import { SKIP_SECONDS } from "./shared/settings";

const YOUTUBE_URLS = ["*://*.youtube.com/*", "*://youtube.com/*", "*://*.youtube-nocookie.com/*"];

chrome.commands.onCommand.addListener((command) => {
  void dispatchCommand(commandFromShortcut(command));
});

chrome.tabs.onActivated.addListener((info) => {
  void notifyTabSwitch(info.tabId);
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!isBackgroundCommand(message)) {
    return;
  }

  void dispatchCommand(message).then(sendResponse);
  return true;
});

let previousTabId: number | undefined;

void chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
  previousTabId = tabs[0]?.id;
});

async function notifyTabSwitch(activeTabId: number): Promise<void> {
  if (previousTabId !== undefined && previousTabId !== activeTabId) {
    await sendToTab(previousTabId, { type: "tab-hidden" });
  }

  await sendToTab(activeTabId, { type: "tab-shown" });
  previousTabId = activeTabId;
}

async function dispatchCommand(command: Command | null): Promise<unknown> {
  if (!command) {
    return null;
  }

  const tab = await findYouTubeTab();
  if (tab?.id === undefined) {
    return null;
  }

  if (command.type === "open-player") {
    await chrome.tabs.update(tab.id, { active: true });
    if (tab.windowId !== undefined) {
      await chrome.windows.update(tab.windowId, { focused: true });
    }
  }

  return sendToTab(tab.id, command);
}

async function sendToTab(tabId: number, command: Command): Promise<unknown> {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!isYouTubeUrl(tab.url)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    return await chrome.tabs.sendMessage(tabId, command);
  } catch {
    await ensureContentScripts(tabId);
    try {
      return await chrome.tabs.sendMessage(tabId, command);
    } catch {
      return null;
    }
  }
}

async function findYouTubeTab(): Promise<{ id?: number; windowId?: number; url?: string } | null> {
  const active = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTab = active[0];
  if (activeTab && isYouTubeUrl(activeTab.url)) {
    return activeTab;
  }

  const youtubeTabs = await chrome.tabs.query({ url: YOUTUBE_URLS });
  return youtubeTabs[0] ?? null;
}

async function ensureContentScripts(tabId: number): Promise<void> {
  await chrome.scripting.insertCSS({
    target: { tabId },
    files: ["content.css"],
  });
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content-main.js"],
    world: "MAIN",
  });
  await chrome.scripting.executeScript({
    target: { tabId },
    files: ["content-bridge.js"],
    world: "ISOLATED",
  });
}

function commandFromShortcut(command: string): Command | null {
  switch (command) {
    case "toggle-pip":
      return { type: "toggle-pip" };
    case "seek-back":
      return { type: "skip", delta: -SKIP_SECONDS };
    case "seek-forward":
      return { type: "skip", delta: SKIP_SECONDS };
    case "toggle-mute":
      return { type: "toggle-mute" };
    default:
      return null;
  }
}

function isBackgroundCommand(value: unknown): value is Command {
  return typeof value === "object" && value !== null && "type" in value;
}

function isYouTubeUrl(url: string | undefined): boolean {
  if (!url) {
    return false;
  }

  try {
    const { hostname } = new URL(url);
    return (
      hostname === "youtube.com" ||
      hostname.endsWith(".youtube.com") ||
      hostname.endsWith("youtube-nocookie.com")
    );
  } catch {
    return false;
  }
}
