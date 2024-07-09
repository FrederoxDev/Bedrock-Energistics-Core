import { DimensionLocation, ItemStack, world } from "@minecraft/server";
import { UiItemSlotElement } from "./registry";
import { machineChangedItemSlots } from "./ui";
import {
  getMachineStorage,
  setMachineStorage,
  MachineItemStack,
  getItemInMachineSlot,
} from "@/public_api/src";
import {
  getBlockUniqueId,
  getItemTypeScoreboard,
  getItemCountScoreboard,
} from "@/public_api/src/internal";

export {
  getBlockUniqueId,
  getMachineStorage,
  setMachineStorage,
  getItemInMachineSlot,
};

export function removeBlockFromScoreboards(loc: DimensionLocation): void {
  const participantId = getBlockUniqueId(loc);

  for (const objective of world.scoreboard.getObjectives()) {
    objective.removeParticipant(participantId);
  }
}

export function setItemInMachineSlot(
  loc: DimensionLocation,
  slot: number,
  newItemStack?: MachineItemStack,
  setChanged = true,
): void {
  const uid = getBlockUniqueId(loc);
  const itemTypeObjective = getItemTypeScoreboard(slot);
  const itemCountObjective = getItemCountScoreboard(slot);

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

  itemTypeObjective.setScore(uid, newItemStack.type);
  itemCountObjective.setScore(uid, newItemStack.count);
}

export function machineItemStackToItemStack(
  element: UiItemSlotElement,
  machineItem?: MachineItemStack,
): ItemStack {
  return machineItem
    ? new ItemStack(element.allowedItems[machineItem.type], machineItem.count)
    : new ItemStack("fluffyalien_energisticscore:ui_empty_slot");
}
