import { Block, Dimension, Entity, Vector3 } from "@minecraft/server";
import { makeError } from "../internal.js";
import { Vector3Utils } from "@minecraft/math";

const NETWORK_LINK_TAG = "fluffyalien_energisticscore:network_link";
const NETWORK_LINK_ENTITY = "fluffyalien_energisticscore:network_link";
const DATA_PROP_KEY = "fluffyalien_energisticscore:linked_positions";

export class NetworkLinks {
    /**
     * Finds the network link entity associated with a block, or creates it if it doesn't exist yet.
     * @param block
     * @throws If the block does not have the `fluffyalien_energisticscore:network_link` block tag
     * @returns The associated network link node
     */
    static getNetworkLink(block: Block): NetworkLinkNode {
        let dataStorageEntity = block.dimension.getEntitiesAtBlockLocation(block.location)
            .filter(e => e.typeId === NETWORK_LINK_ENTITY)[0];

        // Only verify the block tag when creating an entity, this is easier for after events when the network link block  
        // is destroyed, but we still need to get it to cleanup.
        if (!dataStorageEntity && !block.hasTag(NETWORK_LINK_TAG)) 
            makeError(`NetworkLinks::getNetworkLink expected block of id: '${block.typeId}' to have the '${NETWORK_LINK_TAG}' tag before creating a network link storage entity at this location`);
        
        // Spawn entity if tag check passed and it is null.
        dataStorageEntity ??= block.dimension.spawnEntity(NETWORK_LINK_ENTITY, block.location);
        return new NetworkLinkNode(dataStorageEntity, block.location);
    }

    /**
     * Finds the network link entity associated with a block, or returns undefined if its not been created yet.
     * @param block
     * @throws If the block does not have the `fluffyalien_energisticscore:network_link` block tag
     * @returns The associated network link node
     */
    static tryGetNetworkLinkAt(dimension: Dimension, location: Vector3): NetworkLinkNode | undefined {
        let dataStorageEntity = dimension.getEntitiesAtBlockLocation(location)
            .filter(e => e.typeId === NETWORK_LINK_ENTITY)[0];

        if (dataStorageEntity === undefined) return undefined;
        return new NetworkLinkNode(dataStorageEntity, location);
    }
}

/**
 * Represents a single network link node in the machine network.
 */
export class NetworkLinkNode {
    private _entity: Entity;
    private _blockPos: Vector3;

    /**
     * @private
     * Internal method, use NetworkLinks.getNetworkLink instead!
     */
    constructor(entity: Entity, blockPos: Vector3) {
        this._entity = entity;
        this._blockPos = blockPos;
    }

    /**
     * @beta
     * Gets all the locations that this network link node is connected too.
     */
    public getConnections(): Vector3[] {
        const rawData = this._entity.getDynamicProperty(DATA_PROP_KEY) as string ?? "[]";
        return JSON.parse(rawData) as Vector3[];
    }

    /**
     * @beta
     * Adds both an incoming and outgoing connection from this node to the node at the location passed in.
     */
    public addConnection(location: Vector3): void {
        const otherBlock = this._entity.dimension.getBlock(location)!;
        const other = NetworkLinks.getNetworkLink(otherBlock);

        other._addConnection(this._blockPos);
        this._addConnection(other._blockPos);
    }

    /**
     * @beta
     * Removes a specific location which this network link node is connected too.
     */
    public removeConnection(location: Vector3): void {
        const otherBlock = this._entity.dimension.getBlock(location)!;
        const other = NetworkLinks.getNetworkLink(otherBlock);

        other._removeConnection(this._blockPos);
        this._removeConnection(other._blockPos);
    }

    /**
     * @beta
     * Removes this node from the network and removes any links coming into this node.
     */
    public destroyNode() {
        const outboundConnections = this.getConnections();

        // links are two way, remove the inbound links to this block.
        for (const connection of outboundConnections) {
            const block = this._entity.dimension.getBlock(connection)!;
            const node = NetworkLinks.getNetworkLink(block);
            node.removeConnection(this._blockPos);
        }

        this._entity.triggerEvent("fluffyalien_energisticscore:despawn");
    }

    ////////////////////////////////
    /** Internal helper functions */
    ////////////////////////////////

    private _removeConnection(location: Vector3) {
        const filtered = this.getConnections().filter(outbound => !Vector3Utils.equals(outbound, location));
        this._serializeConnections(filtered);
    }

    private _addConnection(location: Vector3) {
        this._serializeConnections([...this.getConnections(), location]);
    }

    private _serializeConnections(connections: Vector3[]) {
        this._entity.setDynamicProperty(DATA_PROP_KEY, JSON.stringify(connections));
    }
}