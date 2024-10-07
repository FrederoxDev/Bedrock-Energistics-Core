import { makeError } from "@/public_api/src/internal";
import {
  NETWORK_LINK_BLOCK_TAG,
  NETWORK_LINK_ENTITY_ID,
  NETWORK_LINK_POSITIONS_KEY,
} from "@/public_api/src/network_links/ipc_events";
import { Vector3Utils } from "@minecraft/math";
import { Block, Dimension, Entity, Vector3 } from "@minecraft/server";

/**
 * There is a difference between the public api facing class since, all entity properties
 * have to be accessed and created from the core pack, since they get sandboxed.
 * @brief Internal version of the `NetworkLinkNode` class
 */
export class NetworkLinkNode {
  private readonly entity: Entity;
  private readonly blockPos: Vector3;

  private constructor(entity: Entity, blockPos: Vector3) {
    this.entity = entity;
    this.blockPos = blockPos;
  }

  public static fromBlock(block: Block): NetworkLinkNode {
    let dataStorageEntity = block.dimension
      .getEntitiesAtBlockLocation(block.location)
      .find((e) => e.typeId === NETWORK_LINK_ENTITY_ID);

    // Only verify the block tag when creating an entity, this is easier for after events when the network link block
    // is destroyed, but we still need to get it to cleanup.
    if (!dataStorageEntity && !block.hasTag(NETWORK_LINK_BLOCK_TAG))
      makeError(
        `NetworkLinks::getNetworkLink expected block of id: '${block.typeId}' to have the '${NETWORK_LINK_BLOCK_TAG}' tag before creating a network link storage entity at this location`,
      );

    // Spawn entity if tag check passed and it is null.
    dataStorageEntity ??= block.dimension.spawnEntity(
      NETWORK_LINK_ENTITY_ID,
      block.location,
    );
    return new NetworkLinkNode(dataStorageEntity, block.location);
  }

  public static tryGetAt(
    dimension: Dimension,
    location: Vector3,
  ): NetworkLinkNode | undefined {
    const dataStorageEntity = dimension
      .getEntitiesAtBlockLocation(location)
      .find((e) => e.typeId === NETWORK_LINK_ENTITY_ID);

    if (dataStorageEntity === undefined) return undefined;
    return new NetworkLinkNode(dataStorageEntity, location);
  }

  public getConnections(): Vector3[] {
    this.ensureValid();
    const rawData = this.entity.getDynamicProperty(
      NETWORK_LINK_POSITIONS_KEY,
    ) as string | undefined;
    return JSON.parse(rawData ?? "[]") as Vector3[];
  }

  public addConnection(location: Vector3): void {
    const otherBlock = this.entity.dimension.getBlock(location)!;
    const other = NetworkLinkNode.fromBlock(otherBlock);

    other.selfAddConnection(this.blockPos);
    this.selfAddConnection(other.blockPos);
  }

  public removeConnection(location: Vector3): void {
    const otherBlock = this.entity.dimension.getBlock(location)!;
    const other = NetworkLinkNode.fromBlock(otherBlock);

    other.selfRemoveConnection(this.blockPos);
    this.selfRemoveConnection(other.blockPos);
  }

  public destroyNode(): void {
    const outboundConnections = this.getConnections();

    // links are two way, remove the inbound links to this block.
    for (const connection of outboundConnections) {
      const block = this.entity.dimension.getBlock(connection)!;
      const node = NetworkLinkNode.fromBlock(block);
      node.removeConnection(this.blockPos);
    }

    this.entity.remove();
  }

  public isValid(): boolean {
    return this.entity.isValid();
  }

  private selfRemoveConnection(location: Vector3): void {
    const filtered = this.getConnections().filter(
      (outbound) => !Vector3Utils.equals(outbound, location),
    );
    this.selfSerializeConnections(filtered);
  }

  private selfAddConnection(location: Vector3): void {
    this.selfSerializeConnections([...this.getConnections(), location]);
  }

  private selfSerializeConnections(connections: Vector3[]): void {
    this.ensureValid();
    this.entity.setDynamicProperty(
      NETWORK_LINK_POSITIONS_KEY,
      JSON.stringify(connections),
    );
  }

  private ensureValid(): void {
    if (!this.entity.isValid())
      makeError(`NetworkLinkNode instance is not valid.`);
  }
}
