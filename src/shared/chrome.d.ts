export {};

type ExtensionTab = {
  id?: number;
  windowId?: number;
  url?: string;
  active?: boolean;
};

type MessageSender = {
  tab?: ExtensionTab;
};

declare global {
  const chrome: {
    runtime: {
      sendMessage(message: unknown): Promise<unknown>;
      onMessage: {
        addListener(
          callback: (
            message: unknown,
            sender: MessageSender,
            sendResponse: (response?: unknown) => void,
          ) => boolean | void,
        ): void;
      };
    };
    action: {
      onClicked: {
        addListener(callback: (tab: ExtensionTab) => void): void;
      };
    };
    commands: {
      onCommand: {
        addListener(callback: (command: string) => void): void;
      };
    };
    tabs: {
      onActivated: {
        addListener(callback: (info: { tabId: number }) => void): void;
      };
      query(query: {
        url?: string | string[];
        active?: boolean;
        currentWindow?: boolean;
      }): Promise<ExtensionTab[]>;
      get(tabId: number): Promise<ExtensionTab>;
      sendMessage(tabId: number, message: unknown): Promise<unknown>;
      update(tabId: number, update: { active: boolean }): Promise<ExtensionTab>;
    };
    windows: {
      update(windowId: number, update: { focused: boolean }): Promise<unknown>;
    };
    storage: {
      local: {
        get(key: string): Promise<Record<string, unknown>>;
        set(items: Record<string, unknown>): Promise<void>;
      };
    };
    scripting: {
      executeScript(options: {
        target: { tabId: number };
        files: string[];
        world?: "ISOLATED" | "MAIN";
      }): Promise<unknown>;
      insertCSS(options: {
        target: { tabId: number };
        files: string[];
      }): Promise<unknown>;
    };
  };
}
