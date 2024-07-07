import { Block, BlockCustomComponent, system, world } from "@minecraft/server";
import { MACHINE_SYSTEMS } from "./systems";
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
import { MachineNetwork } from "../network";

function resolveStateManagerCondition(
  condition: StateManagerCondition,
  block: Block,
  storageChanges: Partial<Record<StorageType, number>>,
): boolean {
  let testVal: number;

  switch (condition.test) {
    case "all":
      return condition.conditions.every((cond) =>
        resolveStateManagerCondition(cond, block, storageChanges),
      );
    case "any":
      return condition.conditions.some((cond) =>
        resolveStateManagerCondition(cond, block, storageChanges),
      );
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
    MachineNetwork.updateAdjacent(e.block);
  },
  onPlayerInteract(e) {
    e.block.dimension.spawnEntity(
      e.block.typeId,
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

    const network = MachineNetwork.getOrEstablish(block);
    if (!network) return;

    for (const [type, change] of Object.entries(changes) as [
      StorageType,
      number,
    ][]) {
      if (!block.hasTag(`fluffyalien_energisticscore:io.${type}`)) {
        throw new Error(
          makeErrorString(
            `machine '${block.typeId}' is trying to add ${change.toString()} to '${type}' but it doesn't have the 'fluffyalien_energisticscore:io.${type}' tag`,
          ),
        );
      }

      if (block.hasTag(`fluffyalien_energisticscore:consumer.${type}`)) {
        setMachineStorage(block, type, getMachineStorage(block, type) + change);
        continue;
      }

      const stored = getMachineStorage(block, type);

      const sendAmount = stored + change;
      if (sendAmount <= 0) {
        return;
      }

      network.queueSend(block, type, sendAmount);
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

  MachineNetwork.get(e.block)?.destroy();

  const definition = machineRegistry[e.block.typeId];

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
