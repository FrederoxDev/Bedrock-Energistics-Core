import {
  DimensionLocation,
  ItemStack,
  ScoreboardObjective,
  world,
} from "@minecraft/server";
import { MachineUiItemSlotElement } from "../registry";
import { machineChangedItemSlots } from "./ui";
import {
  getBlockUniqueId,
  getScore,
  getMachineStorage,
  setMachineStorage,
} from "@/public_api/src/machine_data";

export { getBlockUniqueId, getMachineStorage, setMachineStorage };

function getItemTypeScoreboard(slot: number): ScoreboardObjective {
  const id = `fluffyalien_energisticscore:itemtype${slot.toString()}`;
  return world.scoreboard.getObjective(id) ?? world.scoreboard.addObjective(id);
}

function getItemCountScoreboard(slot: number): ScoreboardObjective {
  const id = `fluffyalien_energisticscore:itemcount${slot.toString()}`;
  return world.scoreboard.getObjective(id) ?? world.scoreboard.addObjective(id);
}

export function removeBlockFromScoreboards(loc: DimensionLocation): void {
  const participantId = getBlockUniqueId(loc);

  for (const objective of world.scoreboard.getObjectives()) {
    objective.removeParticipant(participantId);
  }
}

export interface MachineItemStack {
  type: number;
  count: number;
}

export function getItemInMachineSlot(
  loc: DimensionLocation,
  slot: number,
): MachineItemStack | undefined {
  const participantId = getBlockUniqueId(loc);

  const itemType = getScore(getItemTypeScoreboard(slot), participantId);
  if (itemType === undefined) {
    return;
  }

  const itemCount = getScore(getItemCountScoreboard(slot), participantId);
  if (!itemCount) {
    return;
  }

  return {
    type: itemType,
    count: itemCount,
  };
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
  element: MachineUiItemSlotElement,
  machineItem?: MachineItemStack,
): ItemStack {
  return machineItem
    ? new ItemStack(element.allowedItems[machineItem.type], machineItem.count)
    : new ItemStack("fluffyalien_energisticscore:ui_empty_slot");
}
