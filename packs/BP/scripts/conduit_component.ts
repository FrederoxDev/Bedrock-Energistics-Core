import { BlockCustomComponent, world } from "@minecraft/server";
import { MachineNetwork } from "./network";
import { getBlockIoCategories } from "./io";

export const conduitComponent: BlockCustomComponent = {
  onPlace(e) {
    if (e.block.typeId === e.previousBlock.type.id) return;

    const ioCategories = getBlockIoCategories(e.block);
    MachineNetwork.updateAdjacent(
      e.block,
      ioCategories === "any" ? undefined : ioCategories,
    );
  },
};

world.beforeEvents.playerBreakBlock.subscribe((e) => {
  if (!e.block.hasTag("fluffyalien_energisticscore:conduit")) {
    return;
  }

  MachineNetwork.updateBlockNetworks(e.block);
});
