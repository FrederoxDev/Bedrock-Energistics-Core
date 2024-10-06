import { Block, BlockCustomComponent, Entity, Vector3 } from "@minecraft/server";
import { getBlockIoCategories } from "./io";
import { MachineNetwork } from "./network";
import { makeErrorString } from "./utils/log";
import { Vector3Utils } from "@minecraft/math";
import { NetworkLinks } from "@/public_api/src"

export const NETWORK_LINK_ENTITY = "fluffyalien_energisticscore:network_link";

export const networkLinkComponent: BlockCustomComponent = {
    onPlace(ev) {
        const linkNode = NetworkLinks.getNetworkLink(ev.block);
        linkNode.addConnection({ x: -34, y: -59, z: -1 }); 

        const ioCategories = getBlockIoCategories(ev.block);
        MachineNetwork.updateAdjacent(
            ev.block,
            ioCategories === "any" ? undefined : ioCategories
        );
    },

    onPlayerDestroy(ev) {
        const linkNode = NetworkLinks.tryGetNetworkLinkAt(ev.dimension, ev.block.location);
        
        // remove all incoming and outbound links to this node in the network
        if (linkNode) linkNode.destroyNode();
 
        // update the rest of the blocks in the network.
        MachineNetwork.updateWithBlock(ev.block);
    },
};