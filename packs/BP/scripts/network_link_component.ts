import { Block, BlockCustomComponent, Entity, Vector3 } from "@minecraft/server";
import { getBlockIoCategories } from "./io";
import { MachineNetwork } from "./network";
import { makeErrorString } from "./utils/log";
import { Vector3Utils } from "@minecraft/math";

export const NETWORK_LINK_ENTITY = "fluffyalien_energisticscore:network_link";

export const networkLinkComponent: BlockCustomComponent = {
    onPlace(ev) {
        // spawn a data storage entity at this location, used for storing the linked positions.
        const storageEntity = ev.dimension.spawnEntity(NETWORK_LINK_ENTITY, ev.block.location);
        // storageEntity.setDynamicProperty("fluffyalien_energisticscore:linked_positions", '[]')
        createNetworkLinkConnection(ev.block, ev.dimension.getBlock({"x": -34, "y": -60, "z": -1})!);

        const ioCategories = getBlockIoCategories(ev.block);
        MachineNetwork.updateAdjacent(
            ev.block,
            ioCategories === "any" ? undefined : ioCategories
        );
    },

    onPlayerDestroy(ev) {
        const dataStorageEntity = getLinkStorageEntity(ev.block);
        if (!dataStorageEntity) throw new Error(
            makeErrorString("NetworkLinkComponent::onPlayerDestroy failed to find data entity associated with this block")
        );

        // links are two way, so remove the link to this current node in the other
        const connections = getNetworkLinkConnections(dataStorageEntity);

        for (const connection of connections) {
            const otherBlock = ev.dimension.getBlock(connection);
            if (!otherBlock) continue;

            const otherStorageEntity = getLinkStorageEntity(otherBlock);
            if (!otherStorageEntity) continue;

            const filteredSet = getNetworkLinkConnections(otherStorageEntity)
                .filter(v => !Vector3Utils.equals(v, ev.block.location));

            setNetworkLinkConnections(otherStorageEntity, filteredSet);
        }

        // destroy the entity
        dataStorageEntity.triggerEvent("fluffyalien_energisticscore:despawn");
 
        // update the rest of the blocks in the network.
        MachineNetwork.updateWithBlock(ev.block);
    },
};

export function getLinkStorageEntity(block: Block): Entity | undefined {
    const dataStorageEntity = block.dimension.getEntitiesAtBlockLocation(block.location)
        .filter(e => e.typeId === NETWORK_LINK_ENTITY)[0];

    return dataStorageEntity;
}

export function getNetworkLinkConnections(dataStorageEntity: Entity): Vector3[] {
    const rawData = dataStorageEntity.getDynamicProperty("fluffyalien_energisticscore:linked_positions") as string ?? "[]";
    return JSON.parse(rawData) as Vector3[];
}

export function setNetworkLinkConnections(dataStorageEntity: Entity, connections: Vector3[]): void {
    dataStorageEntity.setDynamicProperty("fluffyalien_energisticscore:linked_positions", JSON.stringify(connections));
}

export function createNetworkLinkConnection(a: Block, b: Block) {
    if (a.dimension.id !== b.dimension.id) 
        throw new Error("[createNetworkLinkConnection] Blocks are in different dimensions, this case has not been tested.");

    const aEntity = getLinkStorageEntity(a) ?? a.dimension.spawnEntity(NETWORK_LINK_ENTITY, a.location);
    const bEntity = getLinkStorageEntity(b) ?? b.dimension.spawnEntity(NETWORK_LINK_ENTITY, b.location);

    setNetworkLinkConnections(aEntity, [...getNetworkLinkConnections(aEntity), b.location]);
    setNetworkLinkConnections(bEntity, [...getNetworkLinkConnections(bEntity), a.location]);
}