import * as ipc from "mcbe-addon-ipc";
import { Block, DimensionLocation } from "@minecraft/server";
import {
  MangledNetworkEstablishPayload,
  MangledNetworkGetAllWithPayload,
  MangledNetworkGetWithPayload,
  MangledNetworkInstanceMethodPayload,
  MangledNetworkIsPartOfNetworkPayload,
  MangledNetworkQueueSendPayload,
} from "./network_internal.js";
import { DIRECTION_VECTORS } from "./misc_internal.js";
import { Vector3Utils } from "@minecraft/math";
import {
  getBlockNetworkConnectionType,
  NetworkConnectionType,
} from "./network_utils.js";
import { getBlockIoCategories } from "./io.js";
import { makeSerializableDimensionLocation } from "./serialize_utils.js";

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
   * This will force a new network to be established if any of the machines inside it still exist.
   * Use this function to force network updates.
   * @see {@link MachineNetwork.updateAdjacent}, {@link MachineNetwork.updateWith}, {@link MachineNetwork.updateWithBlock}
   * @beta
   */
  destroy(): void {
    const payload: MangledNetworkInstanceMethodPayload = {
      a: this.id,
    };

    void ipc.sendAuto(
      "fluffyalien_energisisticscore:ipc.networkDestroy",
      payload,
    );
  }

  /**
   * Tests if a machine matching the arguments is inside of this network.
   * @beta
   */
  isPartOfNetwork(
    location: DimensionLocation,
    type: NetworkConnectionType,
  ): Promise<boolean> {
    const payload: MangledNetworkIsPartOfNetworkPayload = {
      a: this.id,
      b: makeSerializableDimensionLocation(location),
      c: type,
    };

    return ipc.invokeAuto(
      "fluffyalien_energisticscore:ipc.networkIsPartOfNetwork",
      payload,
    ) as Promise<boolean>;
  }

  /**
   * Tests if a block is inside of this network.
   * @beta
   */
  async isBlockPartOfNetwork(block: Block): Promise<boolean> {
    const type = getBlockNetworkConnectionType(block);
    if (!type) return false;
    return this.isPartOfNetwork(block, type);
  }

  /**
   * Queue sending a storage type over this machine network.
   * @beta
   * @remarks
   * - Note: in most cases, prefer {@link generate} over this function.
   * - Automatically sets the machine's reserve storage to the amount that was not received.
   * @param blockLocation The location of the machine that is sending the storage type.
   * @param type The storage type to send.
   * @param amount The amount to send. Must be greater than zero.
   * @see {@link generate}
   */
  queueSend(
    blockLocation: DimensionLocation,
    type: string,
    amount: number,
  ): void {
    const payload: MangledNetworkQueueSendPayload = {
      a: this.id,
      b: makeSerializableDimensionLocation(blockLocation),
      c: type,
      d: amount,
    };

    void ipc.sendAuto(
      "fluffyalien_energisisticscore:ipc.networkQueueSend",
      payload,
    );
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

    const id = (await ipc.invokeAuto(
      "fluffyalien_energisticscore:ipc.networkEstablish",
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

    const id = (await ipc.invokeAuto(
      "fluffyalien_energisticscore:ipc.networkGetWith",
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

    const ids = (await ipc.invokeAuto(
      "fluffyalien_energisticscore:ipc.networkGetAllWith",
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

    const id = (await ipc.invokeAuto(
      "fluffyalien_energisticscore:ipc.networkGetOrEstablish",
      payload,
    )) as number | null;

    if (id) {
      return new MachineNetwork(id);
    }
  }

  /**
   * Update all {@link MachineNetwork}s adjacent to a location.
   * @param categories Only update networks of these I/O categories. If this is `undefined` then all adjacent networks will be updated.
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
   * Update all {@link MachineNetwork}s that can connect to a machine.
   * @remarks
   * "Connectable" means that the network is adjacent to the machine and shares an I/O category.
   * @beta
   */
  static async updateConnectable(block: Block): Promise<void> {
    const ioCategories = getBlockIoCategories(block);

    return MachineNetwork.updateAdjacent(
      block,
      ioCategories === "any" ? undefined : ioCategories,
    );
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
