import { Block, Dimension, Vector3, system } from "@minecraft/server";
import { Vector3Utils } from "@minecraft/math";
import { DestroyableObject } from "./utils/destroyable";
import { makeErrorString } from "./utils/log";
import { MAX_MACHINE_STORAGE } from "./constants";
import { getMachineStorage, setMachineStorage } from "./data";
import {
  getBlockInDirection,
  STR_DIRECTIONS,
  StrDirection,
} from "./utils/direction";

interface SendQueueItem {
  block: Block;
  amount: number;
  type: string;
}

interface NetworkConnections {
  conduits: Block[];
  machines: Block[];
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
    }, 5);
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
            )
          ) {
            continue;
          }

          const amount = getMachineStorage(block, queuedSend.type);

          if (amount >= MAX_MACHINE_STORAGE) {
            continue;
          }

          targetsArr.push({
            block,
            amount,
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

        const sendAmount = Math.min(
          MAX_MACHINE_STORAGE - currentAmount,
          unsentAmount,
        );

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
        Math.min(unsentAmount, MAX_MACHINE_STORAGE),
      );

      yield;
    }

    this.sendJobRunning = false;
  }

  /**
   * @throws if this object is not valid
   */
  isPartOfNetwork(block: Block): boolean {
    this.ensureValidity();

    if (block.dimension.id !== this.dimension.id) {
      return false;
    }

    const condition = (other: Block): boolean =>
      Vector3Utils.equals(block.location, other.location);

    if (block.hasTag("fluffyalien_energisticscore:conduit")) {
      return this.connections.conduits.some(condition);
    }

    if (block.hasTag("fluffyalien_energisticscore:machine")) {
      return this.connections.machines.some(condition);
    }

    return false;
  }

  queueSend(block: Block, type: string, amount: number): void {
    if (amount <= 0) {
      throw new Error(
        makeErrorString("can't send <= 0 (MachineNetwork#queueSend)"),
      );
    }

    this.sendQueue.push({ block, type, amount });
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
        nextBlock.hasTag(`fluffyalien_energisticscore:io.${category}`) &&
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

  static get(category: string, block: Block): MachineNetwork | undefined {
    return MachineNetwork.networks.find(
      (network) =>
        network.category === category && network.isPartOfNetwork(block),
    );
  }

  static getAll(block: Block): MachineNetwork[] {
    return MachineNetwork.networks.filter((network) =>
      network.isPartOfNetwork(block),
    );
  }

  static getOrEstablish(
    category: string,
    block: Block,
  ): MachineNetwork | undefined {
    return (
      MachineNetwork.get(category, block) ??
      MachineNetwork.establish(category, block)
    );
  }

  static updateAdjacent(block: Block, categories?: string[]): void {
    for (const direction of STR_DIRECTIONS) {
      const blockInDirection = getBlockInDirection(block, direction);
      if (!blockInDirection) {
        continue;
      }

      if (categories) {
        for (const category of categories) {
          MachineNetwork.get(category, blockInDirection)?.destroy();
        }
        continue;
      }

      for (const network of MachineNetwork.getAll(blockInDirection)) {
        network.destroy();
      }
    }
  }

  static updateBlockNetworks(block: Block): void {
    for (const network of MachineNetwork.getAll(block)) {
      network.destroy();
    }
  }
}
