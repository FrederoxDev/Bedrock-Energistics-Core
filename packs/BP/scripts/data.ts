import { Block, DimensionLocation, ItemStack } from "@minecraft/server";
import { machineChangedItemSlots } from "./ui";
import {
  MachineItemStack,
  getMachineSlotItem,
  UiItemSlotElement,
  getMachineStorage,
} from "@/public_api/src";
import {
  getBlockUniqueId,
  getItemTypeScoreboardObjective,
  getItemCountScoreboardObjective,
  removeBlockFromScoreboards,
  getStorageScoreboardObjective,
} from "@/public_api/src/machine_data_internal";
import { raise } from "./utils/log";
import { InternalRegisteredMachine } from "./machine_registry";

export {
  getBlockUniqueId,
  getMachineStorage,
  getMachineSlotItem,
  removeBlockFromScoreboards,
};

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

export function setMachineSlotItem(
  loc: DimensionLocation,
  slot: number,
  newItemStack?: MachineItemStack,
  setChanged = true,
): void {
  const uid = getBlockUniqueId(loc);
  const itemTypeObjective = getItemTypeScoreboardObjective(slot);
  const itemCountObjective = getItemCountScoreboardObjective(slot);

  if (setChanged) {
    const existingChangedItemSlotsArr = machineChangedItemSlots.get(uid);
    if (existingChangedItemSlotsArr) {
      existingChangedItemSlotsArr.push(slot);
    } else {
      machineChangedItemSlots.set(uid, [slot]);
    }
  }

  if (!newItemStack || newItemStack.count <= 0) {
    itemTypeObjective.removeParticipant(uid);
    itemCountObjective.removeParticipant(uid);
    return;
  }

  itemTypeObjective.setScore(uid, newItemStack.typeIndex);
  itemCountObjective.setScore(uid, newItemStack.count);
}

export function machineItemStackToItemStack(
  element: UiItemSlotElement,
  machineItem?: MachineItemStack,
): ItemStack {
  return machineItem
    ? new ItemStack(
        element.allowedItems[machineItem.typeIndex],
        machineItem.count,
      )
    : new ItemStack("fluffyalien_energisticscore:ui_empty_slot");
}
