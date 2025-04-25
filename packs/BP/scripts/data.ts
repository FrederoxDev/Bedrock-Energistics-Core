import { Block, DimensionLocation, ItemStack, world } from "@minecraft/server";
import { machineChangedItemSlots } from "./ui";
import { MachineItemStack, getMachineStorage } from "@/public_api/src";
import {
  getBlockUniqueId,
  getStorageScoreboardObjective,
} from "@/public_api/src/machine_data_internal";
import { raise } from "./utils/log";
import { InternalRegisteredMachine } from "./machine_registry";
import {
  getBlockDynamicProperty,
  setBlockDynamicProperty,
} from "./utils/dynamic_property";
import {
  deserializeMachineItemStack,
  serializeMachineItemStack,
} from "@/public_api/src/serialize_machine_item_stack";

export { getBlockUniqueId, getMachineStorage };

export function removeBlockFromScoreboards(loc: DimensionLocation): void {
  const participantId = getBlockUniqueId(loc);

  for (const objective of world.scoreboard.getObjectives()) {
    objective.removeParticipant(participantId);
  }
}

/**
 * Sets the storage of a specific type in a machine.
 * @param block The machine block.
 * @param type The type of storage to set.
 * @param value The new value. Must be an integer.
 * @param callOnStorageSet Whether to call the `onStorageSet` event on the machine, if applicable.
 * @throws Throws if the storage type does not exist.
 * @throws Throws if the new value isn't a non-negative integer.
 * @throws Throws if the block is not valid.
 * @throws Throws if the block is not registered as a machine.
 */
export function setMachineStorage(
  block: Block,
  type: string,
  value: number,
  callOnStorageSet = true,
): void {
  // There is a similar function to this in the public API.
  // Make sure changes are reflected in both.

  if (!block.isValid()) {
    raise("Failed to set machine storage. The block is invalid.");
  }

  if (value < 0) {
    raise(
      `Failed to set machine storage of type '${type}' to ${value.toString()}. The minimum value is 0.`,
    );
  }

  const objective = getStorageScoreboardObjective(type);
  if (!objective) {
    raise(
      `Failed to set machine storage. Storage type '${type}' doesn't exist.`,
    );
  }

  const registered = InternalRegisteredMachine.forceGetInternal(block.typeId);

  objective.setScore(getBlockUniqueId(block), value);

  if (callOnStorageSet && registered.hasCallback("onStorageSet")) {
    registered.callOnStorageSetEvent(block, type, value);
  }
}

export function getMachineSlotItemRaw(
  loc: DimensionLocation,
  slot: number,
): string | undefined {
  return getBlockDynamicProperty(loc, `item${slot.toString()}`) as
    | string
    | undefined;
}

export function getMachineSlotItem(
  loc: DimensionLocation,
  slot: number,
): MachineItemStack | undefined {
  const data = getMachineSlotItemRaw(loc, slot);
  if (data === undefined) {
    return;
  }

  return deserializeMachineItemStack(data);
}

export function setMachineSlotItem(
  loc: DimensionLocation,
  slot: number,
  newItemStack?: MachineItemStack,
  setChanged = true,
): void {
  const uid = getBlockUniqueId(loc);
  const propertyId = `item${slot.toString()}`;

  if (setChanged) {
    const existingChangedItemSlotsArr = machineChangedItemSlots.get(uid);
    if (existingChangedItemSlotsArr) {
      existingChangedItemSlotsArr.push(slot);
    } else {
      machineChangedItemSlots.set(uid, [slot]);
    }
  }

  if (!newItemStack || newItemStack.amount <= 0) {
    setBlockDynamicProperty(loc, propertyId);
    return;
  }

  setBlockDynamicProperty(
    loc,
    propertyId,
    serializeMachineItemStack(newItemStack),
  );
}

export function optionalMachineItemStackToItemStack(
  machineItem?: MachineItemStack,
): ItemStack {
  return machineItem
    ? machineItem.toItemStack()
    : new ItemStack("fluffyalien_energisticscore:ui_empty_slot");
}
