import { Block, Dimension, Vector3, system } from "@minecraft/server";
import { Vector3Utils } from "@minecraft/math";
import { DestroyableObject } from "../utils/destroyable";
import { makeErrorString } from "../utils/log";
import { MAX_MACHINE_STORAGE } from "../constants";
import { NetworkConnections, discoverConnections } from "./common";
import { getMachineStorage, setMachineStorage } from "../machine/data";

interface SendEnergyQueueItem {
  block: Block;
  amount: number;
}

export class EnergyNetwork extends DestroyableObject {
  private static readonly networks: EnergyNetwork[] = [];

  private sendEnergyJobRunning = false;
  private readonly sendEnergyQueue: SendEnergyQueueItem[] = [];
  private readonly intervalId: number;

  constructor(
    readonly dimension: Dimension,
    private readonly connections: NetworkConnections,
  ) {
    super();

    EnergyNetwork.networks.push(this);

    this.intervalId = system.runInterval(() => {
      if (this.sendEnergyJobRunning || !this.sendEnergyQueue.length) return;
      this.sendEnergyJobRunning = true;
      system.runJob(this.sendEnergy());
    }, 10); // this runs every 10t so if it runs behind it can catch up (machines tick every 20t)
  }

  destroy(): void {
    super.destroy();

    system.clearRun(this.intervalId);

    const i = EnergyNetwork.networks.indexOf(this);
    if (i === -1) return;

    EnergyNetwork.networks.splice(i, 1);
  }

  /**
   * processes the `sendEnergyQueue`. sends energy to the consumers in the network starting with the ones with the least stored energy.
   * automatically sets each generator's storage to the amount it sent that was not received.
   * returns automatically if the object is not valid.
   * note: some energy may not be sent anywhere.
   */
  private *sendEnergy(): Generator<void, void, void> {
    if (!this.isValid) return;

    interface Target {
      block: Block;
      currentEnergy: number;
    }

    const targets: Target[] = [];

    for (const block of this.connections.consumers) {
      const currentEnergy = getMachineStorage(block, "energy");

      if (currentEnergy >= MAX_MACHINE_STORAGE) {
        continue;
      }

      targets.push({
        block,
        currentEnergy,
      });

      yield;
    }

    targets.sort((a, b) => (a.currentEnergy > b.currentEnergy ? 1 : -1));

    yield;

    while (this.sendEnergyQueue.length) {
      const queuedSend = this.sendEnergyQueue.pop()!;

      let unsentAmount = queuedSend.amount;

      while (targets.length && unsentAmount > 0) {
        const target = targets.pop()!;

        const sendAmount = Math.min(
          MAX_MACHINE_STORAGE - target.currentEnergy,
          unsentAmount,
        );

        setMachineStorage(
          target.block,
          "energy",
          target.currentEnergy + sendAmount,
        );

        unsentAmount -= sendAmount;

        yield;
      }

      // set the generator's energy to the unsent amount
      setMachineStorage(
        queuedSend.block,
        "energy",
        Math.min(unsentAmount, MAX_MACHINE_STORAGE),
      );

      yield;
    }

    this.sendEnergyJobRunning = false;
  }

  /**
   * @throws if this object is not valid
   */
  isPartOfNetwork(block: Block): boolean {
    this.ensureValidity();

    if (block.dimension.id !== this.dimension.id) {
      return false;
    }

    const condition = (loc: Vector3): boolean =>
      Vector3Utils.equals(block.location, loc);

    if (block.typeId === "fluffyalien_energisticscore:energy_conduit") {
      return this.connections.conduits.some(condition);
    }

    if (block.hasTag("fluffyalien_energisticscore:energy_consumer")) {
      return this.connections.consumers.some(condition);
    }

    if (block.hasTag("fluffyalien_energisticscore:io_energy")) {
      return this.connections.generators.some(condition);
    }

    return false;
  }

  queueSendEnergy(block: Block, amount: number): void {
    if (amount <= 0) {
      throw new Error(makeErrorString("can't send 0 or less energy"));
    }

    this.sendEnergyQueue.push({ block, amount });
  }

  static establish(block: Block): EnergyNetwork | undefined {
    const connections = discoverConnections(block, "energy");
    if (!connections.generators.length && !connections.consumers.length) {
      return;
    }

    return new EnergyNetwork(block.dimension, connections);
  }

  static get(block: Block): EnergyNetwork | undefined {
    return EnergyNetwork.networks.find((network) =>
      network.isPartOfNetwork(block),
    );
  }

  static getOrEstablish(block: Block): EnergyNetwork | undefined {
    return EnergyNetwork.get(block) ?? EnergyNetwork.establish(block);
  }
}
