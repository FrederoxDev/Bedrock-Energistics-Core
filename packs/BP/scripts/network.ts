import { Block, Dimension, Vector3, system } from "@minecraft/server";
import { Vector3Utils } from "@minecraft/math";
import { DestroyableObject } from "./utils/destroyable";
import { logInfo, makeErrorString } from "./utils/log";
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

    logInfo(
      `MachineNetwork created, new count: ${MachineNetwork.networks.length.toString()}`,
    );
  }

  destroy(): void {
    super.destroy();

    system.clearRun(this.intervalId);

    const i = MachineNetwork.networks.indexOf(this);
    if (i === -1) return;

    MachineNetwork.networks.splice(i, 1);

    logInfo(
      `MachineNetwork destroyed, new count: ${MachineNetwork.networks.length.toString()}`,
    );
  }

  /**
   * processes the `sendQueue`. sends energy, gas, or fluid to the consumers in the network starting
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

  private static discoverConnections(origin: Block): NetworkConnections {
    const connections: NetworkConnections = {
      conduits: [],
      machines: [],
    };

    const originHasEnergyIo = origin.hasTag(
      "fluffyalien_energisticscore:io.energy",
    );
    const originHasFluidIo = origin.hasTag(
      "fluffyalien_energisticscore:io.fluid",
    );
    const originHasGasIo = origin.hasTag("fluffyalien_energisticscore:io.gas");

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

      const nextHasEnergyIo = nextBlock.hasTag(
        "fluffyalien_energisticscore:io.energy",
      );
      const nextHasFluidIo = nextBlock.hasTag(
        "fluffyalien_energisticscore:io.fluid",
      );
      const nextHasGasIo = nextBlock.hasTag("fluffyalien_energistics:io.gas");

      if (
        ((originHasEnergyIo && nextHasEnergyIo) ||
          (originHasFluidIo && nextHasFluidIo) ||
          (originHasGasIo && nextHasGasIo)) &&
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

  static establish(block: Block): MachineNetwork | undefined {
    const connections = MachineNetwork.discoverConnections(block);
    if (!connections.machines.length) {
      return;
    }

    return new MachineNetwork(block.dimension, connections);
  }

  static get(block: Block): MachineNetwork | undefined {
    return MachineNetwork.networks.find((network) =>
      network.isPartOfNetwork(block),
    );
  }

  static getOrEstablish(block: Block): MachineNetwork | undefined {
    return MachineNetwork.get(block) ?? MachineNetwork.establish(block);
  }

  static updateAdjacent(block: Block): void {
    for (const direction of STR_DIRECTIONS) {
      const blockInDirection = getBlockInDirection(block, direction);
      if (!blockInDirection) {
        continue;
      }

      MachineNetwork.get(blockInDirection)?.destroy();
    }
  }
}
