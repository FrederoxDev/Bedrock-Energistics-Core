import { BlockCustomComponent, system, world } from "@minecraft/server";
import {
  getMachineSlotItem,
  machineItemStackToItemStack,
  removeBlockFromScoreboards,
} from "./data";
import {
  InternalRegisteredMachine,
  machineEntityToBlockIdMap,
  machineRegistry,
} from "./registry";
import { MachineNetwork } from "./network";
import { makeErrorString } from "./utils/log";

export const machineComponent: BlockCustomComponent = {
  onPlace(e) {
    if (e.block.typeId === e.previousBlock.type.id) return;
    MachineNetwork.updateAdjacent(e.block);

    const definition = machineRegistry[e.block.typeId] as
      | InternalRegisteredMachine
      | undefined;
    if (!definition) {
      throw new Error(
        makeErrorString(
          `can't process onPlace event for block '${e.block.typeId}': this block uses the 'fluffyalien_energisticscore:machine' custom component but it could not be found in the machine registry`,
        ),
      );
    }

    if (definition.persistentEntity) {
      e.block.dimension.spawnEntity(
        definition.entityId,
        e.block.bottomCenter(),
      ).nameTag = e.block.typeId;
    }
  },
  onPlayerInteract(e) {
    const definition = machineRegistry[e.block.typeId] as
      | InternalRegisteredMachine
      | undefined;
    if (!definition) {
      throw new Error(
        makeErrorString(
          `can't process onPlayerInteract event for block '${e.block.typeId}': this block uses the 'fluffyalien_energisticscore:machine' custom component but it could not be found in the machine registry`,
        ),
      );
    }
    if (!definition.uiElements || definition.persistentEntity) {
      return;
    }

    e.block.dimension.spawnEntity(
      definition.entityId,
      e.block.bottomCenter(),
    ).nameTag = e.block.typeId;
  },
};

world.beforeEvents.playerBreakBlock.subscribe((e) => {
  if (!e.block.hasTag("fluffyalien_energisticscore:machine")) {
    return;
  }

  MachineNetwork.updateBlockNetworks(e.block);

  const definition = machineRegistry[e.block.typeId] as
    | InternalRegisteredMachine
    | undefined;
  if (!definition) {
    throw new Error(
      makeErrorString(
        `can't process playerBreakBlock event for block '${e.block.typeId}': this block uses the 'fluffyalien_energisticscore:machine' custom component but it could not be found in the machine registry`,
      ),
    );
  }
  if (!definition.uiElements || definition.persistentEntity) {
    return;
  }

  system.run(() => {
    for (const element of Object.values(definition.uiElements!)) {
      if (element.type !== "itemSlot") continue;

      const item = getMachineSlotItem(e.block, element.slotId);
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
    !e.hitEntity
      .getComponent("type_family")
      ?.hasTypeFamily("fluffyalien_energisticscore:machine_entity")
  ) {
    return;
  }

  const machineId = machineEntityToBlockIdMap[e.hitEntity.typeId] as
    | string
    | undefined;
  if (!machineId) {
    throw new Error(
      makeErrorString(
        `can't process entityHitEntity event for machine entity '${e.hitEntity.typeId}': this entity has the 'fluffyalien_energisticscore:machine_entity' type family but it is not attached to a machine`,
      ),
    );
  }

  const definition = machineRegistry[machineId];
  if (definition.persistentEntity) {
    return;
  }

  e.hitEntity.remove();
});
