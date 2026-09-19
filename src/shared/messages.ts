import type { Settings } from "./settings";

export const COMMAND_EVENT = "better-pip:command";
export const STATE_EVENT = "better-pip:state";

export type Chapter = {
  title: string;
  startTime: number;
};

export type PlayerState = {
  hasVideo: boolean;
  isPip: boolean;
  isAd: boolean;
  isLive: boolean;
  paused: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  rate: number;
  title: string;
  chapters: Chapter[];
  sleepEndsAt: number | null;
  waitingForAd: boolean;
  settings: Settings;
};

export type Command =
  | { type: "get-state" }
  | { type: "toggle-pip" }
  | { type: "dismiss-pip" }
  | { type: "open-player" }
  | { type: "play" }
  | { type: "pause" }
  | { type: "toggle-play" }
  | { type: "seek"; time: number }
  | { type: "skip"; delta: number }
  | { type: "speed"; rate: number }
  | { type: "volume"; value: number }
  | { type: "toggle-mute" }
  | { type: "sleep"; minutes: number }
  | { type: "apply-settings"; settings: Settings }
  | { type: "tab-hidden" }
  | { type: "tab-shown" };

export type CommandEnvelope = {
  requestId: string;
  command: Command;
};

export type StateEnvelope = {
  requestId: string;
  state: PlayerState;
};

export function isCommandEnvelope(value: unknown): value is CommandEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "requestId" in value &&
    typeof value.requestId === "string" &&
    "command" in value &&
    isCommand(value.command)
  );
}

export function isStateEnvelope(value: unknown): value is StateEnvelope {
  return (
    typeof value === "object" &&
    value !== null &&
    "requestId" in value &&
    typeof value.requestId === "string" &&
    "state" in value
  );
}

export function isCommand(value: unknown): value is Command {
  if (typeof value !== "object" || value === null || !("type" in value)) {
    return false;
  }

  return typeof value.type === "string";
}
