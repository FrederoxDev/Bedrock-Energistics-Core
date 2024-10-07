import { Entity, Vector3 } from "@minecraft/server";
import { getInitNamespace } from "../index.js";
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
    private readonly entity: Entity;
    private readonly blockPos: Vector3;

    /**
     * Internal method, use NetworkLinks.getNetworkLink instead!
     * @internal
     */
    constructor(entity: Entity, blockPos: Vector3) {
        this.entity = entity;
        this.blockPos = blockPos;
    }

    /**
     * Fetches all of the outbound connections to other {@link NetworkLinkNode}s
     * @returns The block positions of each connection
     * @beta
     */
    public async getConnections(): Promise<Vector3[]> {
        const payload: NetworkLinkGetRequest = {
            self: makeSerializableDimensionLocation({ dimension: this.entity.dimension, ...this.blockPos })
        } 

        const res = await invokeScriptEvent(
            "fluffyalien_energisticscore:ipc.network_link_get", 
            getInitNamespace(),
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
            self: makeSerializableDimensionLocation({ dimension: this.entity.dimension, ...this.blockPos }),
            other: location
        };

        await invokeScriptEvent(
            "fluffyalien_energisticscore:ipc.network_link_add",
            getInitNamespace(),
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
            self: makeSerializableDimensionLocation({ dimension: this.entity.dimension, ...this.blockPos }),
            other: location
        };

        await invokeScriptEvent(
            "fluffyalien_energisticscore:ipc.network_link_remove",
            getInitNamespace(),
            payload
        );
    }

    /**
     * Sends a request to break all connections and clean-up the backend side.
     * @beta
     */
    public async destroyNode(): Promise<void> {
        const payload: NetworkLinkDestroyRequest = {
            self: makeSerializableDimensionLocation({ dimension: this.entity.dimension, ...this.blockPos })
        };

        await invokeScriptEvent(
            "fluffyalien_energisticscore:ipc.network_link_destroy",
            getInitNamespace(),
            payload
        );
    }
}