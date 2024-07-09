import { DimensionLocation, world } from "@minecraft/server";
import { RegisteredMachine, StorageType } from "./registry_types";
import {
  getBlockUniqueId,
  getItemCountScoreboard,
  getItemTypeScoreboard,
  getScore,
  getStorageScoreboard,
  serializeDimensionLocation,
} from "./internal";

export * from "./registry_types";

/**
 * Representation of an item stack stored in a machine inventory.
 */
export interface MachineItemStack {
  /**
   * The index of the item in the slot's `allowedItems`.
   * @see {@link UiItemSlotElement}
   */
  type: number;
  /**
   * The amount of this item.
   */
  count: number;
}

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

/**
 * @beta
 * Gets the storage of a specific type in a machine.
 * @param loc The location of the machine.
 * @param type The type of storage to get.
 */
export function getMachineStorage(
  loc: DimensionLocation,
  type: StorageType,
): number {
  return getScore(getStorageScoreboard(type), getBlockUniqueId(loc)) ?? 0;
}

/**
 * @beta
 * Sets the storage of a specific type in a machine.
 * @param loc The location of the machine.
 * @param type The type of storage to set.
 * @param value The new value.
 */
export function setMachineStorage(
  loc: DimensionLocation,
  type: StorageType,
  value: number,
): void {
  getStorageScoreboard(type).setScore(getBlockUniqueId(loc), value);
}

/**
 * Gets an item from a machine inventory.
 * @param loc The location of the machine.
 * @param slotId The number ID of the slot as defined when the machine was registered (see {@link UiItemSlotElement}).
 * @returns The {@link MachineItemStack}.
 */
export function getItemInMachineSlot(
  loc: DimensionLocation,
  slotId: number,
): MachineItemStack | undefined {
  const participantId = getBlockUniqueId(loc);

  const itemType = getScore(getItemTypeScoreboard(slotId), participantId);
  if (itemType === undefined) {
    return;
  }

  const itemCount = getScore(getItemCountScoreboard(slotId), participantId);
  if (!itemCount) {
    return;
  }

  return {
    type: itemType,
    count: itemCount,
  };
}

/**
 * Sets an item in a machine inventory
 * @param loc The location of the machine
 * @param slotId The number ID of the slot as defined when the machine was registered (see {@link UiItemSlotElement}).
 * @param newItemStack The {@link MachineItemStack} to put in the slot. Pass `undefined` to remove the item in the slot
 */
export function setItemInMachineSlot(
  loc: DimensionLocation,
  slotId: number,
  newItemStack?: MachineItemStack,
): void {
  overworld.runCommand(
    `scriptevent fluffyalien_energistics:set_item_in_machine_slot ${JSON.stringify(
      {
        loc,
        slot: slotId,
        item: newItemStack,
      },
    )}`,
  );
}
