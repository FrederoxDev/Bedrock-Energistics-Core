import { Block, Dimension, Vector3 } from "@minecraft/server";
import { NetworkLinkNode } from "./network_link_node.js";
import { makeError } from "../internal.js";

export const NETWORK_LINK_BLOCK_TAG = "fluffyalien_energisticscore:network_link";
export const NETWORK_LINK_ENTITY_ID = "fluffyalien_energisticscore:network_link";
export const NETWORK_LINK_POSITIONS_KEY = "fluffyalien_energisticscore:linked_positions";

/**
 * Finds the `NetworkLinkNode` associated with this block, or creates it if it doesn't exist
 * 
 * @param block Expected to have the `fluffyalien_energisticscore:network_link` block tag
 * @returns The `NetworkLinkNode` at the block location
 * @throws When the `NetworkLinkNode` does not exist yet, and the block at this location does not have the correct tags
 */
export function getNetworkLink(block: Block): NetworkLinkNode {
    let dataStorageEntity = block.dimension.getEntitiesAtBlockLocation(block.location)
    .filter(e => e.typeId === NETWORK_LINK_ENTITY_ID)[0];

    // Only verify the block tag when creating an entity, this is easier for after events when the network link block  
    // is destroyed, but we still need to get it to cleanup.
    if (!dataStorageEntity && !block.hasTag(NETWORK_LINK_BLOCK_TAG)) 
        makeError(`NetworkLinks::getNetworkLink expected block of id: '${block.typeId}' to have the '${NETWORK_LINK_BLOCK_TAG}' tag before creating a network link storage entity at this location`);

    // Spawn entity if tag check passed and it is null.
    dataStorageEntity ??= block.dimension.spawnEntity(NETWORK_LINK_ENTITY_ID, block.location);
    return new NetworkLinkNode(dataStorageEntity, block.location);
}

/**
 * Finds the `NetworkLinkNode` associated with this location, or undefined if it does not exist yet
 * @param dimension The dimension the block is in
 * @param location The location of the block
 * @returns The associated `NetworkLinkNode` or `undefined` if it does not exist
 */
export function tryGetNetworkLinkAt(dimension: Dimension, location: Vector3): NetworkLinkNode | undefined {
    let dataStorageEntity = dimension.getEntitiesAtBlockLocation(location)
        .filter(e => e.typeId === NETWORK_LINK_ENTITY_ID)[0];

    if (dataStorageEntity === undefined) return undefined;
    return new NetworkLinkNode(dataStorageEntity, location);
}