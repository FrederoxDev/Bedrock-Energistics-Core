import { Player, system } from "@minecraft/server";
import { enableDebugMode, isDebugModeEnabled } from "./debug_mode";
import { makeErrorString } from "./utils/log";

system.afterEvents.scriptEventReceive.subscribe(
  (e) => {
    // e.sourceEntity is a really expensive api call, only do if necessary
    if (e.id !== "fluffyalien_energisticscore:debug.enable_debug_mode" || !(e.sourceEntity instanceof Player)) return;

    if (isDebugModeEnabled()) {
      e.sourceEntity.sendMessage(
        makeErrorString("Debug mode is already enabled."),
      );
      return;
    }

    enableDebugMode();
  },
  {
    namespaces: ["fluffyalien_energisticscore"],
  },
);
