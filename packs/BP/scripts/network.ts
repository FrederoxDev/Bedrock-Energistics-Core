import {
  Block,
  BlockPermutation,
  Dimension,
  Vector3,
  system,
} from "@minecraft/server";
import { Vector3Utils } from "@minecraft/math";
import { DestroyableObject } from "./utils/destroyable";
import { logWarn, makeErrorString } from "./utils/log";
import { getMachineStorage, setMachineStorage } from "./data";
import {
  getBlockInDirection,
  STR_DIRECTIONS,
  StrDirection,
} from "./utils/direction";
import { InternalRegisteredMachine, machineRegistry } from "./registry";

interface SendQueueItem {
  block: Block;
  amount: number;
  type: string;
  definition: InternalRegisteredMachine;
}

interface NetworkConnections {
  conduits: Block[];
  machines: Block[];
}

type NetworkConnectionType = "conduit" | "machine";

export function getBlockNetworkConnectionType(
  block: Block | BlockPermutation,
): NetworkConnectionType | null {
  return block.hasTag("fluffyalien_energisticscore:conduit")
    ? "conduit"
    : block.hasTag("fluffyalien_energisticscore:machine")
      ? "machine"
      : null;
}

export class MachineNetwork extends DestroyableObject {
  private static readonly networks: MachineNetwork[] = [];

  private sendJobRunning = false;
  private readonly sendQueue: SendQueueItem[] = [];
  private readonly intervalId: number;

  constructor(
    readonly category: string,
    readonly dimension: Dimension,
    private readonly connections: NetworkConnections,
  ) {
    super();

    MachineNetwork.networks.push(this);

    this.intervalId = system.runInterval(() => {
      if (this.sendJobRunning || !this.sendQueue.length) return;
      this.sendJobRunning = true;
      system.runJob(this.send());
    }, 2);
  }

  destroy(): void {
    super.destroy();

    system.clearRun(this.intervalId);

    const i = MachineNetwork.networks.indexOf(this);
    if (i === -1) return;

    MachineNetwork.networks.splice(i, 1);
  }

  /**
   * processes the `sendQueue`. sends storage types to the consumers in the network starting
   * with the ones with the least stored.
   * automatically sets each generator's storage to the amount it sent that was not received.
   * returns automatically if the object is not valid.
   */
  private *send(): Generator<void, void, void> {
    if (!this.isValid) return;

    interface Target {
      block: Block;
      amount: number;
      definition: InternalRegisteredMachine;
    }

    const targets: Record<string, Target[]> = {};

    while (this.sendQueue.length) {
      const queuedSend = this.sendQueue.pop()!;
      if (!(queuedSend.type in targets)) {
        const targetsArr: Target[] = [];

        for (const block of this.connections.machines) {
          if (
            !block.hasTag(
              `fluffyalien_energisticscore:consumer.${queuedSend.type}`,
            ) &&
            !block.hasTag("fluffyalien_energisticscore:consumer._any")
          ) {
            yield;
            continue;
          }

          const definition = machineRegistry[block.typeId] as
            | InternalRegisteredMachine
            | undefined;

          if (!definition) {
            logWarn(
              `can't send '${queuedSend.type}' to machine '${block.typeId}': this block is configured as a machine but it couldn't be found in the machine registry`,
            );
            yield;
            continue;
          }

          const amount = getMachineStorage(block, queuedSend.type);

          if (amount >= definition.maxStorage) {
            yield;
            continue;
          }

          targetsArr.push({
            block,
            amount,
            definition,
          });

          yield;
        }

        targetsArr.sort((a, b) => (a.amount > b.amount ? 1 : -1));

        targets[queuedSend.type] = targetsArr;

        yield;
      }

      let unsentAmount = queuedSend.amount;

      for (const target of targets[queuedSend.type]) {
        // we cannot use target.amount because it may be outdated since this is a job
        // so get the actual current amount
        const currentAmount = getMachineStorage(target.block, queuedSend.type);

        let sendAmount = Math.min(
          target.definition.maxStorage - currentAmount,
          unsentAmount,
        );

        if (target.definition.recieveHandlerEvent) {
          let result: number | undefined;

          target.definition
            .invokeRecieveHandler(target.block, queuedSend.type, sendAmount)
            .then((value) => {
              result = value;
            })
            .catch((err: unknown) => {
              logWarn(
                `failed to call the 'recieve' handler (ID: '${target.definition.recieveHandlerEvent!}') for machine '${target.definition.id}': ${err instanceof Error || typeof err === "string" ? err.toString() : "unknown error"}. this may cause significant delays when sending storage types`,
              );
              result = sendAmount;
            });

          while (result === undefined) {
            yield;
          }

          sendAmount = result;
        }

        setMachineStorage(
          target.block,
          queuedSend.type,
          currentAmount + sendAmount,
        );

        unsentAmount -= sendAmount;

        yield;
      }

      setMachineStorage(
        queuedSend.block,
        queuedSend.type,
        Math.min(unsentAmount, queuedSend.definition.maxStorage),
      );

      yield;
    }

    this.sendJobRunning = false;
  }

  /**
   * Tests if a block matching the arguments is inside of this network
   * @throws if this object is not valid
   */
  isPartOfNetwork(
    dimension: Dimension,
    location: Vector3,
    type: NetworkConnectionType,
  ): boolean {
    this.ensureValidity();

    if (dimension.id !== this.dimension.id) {
      return false;
    }

    const condition = (other: Block): boolean =>
      Vector3Utils.equals(location, other.location);

    if (type === "conduit") {
      return this.connections.conduits.some(condition);
    }

    return this.connections.machines.some(condition);
  }

  /**
   * Tests if a block is inside of this network
   * @throws if this object is not valid
   */
  isBlockPartOfNetwork(block: Block): boolean {
    const type = getBlockNetworkConnectionType(block);
    if (!type) return false;
    return this.isPartOfNetwork(block.dimension, block.location, type);
  }

  queueSend(block: Block, type: string, amount: number): void {
    if (amount <= 0) {
      throw new Error(
        makeErrorString("can't send <= 0 (MachineNetwork#queueSend)"),
      );
    }

    const definition = machineRegistry[block.typeId] as
      | InternalRegisteredMachine
      | undefined;

    if (!definition) {
      throw new Error(
        makeErrorString(
          `can't queue sending '${type}' from machine '${block.typeId}': the machine to send from could not be found in the machine registry`,
        ),
      );
    }

    this.sendQueue.push({ block, type, amount, definition });
  }

  private static discoverConnections(
    origin: Block,
    category: string,
  ): NetworkConnections {
    const connections: NetworkConnections = {
      conduits: [],
      machines: [],
    };

    const stack: Block[] = [];
    const visitedLocations: Vector3[] = [];

    function handleBlock(block: Block): void {
      stack.push(block);
      visitedLocations.push(block.location);

      if (block.hasTag("fluffyalien_energisticscore:conduit")) {
        connections.conduits.push(block);
        return;
      }

      connections.machines.push(block);
      return;
    }

    function next(currentBlock: Block, direction: StrDirection): void {
      const nextBlock = getBlockInDirection(currentBlock, direction);
      if (!nextBlock) {
        return;
      }

      if (
        (nextBlock.hasTag(`fluffyalien_energisticscore:io.${category}`) ||
          nextBlock.hasTag("fluffyalien_energisticscore:io._any")) &&
        !visitedLocations.some((loc) =>
          Vector3Utils.equals(loc, nextBlock.location),
        )
      ) {
        handleBlock(nextBlock);
      }
    }

    handleBlock(origin);

    while (stack.length) {
      const block = stack.pop()!;

      next(block, "north");
      next(block, "east");
      next(block, "south");
      next(block, "west");
      next(block, "up");
      next(block, "down");
    }

    return connections;
  }

  static establish(category: string, block: Block): MachineNetwork | undefined {
    const connections = MachineNetwork.discoverConnections(block, category);
    if (!connections.machines.length) {
      return;
    }

    return new MachineNetwork(category, block.dimension, connections);
  }

  /**
   * Get the {@link MachineNetwork} that contains a block that match the arguments
   * @param category the category of the network
   */
  static get(
    category: string,
    dimension: Dimension,
    location: Vector3,
    type: NetworkConnectionType,
  ): MachineNetwork | undefined {
    return MachineNetwork.networks.find(
      (network) =>
        network.category === category &&
        network.isPartOfNetwork(dimension, location, type),
    );
  }

  /**
   * Get the {@link MachineNetwork} that contains a block
   */
  static getBlockNetwork(
    category: string,
    block: Block,
  ): MachineNetwork | undefined {
    const type = getBlockNetworkConnectionType(block);
    if (!type) return;
    return this.get(category, block.dimension, block.location, type);
  }

  /**
   * Get all {@link MachineNetwork}s that contain a block that match the arguments
   */
  static getAll(
    dimension: Dimension,
    location: Vector3,
    type: NetworkConnectionType,
  ): MachineNetwork[] {
    return MachineNetwork.networks.filter((network) =>
      network.isPartOfNetwork(dimension, location, type),
    );
  }

  /**
   * Get all {@link MachineNetwork}s that contain a block
   */
  static getAllBlockNetworks(block: Block): MachineNetwork[] {
    const type = getBlockNetworkConnectionType(block);
    if (!type) return [];
    return this.getAll(block.dimension, block.location, type);
  }

  static getOrEstablish(
    category: string,
    block: Block,
  ): MachineNetwork | undefined {
    return (
      MachineNetwork.getBlockNetwork(category, block) ??
      MachineNetwork.establish(category, block)
    );
  }

  /**
   * Update all {@link MachineNetwork}s adjacent to a block
   */
  static updateAdjacent(block: Block, categories?: string[]): void {
    for (const direction of STR_DIRECTIONS) {
      const blockInDirection = getBlockInDirection(block, direction);
      if (!blockInDirection) {
        continue;
      }

      if (categories) {
        for (const category of categories) {
          MachineNetwork.getBlockNetwork(category, blockInDirection)?.destroy();
        }
        continue;
      }

      for (const network of MachineNetwork.getAllBlockNetworks(
        blockInDirection,
      )) {
        network.destroy();
      }
    }
  }

  /**
   * Update all {@link MachineNetwork}s that contain a block that matches the arguments
   */
  static updateWith(
    dimension: Dimension,
    location: Vector3,
    type: NetworkConnectionType,
  ): void {
    for (const network of MachineNetwork.getAll(dimension, location, type)) {
      network.destroy();
    }
  }

  /**
   * Update all {@link MachineNetwork}s that contain a block
   */
  static updateWithBlock(block: Block): void {
    for (const network of MachineNetwork.getAllBlockNetworks(block)) {
      network.destroy();
    }
  }
}
