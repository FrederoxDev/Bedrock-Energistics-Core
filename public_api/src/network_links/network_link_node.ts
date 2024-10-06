import { Entity, Vector3 } from "@minecraft/server";
import { Vector3Utils } from "@minecraft/math";
import { initOptions, NetworkLinks } from "../index.js";
import { NETWORK_LINK_POSITIONS_KEY } from "./network_links.js";
import { makeError, makeSerializableDimensionLocation, SerializableDimensionLocation } from "../internal.js";
import { dispatchScriptEvent, invokeScriptEvent } from "mcbe-addon-ipc";

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
    public async getConnections() {
        const payload: NetworkLinkGetRequest = {
            self: makeSerializableDimensionLocation({ dimension: this._entity.dimension, ...this._blockPos })
        } 

        const res = await invokeScriptEvent(
            "fluffyalien_energisticscore:ipc.network_link_get", 
            initOptions!.namespace,
            payload
        ) as NetworkLinkGetResponse;

        return res.locations;
    } 

    /**
     * @beta
     * Adds both an incoming and outgoing connection from this node to the node at the location passed in.
     */
    public async addConnection(location: Vector3) {
        const payload: NetworkLinkAddRequest = {
            self: makeSerializableDimensionLocation({ dimension: this._entity.dimension, ...this._blockPos }),
            other: location
        };

        await invokeScriptEvent(
            "fluffyalien_energisticscore:ipc.network_link_add",
            initOptions!.namespace,
            payload
        );
    }

    /**
     * @beta
     * Removes a specific location which this network link node is connected too.
     */
    public async removeConnection(location: Vector3) {
        const payload: NetworkLinkAddRequest = {
            self: makeSerializableDimensionLocation({ dimension: this._entity.dimension, ...this._blockPos }),
            other: location
        };

        await invokeScriptEvent(
            "fluffyalien_energisticscore:ipc.network_link_remove",
            initOptions!.namespace,
            payload
        );
    }

    /**
     * @beta
     * Removes this node from the network and removes any links coming into this node.
     */
    public async destroyNode() {
        const payload: NetworkLinkDestroyRequest = {
            self: makeSerializableDimensionLocation({ dimension: this._entity.dimension, ...this._blockPos })
        };

        await invokeScriptEvent(
            "fluffyalien_energisticscore:ipc.network_link_destroy",
            initOptions!.namespace,
            payload
        );
    }
}

export type NetworkLinkGetRequest = { self: SerializableDimensionLocation };
export type NetworkLinkGetResponse = { locations: Vector3[] };
export type NetworkLinkAddRequest = { self: SerializableDimensionLocation, other: Vector3 };
export type NetworkLinkRemoveRequest = { self: SerializableDimensionLocation, other: Vector3 };
export type NetworkLinkDestroyRequest = { self: SerializableDimensionLocation };