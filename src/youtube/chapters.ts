import type { Chapter } from "../shared/messages";

export function readChapters(): Chapter[] {
  const fromPlayer = chaptersFromUnknown(window.ytInitialPlayerResponse);
  if (fromPlayer.length > 0) {
    return fromPlayer;
  }

  return chaptersFromDom();
}

function chaptersFromUnknown(value: unknown): Chapter[] {
  const markers = findMarkersMap(value);
  if (!markers) {
    return [];
  }

  const chapters: Chapter[] = [];
  for (const marker of markers) {
    if (typeof marker !== "object" || marker === null || !("value" in marker)) {
      continue;
    }

    const packed = marker.value;
    if (typeof packed !== "object" || packed === null || !("chapters" in packed)) {
      continue;
    }

    if (!Array.isArray(packed.chapters)) {
      continue;
    }

    for (const item of packed.chapters) {
      const chapter = readChapter(item);
      if (chapter) {
        chapters.push(chapter);
      }
    }

    if (chapters.length > 0) {
      return chapters;
    }
  }

  return [];
}

function findMarkersMap(value: unknown, seen = new Set<unknown>(), depth = 0): unknown[] | null {
  if (depth > 12 || typeof value !== "object" || value === null || seen.has(value)) {
    return null;
  }

  seen.add(value);
  const record = value as Record<string, unknown>;
  if ("markersMap" in record && Array.isArray(record.markersMap)) {
    return record.markersMap;
  }

  for (const nested of Object.values(record)) {
    const found = findMarkersMap(nested, seen, depth + 1);
    if (found) {
      return found;
    }
  }

  return null;
}

function readChapter(value: unknown): Chapter | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Record<string, unknown>;
  const chapter = "chapterRenderer" in record ? record.chapterRenderer : value;
  if (typeof chapter !== "object" || chapter === null) {
    return null;
  }

  const node = chapter as Record<string, unknown>;
  const startTimeMs = typeof node.startTimeMs === "string" ? Number(node.startTimeMs) : Number(node.startTimeMs);
  const title = readTitle(node.title);
  if (!title || !Number.isFinite(startTimeMs)) {
    return null;
  }

  return {
    title,
    startTime: startTimeMs / 1000,
  };
}

function readTitle(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    if ("simpleText" in value && typeof value.simpleText === "string") {
      return value.simpleText;
    }

    if ("runs" in value && Array.isArray(value.runs)) {
      return value.runs
        .map((run) =>
          typeof run === "object" && run !== null && "text" in run && typeof run.text === "string"
            ? run.text
            : "",
        )
        .join("");
    }
  }

  return "";
}

function chaptersFromDom(): Chapter[] {
  const nodes = document.querySelectorAll(
    "ytd-macro-markers-list-item-renderer, ytd-chapter-renderer",
  );
  const chapters: Chapter[] = [];

  for (const node of nodes) {
    const title = node.querySelector("h4, #title")?.textContent?.trim();
    const stamp = node.querySelector("#time, .ytp-chapter-title")?.textContent?.trim();
    if (!title) {
      continue;
    }

    chapters.push({
      title,
      startTime: parseStamp(stamp ?? "0:00"),
    });
  }

  return chapters;
}

function parseStamp(stamp: string): number {
  const parts = stamp.split(":").map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) {
    return 0;
  }

  if (parts.length === 3) {
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0);
  }

  if (parts.length === 2) {
    return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
  }

  return parts[0] ?? 0;
}
