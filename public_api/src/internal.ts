import {
  DimensionLocation,
  ScoreboardObjective,
  world,
} from "@minecraft/server";
import { StorageType } from "./registry_types";

export function serializeDimensionLocation(loc: DimensionLocation): string {
  return JSON.stringify({
    dimension: loc.dimension.id,
    x: loc.x,
    y: loc.y,
    z: loc.z,
  });
}

export function getBlockUniqueId(loc: DimensionLocation): string {
  return (
    loc.dimension.id +
    Math.floor(loc.x).toString() +
    Math.floor(loc.y).toString() +
    Math.floor(loc.z).toString()
  );
}

export function getStorageScoreboard(type: StorageType): ScoreboardObjective {
  const id = `fluffyalien_energisticscore:storage${type}`;
  return world.scoreboard.getObjective(id) ?? world.scoreboard.addObjective(id);
}

export function getItemTypeScoreboard(slot: number): ScoreboardObjective {
  const id = `fluffyalien_energisticscore:itemtype${slot.toString()}`;
  return world.scoreboard.getObjective(id) ?? world.scoreboard.addObjective(id);
}

export function getItemCountScoreboard(slot: number): ScoreboardObjective {
  const id = `fluffyalien_energisticscore:itemcount${slot.toString()}`;
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
