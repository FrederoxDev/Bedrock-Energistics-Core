import { system } from "@minecraft/server";
import { logInfo } from "./utils/log";
import { RegisteredMachine } from "@/public_api/src/registry_types";

export * from "@/public_api/src/registry_types";

export const machineRegistry: Record<string, RegisteredMachine> = {};

system.afterEvents.scriptEventReceive.subscribe(
  (e) => {
    if (e.id !== "fluffyalien_energisticscore:register_machine") {
      return;
    }

    const data = JSON.parse(e.message) as RegisteredMachine;

    if (data.description.id in machineRegistry) {
      logInfo(`reregistered machine '${data.description.id}'`);
    } else {
      logInfo(`registered machine '${data.description.id}'`);
    }

    machineRegistry[data.description.id] = data;
  },
  {
    namespaces: ["fluffyalien_energisticscore"],
  },
);
