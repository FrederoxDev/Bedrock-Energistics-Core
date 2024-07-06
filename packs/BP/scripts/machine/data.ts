import {
  DimensionLocation,
  ItemStack,
  ScoreboardObjective,
  world,
} from "@minecraft/server";
import {
  MachineStorageType,
  MachineUiItemSlotElement,
} from "@/core_interface/src/registry_types";
import { machineChangedItemSlots } from "./ui";

function getStorageScoreboard(type: MachineStorageType): ScoreboardObjective {
  const id = `fluffyalien_energisticscore:storage${type}`;
  return world.scoreboard.getObjective(id) ?? world.scoreboard.addObjective(id);
}

function getItemTypeScoreboard(slot: number): ScoreboardObjective {
  const id = `fluffyalien_energisticscore:itemtype${slot.toString()}`;
  return world.scoreboard.getObjective(id) ?? world.scoreboard.addObjective(id);
}

function getItemCountScoreboard(slot: number): ScoreboardObjective {
  const id = `fluffyalien_energisticscore:itemcount${slot.toString()}`;
  return world.scoreboard.getObjective(id) ?? world.scoreboard.addObjective(id);
}

export function getBlockUniqueId(loc: DimensionLocation): string {
  return (
    loc.dimension.id + loc.x.toString() + loc.y.toString() + loc.z.toString()
  );
}

function getScore(
  objective: ScoreboardObjective,
  participant: string,
): number | undefined {
  if (!objective.hasParticipant(participant)) {
    return;
  }

  return objective.getScore(participant);
}

export function removeBlockFromScoreboards(loc: DimensionLocation): void {
  const participantId = getBlockUniqueId(loc);

  for (const objective of world.scoreboard.getObjectives()) {
    objective.removeParticipant(participantId);
  }
}

export function getMachineStorage(
  loc: DimensionLocation,
  type: MachineStorageType,
): number {
  return getScore(getStorageScoreboard(type), getBlockUniqueId(loc)) ?? 0;
}

export function setMachineStorage(
  loc: DimensionLocation,
  type: MachineStorageType,
  value: number,
): void {
  getStorageScoreboard(type).setScore(getBlockUniqueId(loc), value);
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
