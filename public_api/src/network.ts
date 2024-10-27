import { Block, BlockPermutation, DimensionLocation } from "@minecraft/server";
import { invokeScriptEvent } from "mcbe-addon-ipc";
import { getInitNamespace } from "./init.js";
import {
  MangledNetworkEstablishPayload,
  MangledNetworkGetAllWithPayload,
  MangledNetworkGetWithPayload,
} from "./network_internal.js";
import {
  DIRECTION_VECTORS,
  makeSerializableDimensionLocation,
} from "./internal.js";
import { Vector3Utils } from "@minecraft/math";

export enum NetworkConnectionType {
  Conduit = "Conduit",
  Machine = "Machine",
  NetworkLink = "NetworkLink",
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
 * A network of machines with a certain I/O category.
 * @beta
 * @privateRemarks
 * This class routes method calls to Bedrock Energistics Core via IPC.
 * - DO NOT USE THIS CLASS IN THE ADD-ON
 */
export class MachineNetwork {
  private constructor(
    /**
     * Unique ID for this network.
     * @beta
     */
    readonly id: number,
  ) {}

  /**
   * Destroy this object.
   * @beta
   */
  destroy(): void {
    // TODO
    throw new Error("unimplemented");
  }

  /**
   * Establish a new network at `location`.
   * @beta
   */
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

  /**
   * Get the {@link MachineNetwork} that contains a machine that matches the arguments.
   * @param category the category of the network.
   * @beta
   */
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

  /**
   * Get the {@link MachineNetwork} that contains a block.
   * @beta
   */
  static async getWithBlock(
    category: string,
    block: Block,
  ): Promise<MachineNetwork | undefined> {
    const type = getBlockNetworkConnectionType(block);
    if (!type) return;
    return MachineNetwork.getWith(category, block, type);
  }

  /**
   * Get all {@link MachineNetwork}s that contain a machine that matches the arguments.
   * @beta
   */
  static async getAllWith(
    location: DimensionLocation,
    type: NetworkConnectionType,
  ): Promise<MachineNetwork[]> {
    const payload: MangledNetworkGetAllWithPayload = {
      a: makeSerializableDimensionLocation(location),
      b: type,
    };

    const ids = (await invokeScriptEvent(
      "fluffyalien_energisticscore:ipc.networkGetAllWith",
      getInitNamespace(),
      payload,
    )) as number[];

    return ids.map((id) => new MachineNetwork(id));
  }

  /**
   * Get all {@link MachineNetwork}s that contain a block.
   * @beta
   */
  static async getAllWithBlock(block: Block): Promise<MachineNetwork[]> {
    const type = getBlockNetworkConnectionType(block);
    if (!type) return [];
    return MachineNetwork.getAllWith(block, type);
  }

  /**
   * Get the {@link MachineNetwork} that contains a block if it exists,
   * otherwise establish a network using the block as the origin if it doesn't exist.
   * @see {@link MachineNetwork.getWithBlock}, {@link MachineNetwork.establish}
   * @beta
   */
  static async getOrEstablish(
    category: string,
    location: DimensionLocation,
  ): Promise<MachineNetwork | undefined> {
    // this can be done without a dedicated script event handler,
    // but invoking one handler is faster than two

    const payload: MangledNetworkEstablishPayload = {
      a: category,
      b: makeSerializableDimensionLocation(location),
    };

    const id = (await invokeScriptEvent(
      "fluffyalien_energisticscore:ipc.networkGetOrEstablish",
      getInitNamespace(),
      payload,
    )) as number | null;

    if (id) {
      return new MachineNetwork(id);
    }
  }

  /**
   * Update all {@link MachineNetwork}s adjacent to a location.
   * @beta
   */
  static async updateAdjacent(
    location: DimensionLocation,
    categories?: string[],
  ): Promise<void> {
    for (const directionVector of DIRECTION_VECTORS) {
      const blockInDirection = location.dimension.getBlock(
        Vector3Utils.add(location, directionVector),
      );
      if (!blockInDirection) {
        continue;
      }

      if (categories) {
        for (const category of categories) {
          void MachineNetwork.getWithBlock(category, blockInDirection).then(
            (network) => network?.destroy(),
          );
        }
        continue;
      }

      for (const network of await MachineNetwork.getAllWithBlock(
        blockInDirection,
      )) {
        network.destroy();
      }
    }
  }

  /**
   * Update all {@link MachineNetwork}s that contain a machine that matches the arguments.
   * @beta
   */
  static async updateWith(
    location: DimensionLocation,
    type: NetworkConnectionType,
  ): Promise<void> {
    for (const network of await MachineNetwork.getAllWith(location, type)) {
      network.destroy();
    }
  }

  /**
   * Update all {@link MachineNetwork}s that contain a block.
   * @beta
   */
  static async updateWithBlock(block: Block): Promise<void> {
    for (const network of await MachineNetwork.getAllWithBlock(block)) {
      network.destroy();
    }
  }
}
