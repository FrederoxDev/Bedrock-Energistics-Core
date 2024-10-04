import {
  DimensionLocation,
  ScoreboardObjective,
  Vector3,
  world,
} from "@minecraft/server";
import { UiElement } from "./registry_types.js";

const VERSION = "0.1.0";

export interface SerializableDimensionLocation extends Vector3 {
  dimension: string;
}

export interface MangledRegisteredMachine {
  /**
   * description.id
   */
  a: string;
  /**
   * description.persistentEntity
   */
  b?: boolean;
  /**
   * description.ui.elements
   */
  c?: Record<string, UiElement>;
  /**
   * updateUiEvent
   */
  d?: string;
  /**
   * description.entityId
   */
  e?: string;
  /**
   * receiveHandlerEvent
   */
  f?: string;
  /**
   * description.maxStorage
   */
  g?: number;
  /**
   * onButtonPressedEvent
   */
  h?: string;
}

export interface MangledRecieveHandlerPayload {
  /**
   * blockLocation
   */
  a: SerializableDimensionLocation;
  /**
   * recieveType
   */
  b: string;
  /**
   * recieveAmount
   */
  c: number;
}

export interface MangledOnButtonPressedPayload {
  /**
   * blockLocation
   */
  a: SerializableDimensionLocation;
  /**
   * playerId
   */
  b: string;
  /**
   * entityId
   */
  c: string;
  /**
   * elementId
   */
  d: string;
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

export function removeBlockFromScoreboards(loc: DimensionLocation): void {
  const participantId = getBlockUniqueId(loc);

  for (const objective of world.scoreboard.getObjectives()) {
    objective.removeParticipant(participantId);
  }
}

function makeLogString(logLevel: string, message: string): string {
  return `[Bedrock Energistics Core API v${VERSION}] ${logLevel} ${message}`;
}

export function makeErrorString(message: string): string {
  return makeLogString("ERROR", message);
}

export function logInfo(message: string): void {
  console.info(makeLogString("INFO", message));
}
