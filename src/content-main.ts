import { COMMAND_EVENT, STATE_EVENT, isCommandEnvelope } from "./shared/messages";
import { watchPlayerToggle } from "./youtube/inject-toggle";
import { bootRuntime, handleCommand } from "./player/runtime";

if (!window.__betterPipBooted) {
  window.__betterPipBooted = true;
  boot();
}

function boot(): void {
  bootRuntime();

  watchPlayerToggle(() => {
    void handleCommand({ type: "toggle-pip" });
  });

  document.addEventListener(COMMAND_EVENT, (event) => {
    if (!(event instanceof CustomEvent) || !isCommandEnvelope(event.detail)) {
      return;
    }

    const { requestId, command } = event.detail;
    void handleCommand(command).then((state) => {
      document.dispatchEvent(
        new CustomEvent(STATE_EVENT, {
          bubbles: true,
          detail: { requestId, state },
        }),
      );
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.altKey && !event.metaKey && !event.ctrlKey && event.code === "KeyP") {
      event.preventDefault();
      void handleCommand({ type: "toggle-pip" });
    }
  });
}
