import { DimensionLocation, world } from "@minecraft/server";
import { RegisteredMachine } from "./registry_types";

export * from "./registry_types";
export { getMachineStorage, setMachineStorage } from "./machine_data";

const overworld = world.getDimension("overworld");

function serializeDimensionLocation(loc: DimensionLocation): string {
  return JSON.stringify({
    dimension: loc.dimension.id,
    x: loc.x,
    y: loc.y,
    z: loc.z,
  });
}

/**
 * @beta
 * Registers a machine. This function should be called in the `worldInitialize` after event.
 */
export function registerMachine(options: RegisteredMachine): void {
  overworld.runCommand(
    `scriptevent fluffyalien_energisticscore:register_machine ${JSON.stringify(options)}`,
  );
}

/**
 * @beta
 * Updates the network that a block belongs to, if it has one.
 */
export function updateBlockNetwork(blockLocation: DimensionLocation): void {
  overworld.runCommand(
    `scriptevent fluffyalien_energisticscore:update_block_network ${serializeDimensionLocation(blockLocation)}`,
  );
}

/**
 * @beta
 * Updates the networks adjacent to a block.
 */
export function updateBlockAdjacentNetworks(
  blockLocation: DimensionLocation,
): void {
  overworld.runCommand(
    `scriptevent fluffyalien_energisticscore:update_block_adjacent_networks ${serializeDimensionLocation(blockLocation)}`,
  );
}
