/**
 * Script for handling block destroy events for machines and conduits.
 * Destroy logic specific to conduits and machines can be found in their own files.
 */

import {
  DimensionLocation,
  Direction,
  Entity,
  system,
  Vector3,
  world,
} from "@minecraft/server";
import { removeBlockFromScoreboards } from "./data";
import { InternalRegisteredMachine, machineRegistry } from "./registry";
import { getBlockNetworkConnectionType, MachineNetwork } from "./network";
import { logWarn } from "./utils/log";
import { getDirectionVector, reverseDirection } from "./utils/direction";
import { Vector3Utils } from "@minecraft/math";
import { dropItemsStoredInMachine } from "./machine";

world.afterEvents.blockExplode.subscribe((e) => {
  const connectionType = getBlockNetworkConnectionType(
    e.explodedBlockPermutation,
  );
  if (!connectionType) {
    return;
  }

  MachineNetwork.updateWith(e.dimension, e.block.location, connectionType);

  if (connectionType === "machine") {
    removeBlockFromScoreboards(e.block);
  }
});

world.afterEvents.pistonActivate.subscribe((e) => {
  const attachedBlockLocations = e.piston.getAttachedBlocksLocations();
  if (!attachedBlockLocations.length) return;

  const movedMachineEntities: Entity[] = [];

  for (const entity of e.dimension.getEntities({
    families: ["fluffyalien_energisticscore:machine_entity"],
    location: e.block.location,
    maxDistance: 15,
  })) {
    const originalLocation = entity.getDynamicProperty(
      "fluffyalien_energisticscore:block_location",
    ) as Vector3 | undefined;
    if (!originalLocation) {
      logWarn(
        `can't get machine entity moved by piston: '${entity.typeId}' does not have the 'fluffyalien_energisticscore:block_location' dynamic property. skipping`,
      );
      continue;
    }

    entity.teleport(originalLocation);
    movedMachineEntities.push(entity);
  }

  const pistonDirections = [
    Direction.Down,
    Direction.Up,
    Direction.South,
    Direction.North,
    Direction.East,
    Direction.West,
  ];

  const facingDirection =
    pistonDirections[
      e.block.permutation.getState("facing_direction") as number
    ];

  const blockMovementDirection = e.isExpanding
    ? facingDirection
    : reverseDirection(facingDirection);

  const blockMovementVector = getDirectionVector(blockMovementDirection);

  system.runTimeout(() => {
    for (const attachedBlockLocation of attachedBlockLocations) {
      const newBlockLocation = Vector3Utils.add(
        attachedBlockLocation,
        blockMovementVector,
      );
      const block = e.dimension.getBlock(newBlockLocation);
      if (!block) continue;

      const connectionType = getBlockNetworkConnectionType(block);
      if (!connectionType) continue;

      MachineNetwork.updateWith(
        e.dimension,
        attachedBlockLocation,
        connectionType,
      );

      if (connectionType === "conduit") {
        continue;
      }

      const definition = machineRegistry[block.typeId] as
        | InternalRegisteredMachine
        | undefined;
      if (!definition) {
        logWarn(
          `can't process pistonActivate event for block '${block.typeId}': this block uses the 'fluffyalien_energisticscore:machine' tag but it could not be found in the machine registry. skipping`,
        );
        continue;
      }

      const machineEntityIndex = movedMachineEntities.findIndex(
        (entity) =>
          entity.typeId === definition.entityId &&
          Vector3Utils.equals(
            attachedBlockLocation,
            entity.getDynamicProperty(
              "fluffyalien_energisticscore:block_location",
            ) as Vector3,
          ),
      );

      if (machineEntityIndex !== -1) {
        const machineEntity = movedMachineEntities[machineEntityIndex];
        movedMachineEntities.splice(machineEntityIndex, 1);

        if (definition.persistentEntity) {
          try {
            machineEntity.triggerEvent(
              "fluffyalien_energisticscore:on_destroyed_by_piston",
            );
          } catch (e) {
            logWarn(
              `error when trying to destroy machine '${block.typeId}' due to piston move: ${(e as Error).message}`,
            );
          }
        } else {
          machineEntity.remove();
        }
      }

      const attachedBlockDimensionLocation: DimensionLocation = {
        dimension: e.dimension,
        ...attachedBlockLocation,
      };

      dropItemsStoredInMachine(attachedBlockDimensionLocation, definition);
      removeBlockFromScoreboards(attachedBlockDimensionLocation);
      removeBlockFromScoreboards(block);
      block.dimension.runCommand(
        `setblock ${block.x.toString()} ${block.y.toString()} ${block.z.toString()} air destroy`,
      );
    }
  }, 2);
});
