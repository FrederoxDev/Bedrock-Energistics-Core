import { Block, BlockCustomComponent, system, world } from "@minecraft/server";
import { MACHINE_SYSTEMS } from "./systems";
import { STR_DIRECTIONS, getBlockInDirection } from "../utils/direction";
import { EnergyNetwork } from "../conduit_network/energy_network";
import {
  getItemInMachineSlot,
  getMachineStorage,
  machineItemStackToItemStack,
  removeBlockFromScoreboards,
  setMachineStorage,
} from "./data";
import { makeErrorString } from "../utils/log";
import {
  machineRegistry,
  StorageType,
  RegisteredMachine,
  StateManagerCondition,
} from "../registry";

function resolveStateManagerCondition(
  condition: StateManagerCondition,
  block: Block,
  storageChanges: Partial<Record<StorageType, number>>,
): boolean {
  if ("all" in condition) {
    return condition.all.every((cond) =>
      resolveStateManagerCondition(cond, block, storageChanges),
    );
  }

  if ("any" in condition) {
    return condition.any.some((cond) =>
      resolveStateManagerCondition(cond, block, storageChanges),
    );
  }

  let testVal: number;

  switch (condition.test) {
    case "energyChange":
      testVal = storageChanges.energy ?? 0;
      break;
    case "storedEnergy":
      testVal = getMachineStorage(block, "energy");
      break;
  }

  switch (condition.operator) {
    case "!=":
      return testVal !== condition.value;
    case "<":
      return testVal < condition.value;
    case "==":
      return testVal === condition.value;
    case ">":
      return testVal > condition.value;
  }
}

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

    const changes: Partial<Record<StorageType, number>> = {};

    for (const systemOptions of definition.systems) {
      const result = MACHINE_SYSTEMS[systemOptions.system].onTick({
        block,
        options: systemOptions,
        definition,
      });
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
      StorageType,
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
          if (!block.hasTag("fluffyalien_energisticscore:energy_consumer")) {
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

    if (definition.description.stateManager) {
      for (const stateSetter of definition.description.stateManager.states) {
        if (
          !resolveStateManagerCondition(
            stateSetter.condition,
            block,
            changes,
          ) ||
          block.permutation.getState(stateSetter.state) === stateSetter.value
        ) {
          continue;
        }

        block.setPermutation(
          block.permutation.withState(stateSetter.state, stateSetter.value),
        );
      }
    }
  },
};

world.beforeEvents.playerBreakBlock.subscribe((e) => {
  if (!(e.block.typeId in machineRegistry)) {
    return;
  }

  const definition = machineRegistry[e.block.typeId];

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
    for (const element of Object.values(definition.description.uiElements)) {
      if (element.type !== "itemSlot") continue;

      const item = getItemInMachineSlot(e.block, element.slotId);
      if (item) {
        e.dimension.spawnItem(
          machineItemStackToItemStack(element, item),
          e.block.center(),
        );
      }
    }

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
