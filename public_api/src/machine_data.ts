import {
  DimensionLocation,
  ScoreboardObjective,
  world,
} from "@minecraft/server";
import { StorageType } from "./registry_types";

export function getBlockUniqueId(loc: DimensionLocation): string {
  return (
    loc.dimension.id +
    Math.floor(loc.x).toString() +
    Math.floor(loc.y).toString() +
    Math.floor(loc.z).toString()
  );
}

function getStorageScoreboard(type: StorageType): ScoreboardObjective {
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

/**
 * Gets the storage of a specific type in a machine
 * @param loc the location of the machine
 * @param type the type of storage to get
 */
export function getMachineStorage(
  loc: DimensionLocation,
  type: StorageType,
): number {
  return getScore(getStorageScoreboard(type), getBlockUniqueId(loc)) ?? 0;
}

/**
 * Sets the storage of a specific type in a machine
 * @param loc the location of the machine
 * @param type the type of storage to set
 * @param value the new value
 */
export function setMachineStorage(
  loc: DimensionLocation,
  type: StorageType,
  value: number,
): void {
  getStorageScoreboard(type).setScore(getBlockUniqueId(loc), value);
}
