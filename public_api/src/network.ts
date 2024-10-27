import { Block, BlockPermutation, DimensionLocation } from "@minecraft/server";
import { invokeScriptEvent } from "mcbe-addon-ipc";
import { getInitNamespace } from "./init.js";
import {
  MangledNetworkEstablishPayload,
  MangledNetworkGetWithPayload,
} from "./network_internal.js";
import { makeSerializableDimensionLocation } from "./internal.js";

export enum NetworkConnectionType {
  Conduit,
  Machine,
  NetworkLink,
}

export function getBlockNetworkConnectionType(
  block: Block | BlockPermutation,
): NetworkConnectionType | null {
  if (block.hasTag("fluffyalien_energisticscore:conduit"))
    return NetworkConnectionType.Conduit;
  if (block.hasTag("fluffyalien_energisticscore:machine"))
    return NetworkConnectionType.Machine;
  if (block.hasTag("fluffyalien_energisticscore:network_link"))
    return NetworkConnectionType.NetworkLink;
  return null;
}

/**
 *
 */
export class MachineNetwork {
  /**
   * @internal
   */
  constructor(
    /**
     * Unique ID for this network
     */
    readonly id: number,
  ) {}

  static async establish(
    category: string,
    location: DimensionLocation,
  ): Promise<MachineNetwork | undefined> {
    const payload: MangledNetworkEstablishPayload = {
      a: category,
      b: makeSerializableDimensionLocation(location),
    };

    const id = (await invokeScriptEvent(
      "fluffyalien_energisticscore:ipc.networkEstablish",
      getInitNamespace(),
      payload,
    )) as number | null;

    if (id) {
      return new MachineNetwork(id);
    }
  }

  static async getWith(
    category: string,
    location: DimensionLocation,
    type: NetworkConnectionType,
  ): Promise<MachineNetwork | undefined> {
    const payload: MangledNetworkGetWithPayload = {
      a: category,
      b: makeSerializableDimensionLocation(location),
      c: type,
    };

    const id = (await invokeScriptEvent(
      "fluffyalien_energisticscore:ipc.networkGetWith",
      getInitNamespace(),
      payload,
    )) as number | null;

    if (id) {
      return new MachineNetwork(id);
    }
  }
}
