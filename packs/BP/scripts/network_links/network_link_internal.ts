import { makeError } from "@/public_api/src/internal";
import { NETWORK_LINK_BLOCK_TAG, NETWORK_LINK_ENTITY_ID, NETWORK_LINK_POSITIONS_KEY } from "@/public_api/src/network_links/ipc_events";
import { Vector3Utils } from "@minecraft/math";
import { Block, Dimension, Entity, Vector3 } from "@minecraft/server";

export class NetworkLinkNodeInternal {
    private _entity: Entity;
    private _blockPos: Vector3;

    private constructor(entity: Entity, blockPos: Vector3) {
        this._entity = entity;
        this._blockPos = blockPos;
    }

    public static fromBlock(block: Block) {
        let dataStorageEntity = block.dimension.getEntitiesAtBlockLocation(block.location)
            .filter(e => e.typeId === NETWORK_LINK_ENTITY_ID)[0];

        // Only verify the block tag when creating an entity, this is easier for after events when the network link block  
        // is destroyed, but we still need to get it to cleanup.
        if (!dataStorageEntity && !block.hasTag(NETWORK_LINK_BLOCK_TAG)) 
            makeError(`NetworkLinks::getNetworkLink expected block of id: '${block.typeId}' to have the '${NETWORK_LINK_BLOCK_TAG}' tag before creating a network link storage entity at this location`);

        // Spawn entity if tag check passed and it is null.
        dataStorageEntity ??= block.dimension.spawnEntity(NETWORK_LINK_ENTITY_ID, block.location);
        return new NetworkLinkNodeInternal(dataStorageEntity, block.location);
    }

    public static tryGetAt(dimension: Dimension, location: Vector3): NetworkLinkNodeInternal | undefined {
        let dataStorageEntity = dimension.getEntitiesAtBlockLocation(location)
            .filter(e => e.typeId === NETWORK_LINK_ENTITY_ID)[0];

        if (dataStorageEntity === undefined) return undefined;
        return new NetworkLinkNodeInternal(dataStorageEntity, location);
    }

    public getConnections(): Vector3[] {
        this._ensureValid();
        const rawData = this._entity.getDynamicProperty(NETWORK_LINK_POSITIONS_KEY) as string ?? "[]";
        return JSON.parse(rawData) as Vector3[];
    }

    public addConnection(location: Vector3): void {
        const otherBlock = this._entity.dimension.getBlock(location)!;
        const other = NetworkLinkNodeInternal.fromBlock(otherBlock);

        other._addConnection(this._blockPos);
        this._addConnection(other._blockPos);
    }

    public removeConnection(location: Vector3): void {
        const otherBlock = this._entity.dimension.getBlock(location)!;
        const other = NetworkLinkNodeInternal.fromBlock(otherBlock);

        other._removeConnection(this._blockPos);
        this._removeConnection(other._blockPos);
    }

    public destroyNode() {
        const outboundConnections = this.getConnections();

        // links are two way, remove the inbound links to this block.
        for (const connection of outboundConnections) {
            const block = this._entity.dimension.getBlock(connection)!;
            const node = NetworkLinkNodeInternal.fromBlock(block);
            node.removeConnection(this._blockPos);
        }

        this._entity.triggerEvent("fluffyalien_energisticscore:despawn");
    }

    public isValid(): boolean {
        return this._entity.isValid();
    }

    private _removeConnection(location: Vector3) {
        const filtered = this.getConnections().filter(outbound => !Vector3Utils.equals(outbound, location));
        this._serializeConnections(filtered);
    }

    private _addConnection(location: Vector3) {
        this._serializeConnections([...this.getConnections(), location]);
    }

    private _serializeConnections(connections: Vector3[]) {
        this._ensureValid();
        this._entity.setDynamicProperty(NETWORK_LINK_POSITIONS_KEY, JSON.stringify(connections));
    }

    private _ensureValid(): void {
        if (!this._entity.isValid()) makeError(`NetworkLinkNode instance is not valid.`);
    }
}