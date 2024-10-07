import { Entity, Vector3 } from "@minecraft/server";
import { initOptions } from "../index.js";
import { makeSerializableDimensionLocation } from "../internal.js";
import { invokeScriptEvent } from "mcbe-addon-ipc";
import { NetworkLinkAddRequest, NetworkLinkDestroyRequest, NetworkLinkGetRequest, NetworkLinkGetResponse } from "./ipc_events.js";

/**
 * A NetworkLinkNode represents a single node in the machine network
 * 
 * - NetworkLinkNodes can be used to combine two seperate networks without any physcical connection between them.
 * - An example use case is to create wireless power transmission.
 * - To get an instance of a `NetworkLinkNode` use `NetworkLinks.getNetworkLink`
 */
export class NetworkLinkNode {
    private readonly _entity: Entity;
    private readonly _blockPos: Vector3;

    /**
     * Internal method, use NetworkLinks.getNetworkLink instead!
     * @internal
     */
    constructor(entity: Entity, blockPos: Vector3) {
        this._entity = entity;
        this._blockPos = blockPos;
    }

    /**
     * Fetches all of the outbound connections to other {@link NetworkLinkNode}s
     * @returns The block positions of each connection
     * @beta
     */
    public async getConnections(): Promise<Vector3[]> {
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
     * Sends a request to create a two way connection between this {@link NetworkLinkNode} and the location of another.
     * @param location The block location of the other node.
     * @beta
     */
    public async addConnection(location: Vector3): Promise<void> {
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
     * Sends a request to break an existing two way connection between this {@link NetworkLinkNode} and the location of another.
     * @param location The block location of the other node.
     * @beta
     */
    public async removeConnection(location: Vector3): Promise<void> {
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
     * Sends a request to break all connections and clean-up the backend side.
     * @beta
     */
    public async destroyNode(): Promise<void> {
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