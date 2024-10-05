import { BlockCustomComponent } from "@minecraft/server";
import { getBlockIoCategories } from "./io";
import { MachineNetwork } from "./network";

export const networkLinkComponent: BlockCustomComponent = {
    onPlace(ev) {
        const ioCategories = getBlockIoCategories(ev.block);
        MachineNetwork.updateAdjacent(
            ev.block,
            ioCategories === "any" ? undefined : ioCategories
        );
    },

    onPlayerDestroy(ev) {
        MachineNetwork.updateWithBlock(ev.block);
    },
}