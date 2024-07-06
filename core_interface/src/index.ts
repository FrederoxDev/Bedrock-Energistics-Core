import { world } from "@minecraft/server";
import { RegisteredMachine } from "./registry_types";

const overworld = world.getDimension("overworld");

export function registerMachine(options: RegisteredMachine): void {
  overworld.runCommand(
    `scriptevent fluffyalien_energisticscore:register_machine ${JSON.stringify(options)}`,
  );
}
