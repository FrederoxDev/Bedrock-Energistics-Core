/////////////////////////////////////////////////
//  internal file, do not export to index.ts!  //
//  do not put any end api user content inside //
// intended for shared types that arent public //
/////////////////////////////////////////////////

import { Vector3 } from "@minecraft/server";
import { SerializableDimensionLocation } from "../internal.js";

export const NETWORK_LINK_BLOCK_TAG = "fluffyalien_energisticscore:network_link";
export const NETWORK_LINK_ENTITY_ID = "fluffyalien_energisticscore:network_link";
export const NETWORK_LINK_POSITIONS_KEY = "fluffyalien_energisticscore:linked_positions";

export type NetworkLinkGetRequest = { self: SerializableDimensionLocation };
export type NetworkLinkGetResponse = { locations: Vector3[] };
export type NetworkLinkAddRequest = { self: SerializableDimensionLocation, other: Vector3 };
export type NetworkLinkRemoveRequest = { self: SerializableDimensionLocation, other: Vector3 };
export type NetworkLinkDestroyRequest = { self: SerializableDimensionLocation };