import {
  DimensionLocation,
  ScoreboardObjective,
  world,
} from "@minecraft/server";

/**
 * @internal
 */
export function getBlockUniqueId(loc: DimensionLocation): string {
  return (
    loc.dimension.id +
    Math.floor(loc.x).toString() +
    Math.floor(loc.y).toString() +
    Math.floor(loc.z).toString()
  );
}

/**
 * @internal
 */
export function getStorageScoreboardObjective(
  type: string,
): ScoreboardObjective | undefined {
  const id = `fluffyalien_energisticscore:storage${type}`;
  return world.scoreboard.getObjective(id);
}

/**
 * @internal
 */
export function getItemTypeScoreboardObjective(
  slot: number,
): ScoreboardObjective {
  const id = `fluffyalien_energisticscore:itemtype${slot.toString()}`;
  return world.scoreboard.getObjective(id) ?? world.scoreboard.addObjective(id);
}

/**
 * @internal
 */
export function getItemCountScoreboardObjective(
  slot: number,
): ScoreboardObjective {
  const id = `fluffyalien_energisticscore:itemcount${slot.toString()}`;
  return world.scoreboard.getObjective(id) ?? world.scoreboard.addObjective(id);
}

/**
 * @internal
 */
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
 * @internal
 */
export function removeBlockFromScoreboards(loc: DimensionLocation): void {
  const participantId = getBlockUniqueId(loc);

  for (const objective of world.scoreboard.getObjectives()) {
    objective.removeParticipant(participantId);
  }
}
