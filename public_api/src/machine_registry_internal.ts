import { NetworkStorageTypeData, UiElement } from "./machine_registry_types.js";
import { SerializableDimensionLocation } from "./serialize_utils.js";

/**
 * @internal
 */
export interface RegisteredMachineData {
  // definition
  id: string;
  entityId?: string;
  persistentEntity?: boolean;
  maxStorage?: number;
  uiElements?: Record<string, UiElement>;
  // script events
  updateUiEvent?: string;
  receiveHandlerEvent?: string;
  onButtonPressedEvent?: string;
  networkStatEvent?: string;
}

/**
 * @internal
 */
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

/**
 * @internal
 */
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

/**
 * @internal
 */
export interface IpcNetworkStatsEventArg {
  networkData: Record<string, NetworkStorageTypeData>;
  blockLocation: SerializableDimensionLocation;
}

/**
 * @internal
 */
export interface IpcMachineUpdateUiHandlerArg {
  blockLocation: SerializableDimensionLocation;
  entityId: string;
}
