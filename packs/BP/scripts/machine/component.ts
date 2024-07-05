import { BlockCustomComponent, system, world } from "@minecraft/server";
import { MACHINE_SYSTEMS } from "./systems";
import { STR_DIRECTIONS, getBlockInDirection } from "../utils/direction";
import { EnergyNetwork } from "../conduit_network/energy_network";
import {
  getMachineStorage,
  removeBlockFromScoreboards,
  setMachineStorage,
} from "./data";
import { makeErrorString } from "../utils/log";
import {
  machineRegistry,
  MachineStorageType,
  RegisteredMachine,
} from "../registry";

export const machineComponent: BlockCustomComponent = {
  onPlace(e) {
    if (e.block.typeId === e.previousBlock.type.id) return;

    // update adjacent networks
    const hasEnergyIo = e.block.hasTag("fluffyalien_energisticscore:io_energy");
    // const hasGasIo = e.block.hasTag("fluffyalien_energisticscore:io_gas");
    // const hasFluidIo = e.block.hasTag("fluffyalien_energisticscore:io_fluid");

    for (const direction of STR_DIRECTIONS) {
      const blockInDirection = getBlockInDirection(e.block, direction);
      if (!blockInDirection) {
        continue;
      }

      if (hasEnergyIo) {
        EnergyNetwork.get(blockInDirection)?.destroy();
      }

      // if (hasGasIo) {
      //   GasNetwork.get(blockInDirection)?.destroy();
      // }

      // if (hasFluidIo) {
      //   FluidNetwork.get(blockInDirection)?.destroy();
      // }
    }
  },
  onPlayerInteract(e) {
    e.block.dimension.spawnEntity(
      e.block.typeId + "_entity",
      e.block.bottomCenter(),
    ).nameTag = e.block.typeId;
  },
  onTick({ block }) {
    const definition = machineRegistry[block.typeId] as
      | RegisteredMachine
      | undefined;
    if (!definition) {
      throw new Error(
        makeErrorString(
          `'${block.typeId}' uses the 'fluffyalien_energisticscore:machine' component but it was not registered as a machine`,
        ),
      );
    }

    const changes: Partial<Record<MachineStorageType, number>> = {};

    for (const [id, options] of Object.entries(definition.systems)) {
      const result = MACHINE_SYSTEMS[id].onTick({ block, options, definition });
      if (!result) continue;

      for (const changeOptions of result) {
        if (changeOptions.type in changes) {
          changes[changeOptions.type]! += changeOptions.change;
          continue;
        }

        changes[changeOptions.type] = changeOptions.change;
      }
    }

    for (const [type, change] of Object.entries(changes) as [
      MachineStorageType,
      number,
    ][]) {
      if (!block.hasTag(`fluffyalien_energisticscore:io_${type}`)) {
        throw new Error(
          makeErrorString(
            `machine '${block.typeId}' is trying to add ${change.toString()} to '${type}' but it doesn't have the 'fluffyalien_energisticscore:io_${type}' tag`,
          ),
        );
      }

      switch (type) {
        case "energy": {
          if (block.hasTag("fluffyalien_energisticscore:io_energy")) {
            const storedEnergy = getMachineStorage(block, "energy");

            const sendAmount = storedEnergy + change;
            if (sendAmount <= 0) {
              return;
            }

            EnergyNetwork.getOrEstablish(block)?.queueSendEnergy(
              block,
              sendAmount,
            );

            break;
          }

          setMachineStorage(
            block,
            "energy",
            getMachineStorage(block, "energy") + change,
          );
          break;
        }
      }
    }
  },
};

world.beforeEvents.playerBreakBlock.subscribe((e) => {
  if (e.block.hasTag("fluffyalien_energisticscore:io_energy")) {
    EnergyNetwork.get(e.block)?.destroy();
  }

  // if (e.block.hasTag("fluffyalien_energisticscore:io_gas")) {
  //   GasNetwork.get(e.block)?.destroy();
  // }

  // if (e.block.hasTag("fluffyalien_energisticscore:io_fluid")) {
  //   FluidNetwork.get(e.block)?.destroy();
  // }

  system.run(() => {
    removeBlockFromScoreboards(e.block);
  });
});

world.afterEvents.entityHitEntity.subscribe((e) => {
  if (
    e.damagingEntity.typeId !== "minecraft:player" ||
    !e.hitEntity.matches({
      families: ["fluffyalien_energisticscore:machine_entity"],
    })
  ) {
    return;
  }

  e.hitEntity.remove();
});
