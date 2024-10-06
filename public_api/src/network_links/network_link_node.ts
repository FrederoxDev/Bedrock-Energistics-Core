import { Entity, Vector3 } from "@minecraft/server";
import { Vector3Utils } from "@minecraft/math";
import { NetworkLinks } from "../index.js";
import { NETWORK_LINK_POSITIONS_KEY } from "./network_links.js";
import { makeError } from "../internal.js";

/**
 * Represents a single network link node in the machine network.
 */
export class NetworkLinkNode {
    private _entity: Entity;
    private _blockPos: Vector3;

    /**
     * @internal
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
        this._ensureValid();
        const rawData = this._entity.getDynamicProperty(NETWORK_LINK_POSITIONS_KEY) as string ?? "[]";
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

    /**
     * @beta
     * Checks if this network node is still valid
     */
    public isValid(): boolean {
        return this._entity.isValid();
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
        this._ensureValid();
        this._entity.setDynamicProperty(NETWORK_LINK_POSITIONS_KEY, JSON.stringify(connections));
        console.log("_serializeConnections", JSON.stringify(this._blockPos), JSON.stringify(connections));
    }

    private _ensureValid(): void {
        if (!this._entity.isValid()) makeError(`NetworkLinkNode instance is not valid.`);
    }
}