import { BlockCustomComponent, system, world } from "@minecraft/server";
import {
  getItemInMachineSlot,
  machineItemStackToItemStack,
  removeBlockFromScoreboards,
} from "./data";
import { machineRegistry } from "./registry";
import { MachineNetwork } from "./network";

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
};

world.beforeEvents.playerBreakBlock.subscribe((e) => {
  if (!e.block.hasTag("fluffyalien_energisticscore:machine")) {
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
