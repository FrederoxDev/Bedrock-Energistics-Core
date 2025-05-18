import { Block, DimensionLocation, Entity } from "@minecraft/server";
import { ipcInvoke } from "./ipc_wrapper.js";
import { BecIpcListener } from "./bec_ipc_listener.js";
import { makeSerializableDimensionLocation } from "./serialize_utils.js";
import { RegisteredMachine } from "./machine_registry.js";

/**
 * Cleans up machine data and updates it's networks.
 * @beta
 * @remarks
 * This is automatically done by Bedrock Energistics Core when a machine is destroyed by a player.
 * If you destroy a machine from script, call this function before the block is removed.
 * @param loc The machine block location.
 */
export async function removeMachine(loc: DimensionLocation): Promise<void> {
  await ipcInvoke(
    BecIpcListener.RemoveMachine,
    makeSerializableDimensionLocation(loc),
  );
}

/**
 * Spawns the machine entity for the machine at the specified location, if it doesn't already exist.
 * @param block The machine.
 * @returns The new entity or the one that was already there.
 * @throws Throws if the machine does not exist in the registry.
 */
export async function spawnMachineEntity(block: Block): Promise<Entity> {
  // there is a similar function to this one in the add-on.
  // if this is changed, then ensure the add-on function is
  // changed as well.

  const definition = await RegisteredMachine.forceGet(block.typeId);

  const existingEntity = block.dimension
    .getEntitiesAtBlockLocation(block.location)
    .find((entity) => entity.typeId === definition.entityId);
  if (existingEntity) return existingEntity;

  const newEntity = block.dimension.spawnEntity(
    definition.entityId,
    block.bottomCenter(),
  );
  newEntity.nameTag = block.typeId;
  return newEntity;
}
