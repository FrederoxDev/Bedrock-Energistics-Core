import { BlockCustomComponent } from "@minecraft/server";
import { getBlockIoCategories } from "../io";
import { MachineNetwork } from "../network";
import {
  deserializeDimensionLocation,
  makeError,
  SerializableDimensionLocation,
} from "@/public_api/src/internal";
import { InternalNetworkLinkNode } from "./network_link_internal";

export const networkLinkComponent: BlockCustomComponent = {
  onPlace(ev) {
    const ioCategories = getBlockIoCategories(ev.block);
    MachineNetwork.updateAdjacent(
      ev.block,
      ioCategories === "any" ? undefined : ioCategories,
    );
  },

  onPlayerDestroy(ev) {
    const linkNode = InternalNetworkLinkNode.tryGetAt(
      ev.dimension,
      ev.block.location,
    );

    // remove all incoming and outbound links to this node in the network
    if (linkNode) linkNode.destroyNode();

    // update the rest of the blocks in the network.
    MachineNetwork.updateWithBlock(ev.block);
  },
};

export function getNetworkLinkNode(
  self: SerializableDimensionLocation,
): InternalNetworkLinkNode {
  const location = deserializeDimensionLocation(self);
  const block = location.dimension.getBlock(location);
  if (!block) makeError(`_getNetwork failed to get block`);
  return InternalNetworkLinkNode.fromBlock(block);
}
