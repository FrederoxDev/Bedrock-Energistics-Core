import {
  DimensionLocation,
  ScoreboardObjective,
  Vector3,
  world,
} from "@minecraft/server";

const VERSION = "0.1.0";

export interface SerializableDimensionLocation extends Vector3 {
  dimension: string;
}

export function makeSerializableDimensionLocation(
  loc: DimensionLocation,
): SerializableDimensionLocation {
  return {
    dimension: loc.dimension.id,
    x: loc.x,
    y: loc.y,
    z: loc.z,
  };
}

export function deserializeDimensionLocation(
  loc: SerializableDimensionLocation,
): DimensionLocation {
  return {
    dimension: world.getDimension(loc.dimension),
    x: loc.x,
    y: loc.y,
    z: loc.z,
  };
}

export function getBlockUniqueId(loc: DimensionLocation): string {
  return (
    loc.dimension.id +
    Math.floor(loc.x).toString() +
    Math.floor(loc.y).toString() +
    Math.floor(loc.z).toString()
  );
}

export function getStorageScoreboardObjective(
  type: string,
): ScoreboardObjective | undefined {
  const id = `fluffyalien_energisticscore:storage${type}`;
  return world.scoreboard.getObjective(id);
}

export function getItemTypeScoreboardObjective(
  slot: number,
): ScoreboardObjective {
  const id = `fluffyalien_energisticscore:itemtype${slot.toString()}`;
  return world.scoreboard.getObjective(id) ?? world.scoreboard.addObjective(id);
}

export function getItemCountScoreboardObjective(
  slot: number,
): ScoreboardObjective {
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

function makeLogString(logLevel: string, message: string): string {
  return `[Bedrock Energistics Core API v${VERSION}] ${logLevel} ${message}`;
}

export function makeErrorString(message: string): string {
  return makeLogString("ERROR", message);
}
