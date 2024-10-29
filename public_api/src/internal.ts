import { Vector3 } from "@minecraft/server";
import { UiElement } from "./registry_types.js";
import {
  VECTOR3_EAST,
  VECTOR3_WEST,
  VECTOR3_UP,
  VECTOR3_DOWN,
} from "@minecraft/math";
import { SerializableDimensionLocation } from "./serialize_utils.js";

export const DIRECTION_VECTORS: Vector3[] = [
  { x: 0, y: 0, z: -1 },
  VECTOR3_EAST,
  { x: 0, y: 0, z: 1 },
  VECTOR3_WEST,
  VECTOR3_UP,
  VECTOR3_DOWN,
];

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
