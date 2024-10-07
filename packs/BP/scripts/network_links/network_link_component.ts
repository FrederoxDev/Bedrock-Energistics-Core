import { BlockCustomComponent } from "@minecraft/server";
import { getBlockIoCategories } from "../io";
import { MachineNetwork } from "../network";
import { registerScriptEventHandler } from "mcbe-addon-ipc";
import {
  deserializeDimensionLocation,
  makeError,
  SerializableDimensionLocation,
} from "@/public_api/src/internal";
import {
  NetworkLinkGetRequest,
  NetworkLinkGetResponse,
  NetworkLinkAddRequest,
  NetworkLinkRemoveRequest,
  NetworkLinkDestroyRequest,
} from "@/public_api/src/network_links/ipc_events";
import { NetworkLinkNode } from "./network_link_internal";

export const networkLinkComponent: BlockCustomComponent = {
  onPlace(ev) {
    const ioCategories = getBlockIoCategories(ev.block);
    MachineNetwork.updateAdjacent(
      ev.block,
      ioCategories === "any" ? undefined : ioCategories,
    );
  },

  onPlayerDestroy(ev) {
    const linkNode = NetworkLinkNode.tryGetAt(ev.dimension, ev.block.location);

    // remove all incoming and outbound links to this node in the network
    if (linkNode) linkNode.destroyNode();

    // update the rest of the blocks in the network.
    MachineNetwork.updateWithBlock(ev.block);
  },
};

function getNetwork(self: SerializableDimensionLocation): NetworkLinkNode {
  const location = deserializeDimensionLocation(self);
  const block = location.dimension.getBlock(location);
  if (!block) makeError(`_getNetwork failed to get block`);
  return NetworkLinkNode.fromBlock(block);
}

registerScriptEventHandler<NetworkLinkGetRequest, NetworkLinkGetResponse>(
  "fluffyalien_energisticscore:ipc.network_link_get",
  (payload) => {
    const link = getNetwork(payload.self);
    return { locations: link.getConnections() };
  },
);

registerScriptEventHandler<NetworkLinkAddRequest, object>(
  "fluffyalien_energisticscore:ipc.network_link_add",
  (payload) => {
    const link = getNetwork(payload.self);
    link.addConnection(payload.other);
    return {};
  },
);

registerScriptEventHandler<NetworkLinkRemoveRequest, object>(
  "fluffyalien_energisticscore:ipc.network_link_remove",
  (payload) => {
    const link = getNetwork(payload.self);
    link.removeConnection(payload.other);
    return {};
  },
);

registerScriptEventHandler<NetworkLinkDestroyRequest, object>(
  "fluffyalien_energisticscore:ipc.network_link_destroy",
  (payload) => {
    const link = getNetwork(payload.self);
    link.destroyNode();
    return {};
  },
);
