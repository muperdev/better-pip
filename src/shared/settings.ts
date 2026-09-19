export const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export const SLEEP_MINUTES = [0, 15, 30, 45, 60] as const;
export const SKIP_SECONDS = 10;

export type Settings = {
  autoPip: boolean;
  defaultSpeed: number;
  lastVolume: number;
};

export const DEFAULT_SETTINGS: Settings = {
  autoPip: true,
  defaultSpeed: 1,
  lastVolume: 1,
};

export const SETTINGS_KEY = "better-pip-settings";

export function parseSettings(value: unknown): Settings {
  if (typeof value !== "object" || value === null) {
    return { ...DEFAULT_SETTINGS };
  }

  const autoPip = "autoPip" in value ? Boolean(value.autoPip) : DEFAULT_SETTINGS.autoPip;
  const defaultSpeed =
    "defaultSpeed" in value && typeof value.defaultSpeed === "number"
      ? value.defaultSpeed
      : DEFAULT_SETTINGS.defaultSpeed;
  const lastVolume =
    "lastVolume" in value && typeof value.lastVolume === "number"
      ? value.lastVolume
      : DEFAULT_SETTINGS.lastVolume;

  return {
    autoPip,
    defaultSpeed,
    lastVolume,
  };
}
