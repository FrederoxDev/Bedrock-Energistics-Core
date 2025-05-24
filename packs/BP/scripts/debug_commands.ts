import { Player, system } from "@minecraft/server";
import { enableDebugMode, isDebugModeEnabled } from "./debug_mode";
import { makeErrorString, makeLogString } from "./utils/log";
import { MachineNetwork } from "./network";

system.afterEvents.scriptEventReceive.subscribe(
  (e) => {
    // e.sourceEntity is a really expensive api call, only do if necessary
    if (
      !e.id.startsWith("fluffyalien_energisticscore:debug.") ||
      !(e.sourceEntity instanceof Player)
    ) {
      return;
    }

    switch (e.id) {
      case "fluffyalien_energisticscore:debug.enable_debug_mode":
        if (isDebugModeEnabled()) {
          e.sourceEntity.sendMessage(
            makeErrorString("Debug mode is already enabled."),
          );
          return;
        }

        enableDebugMode();
        break;
      case "fluffyalien_energisticscore:debug.get_networks": {
        const networks = MachineNetwork.getAll();
        const lines = [];
        for (const [networkId, network] of networks) {
          lines.push(
            `{ §sid§r: §p${networkId.toString()}§r, §sioType§r: { §scategory§r: §p${network.ioType.category}§r, §sid§r: §p${network.ioType.id}§r } }`,
          );
        }
        e.sourceEntity.sendMessage(
          makeLogString("DEBUG", `Networks: [\n${lines.join(",\n")}\n]`),
        );
        break;
      }
    }
  },
  {
    namespaces: ["fluffyalien_energisticscore"],
  },
);
