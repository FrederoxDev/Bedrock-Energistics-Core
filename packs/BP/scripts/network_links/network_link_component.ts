import { BlockCustomComponent } from "@minecraft/server";
import { getBlockIoCategories } from "@/public_api/src";
import { MachineNetwork } from "../network";
import {
  deserializeDimensionLocation,
  SerializableDimensionLocation,
} from "@/public_api/src/serialize_utils";
import { InternalNetworkLinkNode } from "./network_link_internal";
import { raise } from "../utils/log";

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
  if (!block) raise(`_getNetwork failed to get block`);
  return InternalNetworkLinkNode.fromBlock(block);
}
