export {};

declare global {
  interface Window {
    __betterPipBooted?: boolean;
    ytInitialPlayerResponse?: unknown;
  }

  var __betterPipBridge: boolean | undefined;
}
