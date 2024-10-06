import { Block, BlockCustomComponent, Entity, Vector3 } from "@minecraft/server";
import { getBlockIoCategories } from "./io";
import { MachineNetwork } from "./network";
import { makeErrorString } from "./utils/log";
import { Vector3Utils } from "@minecraft/math";
import { NetworkLinkGetResponse, NetworkLinks } from "@/public_api/src"
import { registerScriptEventHandler } from "mcbe-addon-ipc";
import { deserializeDimensionLocation, SerializableDimensionLocation } from "@/public_api/src/internal";

export const networkLinkComponent: BlockCustomComponent = {
    onPlace(ev) {
        const ioCategories = getBlockIoCategories(ev.block);
        MachineNetwork.updateAdjacent(
            ev.block,
            ioCategories === "any" ? undefined : ioCategories
        );
    },

    onPlayerDestroy(ev) {
        const linkNode = NetworkLinks.tryGetNetworkLinkAt(ev.dimension, ev.block.location);
        
        // remove all incoming and outbound links to this node in the network
        // if (linkNode) linkNode.destroyNode();
 
        // update the rest of the blocks in the network.
        MachineNetwork.updateWithBlock(ev.block);
    },
};

registerScriptEventHandler<SerializableDimensionLocation, NetworkLinkGetResponse>("fluffyalien_energisticscore:ipc.network_link_get", (payload => {
    const location = deserializeDimensionLocation(payload);
    
    console.log("event recv", JSON.stringify(location));

    return { locations: [] }; 
}))