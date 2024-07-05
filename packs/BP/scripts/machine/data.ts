import {
  DimensionLocation,
  ScoreboardObjective,
  world,
} from "@minecraft/server";
import { MachineStorageType } from "../registry";

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

function getBlockParticipantId(loc: DimensionLocation): string {
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
  const participantId = getBlockParticipantId(loc);

  for (const objective of world.scoreboard.getObjectives()) {
    objective.removeParticipant(participantId);
  }
}

export function getMachineStorage(
  loc: DimensionLocation,
  type: MachineStorageType,
): number {
  return getScore(getStorageScoreboard(type), getBlockParticipantId(loc)) ?? 0;
}

export function setMachineStorage(
  loc: DimensionLocation,
  type: MachineStorageType,
  value: number,
): void {
  getStorageScoreboard(type).setScore(getBlockParticipantId(loc), value);
}

export interface MachineItemStack {
  type: number;
  count: number;
}

export function getItemInMachineSlot(
  loc: DimensionLocation,
  slot: number,
): MachineItemStack | undefined {
  const participantId = getBlockParticipantId(loc);

  const itemType = getScore(getItemTypeScoreboard(slot), participantId);
  if (!itemType) {
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

export function removeItemInMachineSlot(
  loc: DimensionLocation,
  slot: number,
): void {
  const participantId = getBlockParticipantId(loc);

  getItemTypeScoreboard(slot).removeParticipant(participantId);
  getItemCountScoreboard(slot).removeParticipant(participantId);
}

export function setItemInMachineSlot(
  loc: DimensionLocation,
  slot: number,
  newItemStack: MachineItemStack,
): void {
  const participantId = getBlockParticipantId(loc);

  getItemTypeScoreboard(slot).setScore(participantId, newItemStack.type);
  getItemCountScoreboard(slot).setScore(participantId, newItemStack.count);
}
