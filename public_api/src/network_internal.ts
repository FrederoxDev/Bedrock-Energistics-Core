import { SerializableDimensionLocation } from "./internal.js";
import { NetworkConnectionType } from "./network.js";

export interface MangledNetworkInstanceMethodPayload {
  /**
   * networkId
   */
  a: number;
}

export interface MangledNetworkQueueSendPayload
  extends MangledNetworkInstanceMethodPayload {
  /**
   * location
   */
  b: SerializableDimensionLocation;
  /**
   * type
   */
  c: string;
  /**
   * amount
   */
  d: number;
}

export interface MangledNetworkEstablishPayload {
  /**
   * category
   */
  a: string;
  /**
   * blockLocation
   */
  b: SerializableDimensionLocation;
}

export interface MangledNetworkGetWithPayload {
  /**
   * category
   */
  a: string;
  /**
   * location
   */
  b: SerializableDimensionLocation;
  /**
   * type
   */
  c: NetworkConnectionType;
}

export interface MangledNetworkGetAllWithPayload {
  /**
   * location
   */
  a: SerializableDimensionLocation;
  /**
   * type
   */
  b: NetworkConnectionType;
}

export interface MangledNetworkIsPartOfNetworkPayload
  extends MangledNetworkInstanceMethodPayload {
  /**
   * location
   */
  b: SerializableDimensionLocation;
  /**
   * type
   */
  c: NetworkConnectionType;
}
