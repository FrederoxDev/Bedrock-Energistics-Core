import {
  Block,
  BlockCustomComponent,
  DimensionLocation,
  Entity,
  system,
  world,
} from "@minecraft/server";
import {
  getMachineSlotItemUnsafe,
  optionalMachineItemStackToItemStack,
  removeBlockFromScoreboards,
} from "./data";
import { MachineNetwork } from "./network";
import { raise } from "./utils/log";
import { Vector3Utils } from "@minecraft/math";
import { RegisteredMachine } from "@/public_api/src";
import {
  getMachineIdFromEntityId,
  InternalRegisteredMachine,
} from "./machine_registry";
import { removeAllDynamicPropertiesForBlock } from "./utils/dynamic_property";

export function removeMachine(
  block: Block,
  definition: InternalRegisteredMachine,
): void {
  MachineNetwork.updateWithBlock(block);

  system.run(() => {
    dropItemsStoredInMachine(block, definition);
    removeBlockFromScoreboards(block);
    removeAllDynamicPropertiesForBlock(block);
  });
}

export function spawnMachineEntity(block: Block, entityId: string): Entity {
  // there is a similar function to this one in the public api.
  // if this is changed, then ensure the public api function is
  // changed as well.
  const entity = block.dimension.spawnEntity(entityId, block.bottomCenter());
  entity.nameTag = block.typeId;
  return entity;
}

export const machineNoInteractComponent: BlockCustomComponent = {
  onPlace(e) {
    if (e.block.typeId === e.previousBlock.type.id) return;
    MachineNetwork.updateAdjacent(e.block);

    const definition = InternalRegisteredMachine.getInternal(e.block.typeId);
    if (!definition) {
      raise(
        `The block '${e.block.typeId}' uses the 'fluffyalien_energisticscore:machine' custom component but it could not be found in the machine registry.`,
      );
    }

    if (definition.persistentEntity) {
      spawnMachineEntity(e.block, definition.entityId);
    }
  },
};

export const machineComponent: BlockCustomComponent = {
  ...machineNoInteractComponent,
  onPlayerInteract(e) {
    const definition = InternalRegisteredMachine.getInternal(e.block.typeId);
    if (!definition) {
      raise(
        `The block '${e.block.typeId}' uses the 'fluffyalien_energisticscore:machine' custom component but it could not be found in the machine registry.`,
      );
    }
    if (!definition.uiElements || definition.persistentEntity) {
      return;
    }

    spawnMachineEntity(e.block, definition.entityId);
  },
};

export function dropItemsStoredInMachine(
  blockLocation: DimensionLocation,
  definition: RegisteredMachine,
): void {
  if (!definition.uiElements) {
    return;
  }

  for (const [elementId, element] of definition.uiElements) {
    if (element.type !== "itemSlot") continue;

    const item = getMachineSlotItemUnsafe(blockLocation, elementId);
    if (item) {
      blockLocation.dimension.spawnItem(
        optionalMachineItemStackToItemStack(item),
        Vector3Utils.add(blockLocation, { x: 0.5, y: 0.5, z: 0.5 }),
      );
    }
  }
}

world.beforeEvents.playerBreakBlock.subscribe((e) => {
  if (!e.block.hasTag("fluffyalien_energisticscore:machine")) {
    return;
  }

  const definition = InternalRegisteredMachine.getInternal(e.block.typeId);
  if (!definition) {
    raise(
      `The block '${e.block.typeId}' has the 'fluffyalien_energisticscore:machine' tag but it could not be found in the machine registry.`,
    );
  }

  if (definition.persistentEntity) {
    return;
  }

  removeMachine(e.block, definition);
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

  const machineId = getMachineIdFromEntityId(e.hitEntity.typeId);
  if (!machineId) {
    raise(
      `The entity '${e.hitEntity.typeId}' has the 'fluffyalien_energisticscore:machine_entity' type family but it is not attached to a machine block.`,
    );
  }

  const definition = InternalRegisteredMachine.forceGetInternal(machineId);
  if (definition.persistentEntity) {
    return;
  }

  e.hitEntity.remove();
});

world.afterEvents.entitySpawn.subscribe((e) => {
  const entity = e.entity;
  if (!entity.isValid) return; // Entities can become invalid if they're spawned and removed in the same tick.

  if (
    !entity
      .getComponent("type_family")
      ?.hasTypeFamily("fluffyalien_energisticscore:machine_entity")
  ) {
    return;
  }

  // machine entities can be spawned via the public api
  // but dynamic properties are sandboxed,
  // so set the dynamic property in this event
  e.entity.setDynamicProperty(
    "block_location",
    Vector3Utils.floor(e.entity.location),
  );
});
