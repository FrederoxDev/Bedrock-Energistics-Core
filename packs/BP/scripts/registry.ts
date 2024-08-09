import { world } from "@minecraft/server";
import { logInfo } from "./utils/log";
import { RegisteredMachine, StorageTypeDefinition } from "@/public_api/src";

export * from "@/public_api/src/registry_types";

export const machineRegistry: Record<string, RegisteredMachine> = {};
export const storageTypeRegistry: Record<string, StorageTypeDefinition> = {};

// register energy by default
registerStorageTypeScriptEventListener({
  id: "energy",
  category: "energy",
  color: "yellow",
  name: "energy",
});

export function registerMachineScriptEventListener(
  data: RegisteredMachine,
): void {
  if (data.description.id in machineRegistry) {
    logInfo(`overrode machine '${data.description.id}'`);
  }

  machineRegistry[data.description.id] = data;
}

export function registerStorageTypeScriptEventListener(
  data: StorageTypeDefinition,
): void {
  if (data.id in storageTypeRegistry) {
    logInfo(`overrode storage type '${data.id}'`);
  }

  storageTypeRegistry[data.id] = data;

  const objectiveId = `fluffyalien_energisticscore:storage${data.id}`;

  if (!world.scoreboard.getObjective(objectiveId)) {
    world.scoreboard.addObjective(objectiveId);
  }
}
