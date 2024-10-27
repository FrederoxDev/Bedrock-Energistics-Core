import { SerializableDimensionLocation } from "./internal.js";
import { NetworkConnectionType } from "./network.js";

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
