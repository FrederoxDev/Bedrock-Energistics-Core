import { BlockCustomComponent, world } from "@minecraft/server";
import { getBlockIoCategories } from "../io";
import { MachineNetwork } from "../network";
import { registerScriptEventHandler } from "mcbe-addon-ipc";
import { deserializeDimensionLocation, makeError, SerializableDimensionLocation } from "@/public_api/src/internal";
import { NetworkLinkGetRequest, NetworkLinkGetResponse, NetworkLinkAddRequest, NetworkLinkRemoveRequest, NetworkLinkDestroyRequest } from "@/public_api/src/network_links/ipc_events";
import { NetworkLinkNodeInternal } from "./network_link_internal";

export const networkLinkComponent: BlockCustomComponent = {
    onPlace(ev) {
        const ioCategories = getBlockIoCategories(ev.block);
        MachineNetwork.updateAdjacent(
            ev.block,
            ioCategories === "any" ? undefined : ioCategories
        );
    },

    onPlayerDestroy(ev) {
        const linkNode = NetworkLinkNodeInternal.tryGetAt(ev.dimension, ev.block.location);

        // remove all incoming and outbound links to this node in the network
        if (linkNode) linkNode.destroyNode();
 
        // update the rest of the blocks in the network.
        MachineNetwork.updateWithBlock(ev.block);
    },
};

function _getNetwork(self: SerializableDimensionLocation) {
    const location = deserializeDimensionLocation(self);
    const block = location.dimension.getBlock(location);
    if (!block) makeError(`_getNetwork failed to get block`);
    return NetworkLinkNodeInternal.fromBlock(block);
}

registerScriptEventHandler<NetworkLinkGetRequest, NetworkLinkGetResponse>("fluffyalien_energisticscore:ipc.network_link_get", (payload => {
    const link = _getNetwork(payload.self);
    return { locations: link.getConnections() }; 
}))

registerScriptEventHandler<NetworkLinkAddRequest, void>("fluffyalien_energisticscore:ipc.network_link_add", (payload => {
    const link = _getNetwork(payload.self);
    link.addConnection(payload.other);
    return {};
}))

registerScriptEventHandler<NetworkLinkRemoveRequest, void>("fluffyalien_energisticscore:ipc.network_link_remove", (payload => {
    const link = _getNetwork(payload.self);
    link.removeConnection(payload.other);
    return {};
}))

registerScriptEventHandler<NetworkLinkDestroyRequest, void>("fluffyalien_energisticscore:ipc.network_link_destroy", (payload => {
    const link = _getNetwork(payload.self);
    link.destroyNode();
    return {};
}))