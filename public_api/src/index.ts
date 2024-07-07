import { world } from "@minecraft/server";
import { RegisteredMachine } from "./registry_types";

export * from "./registry_types";
export { getMachineStorage, setMachineStorage } from "./machine_data";

const overworld = world.getDimension("overworld");

/**
 * @beta
 * Registers a machine. This function should be called in the `worldInitialize` after event.
 */
export function registerMachine(options: RegisteredMachine): void {
  overworld.runCommand(
    `scriptevent fluffyalien_energisticscore:register_machine ${JSON.stringify(options)}`,
  );
}
