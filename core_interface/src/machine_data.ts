import {
  DimensionLocation,
  ScoreboardObjective,
  world,
} from "@minecraft/server";
import { MachineStorageType } from "./registry_types";

export function getBlockUniqueId(loc: DimensionLocation): string {
  return (
    loc.dimension.id + loc.x.toString() + loc.y.toString() + loc.z.toString()
  );
}

function getStorageScoreboard(type: MachineStorageType): ScoreboardObjective {
  const id = `fluffyalien_energisticscore:storage${type}`;
  return world.scoreboard.getObjective(id) ?? world.scoreboard.addObjective(id);
}

export function getScore(
  objective: ScoreboardObjective,
  participant: string,
): number | undefined {
  if (!objective.hasParticipant(participant)) {
    return;
  }

  return objective.getScore(participant);
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
