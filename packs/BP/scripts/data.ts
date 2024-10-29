import { DimensionLocation, ItemStack } from "@minecraft/server";
import { UiItemSlotElement } from "./registry";
import { machineChangedItemSlots } from "./ui";
import {
  getMachineStorage,
  setMachineStorage,
  MachineItemStack,
  getMachineSlotItem,
} from "@/public_api/src";
import {
  getBlockUniqueId,
  getItemTypeScoreboardObjective,
  getItemCountScoreboardObjective,
  removeBlockFromScoreboards,
} from "@/public_api/src/machine_data_internal";

export {
  getBlockUniqueId,
  getMachineStorage,
  setMachineStorage,
  getMachineSlotItem,
  removeBlockFromScoreboards,
};

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
