export const PIP_WIDGET_CSS = `
.bpip-root,
.bpip-root * {
  box-sizing: border-box;
}

.bpip-root {
  position: relative;
  width: 100%;
  height: 100%;
  background: #000;
  color-scheme: dark;
  --accent: #ff4d62;
  --accent-soft: rgba(255, 77, 98, 0.22);
  --text: #f6f6f7;
  --muted: rgba(246, 246, 247, 0.7);
  --rail: rgba(255, 255, 255, 0.2);
  --buffer: rgba(255, 255, 255, 0.38);
  --hud: linear-gradient(180deg, rgba(0, 0, 0, 0.58) 0%, transparent 42%, transparent 52%, rgba(0, 0, 0, 0.78) 100%);
  color: var(--text);
  user-select: none;
}

.bpip-video-wrap {
  position: absolute;
  inset: 0;
}

.bpip-video-wrap video {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  max-height: none !important;
  left: 0 !important;
  top: 0 !important;
  position: relative !important;
  object-fit: contain !important;
  background: #000 !important;
}

.bpip-hit {
  position: absolute;
  inset: 0;
  z-index: 2;
}

.bpip-hud {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 10px 12px 8px;
  background: var(--hud);
  opacity: 0;
  transition: opacity 160ms ease;
  pointer-events: none;
}

.bpip-root.is-paused .bpip-hud,
.bpip-root.is-scrubbing .bpip-hud,
.bpip-root:hover .bpip-hud,
.bpip-root.is-menu .bpip-hud {
  opacity: 1;
}

.bpip-top,
.bpip-bottom,
.bpip-top-actions,
.bpip-transport,
.bpip-left,
.bpip-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.bpip-top,
.bpip-bottom,
.bpip-transport button,
.bpip-top-actions button,
.bpip-volume,
.bpip-speed,
.bpip-timeline {
  pointer-events: auto;
}

.bpip-top { justify-content: space-between; }
.bpip-bottom { flex-direction: column; align-items: stretch; gap: 6px; }
.bpip-transport { justify-content: space-between; }
.bpip-left, .bpip-right { min-width: 0; }

.bpip-title {
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.6);
}

.bpip-root button {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--text);
  width: 32px;
  height: 32px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  cursor: pointer;
  padding: 0;
}

.bpip-root button:hover {
  background: rgba(255, 255, 255, 0.1);
}

.bpip-root button svg {
  width: 20px;
  height: 20px;
}

.bpip-chrome {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 4px;
}

.bpip-chrome button {
  background: rgba(20, 20, 22, 0.72);
}

.bpip-open {
  width: auto !important;
  padding: 0 10px !important;
  font: 650 12px/1 system-ui, sans-serif;
}

.bpip-resize {
  position: absolute;
  z-index: 8;
}

.bpip-resize-n { top: 0; left: 16px; right: 16px; height: 10px; cursor: ns-resize; }
.bpip-resize-s { bottom: 0; left: 16px; right: 16px; height: 10px; cursor: ns-resize; }
.bpip-resize-e { right: 0; top: 16px; bottom: 16px; width: 10px; cursor: ew-resize; }
.bpip-resize-w { left: 0; top: 16px; bottom: 16px; width: 10px; cursor: ew-resize; }
.bpip-resize-nw { top: 0; left: 0; width: 16px; height: 16px; cursor: nwse-resize; }
.bpip-resize-ne { top: 0; right: 0; width: 16px; height: 16px; cursor: nesw-resize; }
.bpip-resize-sw { bottom: 0; left: 0; width: 16px; height: 16px; cursor: nesw-resize; }
.bpip-resize-se { bottom: 0; right: 0; width: 16px; height: 16px; cursor: nwse-resize; }

.bpip-root.is-minimized .bpip-chrome,
.bpip-root.is-minimized .bpip-resize {
  display: none;
}

.bpip-time {
  font-variant-numeric: tabular-nums;
  font-size: 12px;
  color: var(--muted);
  min-width: 92px;
}

.bpip-live {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #fff;
}

.bpip-live::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent);
}

.bpip-timeline {
  position: relative;
  height: 16px;
  display: flex;
  align-items: center;
  cursor: pointer;
  touch-action: none;
}

.bpip-timeline.is-live {
  pointer-events: none;
  opacity: 0.45;
}

.bpip-timeline-rail {
  position: relative;
  width: 100%;
  height: 3px;
  border-radius: 999px;
  background: var(--rail);
  transition: height 120ms ease;
}

.bpip-timeline:hover .bpip-timeline-rail,
.bpip-timeline.is-dragging .bpip-timeline-rail {
  height: 5px;
}

.bpip-timeline-buffer,
.bpip-timeline-played {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
}

.bpip-timeline-buffer { background: var(--buffer); }
.bpip-timeline-played { background: var(--accent); }

.bpip-timeline-thumb {
  position: absolute;
  top: 50%;
  width: 13px;
  height: 13px;
  border-radius: 50%;
  background: var(--accent);
  transform: translate(-50%, -50%) scale(0);
  box-shadow: 0 0 0 4px var(--accent-soft);
  transition: transform 120ms ease;
}

.bpip-timeline:hover .bpip-timeline-thumb,
.bpip-timeline.is-dragging .bpip-timeline-thumb {
  transform: translate(-50%, -50%) scale(1);
}

.bpip-tooltip {
  position: absolute;
  bottom: 18px;
  transform: translateX(-50%);
  background: #fff;
  color: #111;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 6px;
  border-radius: 4px;
  opacity: 0;
  pointer-events: none;
  font-variant-numeric: tabular-nums;
}

.bpip-timeline:hover .bpip-tooltip,
.bpip-timeline.is-dragging .bpip-tooltip {
  opacity: 1;
}

.bpip-volume {
  display: flex;
  align-items: center;
  width: 32px;
  overflow: hidden;
  transition: width 160ms ease;
}

.bpip-volume:hover,
.bpip-volume.is-open {
  width: 108px;
}

.bpip-volume input[type="range"] {
  width: 72px;
  accent-color: #fff;
}

.bpip-speed {
  position: relative;
}

.bpip-speed-toggle {
  width: auto;
  padding: 0 8px;
  font: 600 12px/1 system-ui, sans-serif;
}

.bpip-speed-menu {
  position: absolute;
  right: 0;
  bottom: 36px;
  display: none;
  flex-direction: column;
  min-width: 72px;
  padding: 4px;
  border-radius: 10px;
  background: rgba(20, 20, 22, 0.94);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
}

.bpip-speed-menu.is-open { display: flex; }

.bpip-speed-menu button {
  width: 100%;
  height: 28px;
  justify-items: start;
  padding: 0 8px;
  font: 600 12px/1 system-ui, sans-serif;
}

.bpip-speed-menu button.is-active {
  color: var(--accent);
}

.bpip-slim {
  position: absolute;
  left: 10px;
  right: 10px;
  bottom: 0;
  height: 3px;
  border-radius: 999px;
  background: var(--rail);
  overflow: hidden;
  z-index: 4;
  pointer-events: none;
  opacity: 1;
  transition: opacity 160ms ease;
}

.bpip-slim-played {
  height: 100%;
  background: var(--accent);
}

.bpip-root:hover .bpip-slim,
.bpip-root.is-paused .bpip-slim,
.bpip-root.is-scrubbing .bpip-slim,
.bpip-root.is-minimized .bpip-slim {
  opacity: 0;
}

.bpip-mini {
  display: none;
  position: absolute;
  inset: 0;
  z-index: 5;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  background: #111113;
}

.bpip-mini-progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 2px;
  background: var(--accent);
}

.bpip-mini-title {
  min-width: 0;
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bpip-root.is-minimized .bpip-video-wrap,
.bpip-root.is-minimized .bpip-hud,
.bpip-root.is-minimized .bpip-hit {
  visibility: hidden;
}

.bpip-root.is-minimized .bpip-mini {
  display: flex;
}

.bpip-root.is-video-pip .bpip-minimize,
.bpip-root.is-video-pip .bpip-mini {
  display: none;
}
`;

export const PIP_CSS = `
* { box-sizing: border-box; }

html, body {
  margin: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #000;
  font-family: "YouTube Noto", "YouTube Sans", system-ui, sans-serif;
}

${PIP_WIDGET_CSS}
`;
