import { BlockCustomComponent, Vector3 } from "@minecraft/server";
import { getBlockIoCategories } from "./io";
import { MachineNetwork } from "./network";
import { makeErrorString } from "./utils/log";

export const networkLinkComponent: BlockCustomComponent = {
    onPlace(ev) {
        // spawn a data storage entity at this location, used for storing the linked positions.
        const storageEntity = ev.dimension.spawnEntity("fluffyalien_energisticscore:network_link", ev.block.location);
        storageEntity.setDynamicProperty("fluffyalien_energisticscore:linked_positions", '[{"x": -34, "y": -60, "z": -1}]')

        const ioCategories = getBlockIoCategories(ev.block);
        MachineNetwork.updateAdjacent(
            ev.block,
            ioCategories === "any" ? undefined : ioCategories
        );
    },

    onPlayerDestroy(ev) {
        // Find the associated data storage entity with this block.
        const dataStorageEntity = ev.dimension.getEntitiesAtBlockLocation(ev.block.location)
            .filter(e => e.typeId === "fluffyalien_energisticscore:network_link")[0];

        if (dataStorageEntity === undefined) throw new Error(
            makeErrorString("NetworkLinkComponent::onPlayerDestroy failed to find data entity associated with this block")
        );

        const rawData = dataStorageEntity.getDynamicProperty("fluffyalien_energisticscore:linked_positions") as string ?? "[]";
        const data = JSON.parse(rawData) as Vector3[];

        console.log("data", JSON.stringify(data));

        // destroy the entity
        dataStorageEntity.triggerEvent("fluffyalien_energisticscore:despawn");
 
        // update the rest of the blocks in the network.
        MachineNetwork.updateWithBlock(ev.block);
    },
}