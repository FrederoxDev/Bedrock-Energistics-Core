import { logInfo } from "./utils/log";
import { RegisteredMachine } from "@/public_api/src";

export * from "@/public_api/src/registry_types";

export const machineRegistry: Record<string, RegisteredMachine> = {};

export function registerMachineScriptEvent(data: RegisteredMachine): void {
  if (data.description.id in machineRegistry) {
    logInfo(`reregistered machine '${data.description.id}'`);
  } else {
    logInfo(`registered machine '${data.description.id}'`);
  }

  machineRegistry[data.description.id] = data;
}
