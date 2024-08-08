import { logInfo } from "./utils/log";
import { RegisteredMachine, StorageTypeDefinition } from "@/public_api/src";

export * from "@/public_api/src/registry_types";

export const machineRegistry: Record<string, RegisteredMachine> = {};
export const storageTypeRegistry: Record<string, StorageTypeDefinition> = {
  energy: {
    id: "energy",
    color: "yellow",
    name: "energy",
  },
};

export function registerMachineScriptEventListener(
  data: RegisteredMachine,
): void {
  if (data.description.id in machineRegistry) {
    logInfo(`overrode machine '${data.description.id}'`);
  } else {
    logInfo(`registered machine '${data.description.id}'`);
  }

  machineRegistry[data.description.id] = data;
}

export function registerStorageTypeScriptEventListener(
  data: StorageTypeDefinition,
): void {
  if (data.id in storageTypeRegistry) {
    logInfo(`overrode storage type '${data.id}'`);
  } else {
    logInfo(`registered storage type '${data.id}'`);
  }

  storageTypeRegistry[data.id] = data;
}
