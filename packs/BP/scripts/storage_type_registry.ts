import * as ipc from "mcbe-addon-ipc";
import { world } from "@minecraft/server";
import { logWarn, raise } from "./utils/log";
import {
  RegisteredStorageType,
  STANDARD_STORAGE_TYPE_DEFINITIONS,
  StorageTypeDefinition,
} from "@/public_api/src";

const storageTypeRegistry = new Map<string, InternalRegisteredStorageType>();

// @ts-expect-error extending private class for internal use
export class InternalRegisteredStorageType extends RegisteredStorageType {
  // override to make it public
  public constructor(definition: StorageTypeDefinition) {
    super(definition);
  }

  getDefinition(): StorageTypeDefinition {
    return this.definition;
  }

  static getInternal(id: string): InternalRegisteredStorageType | undefined {
    return storageTypeRegistry.get(id);
  }

  static getAllIdsInternal(): MapIterator<string> {
    return storageTypeRegistry.keys();
  }

  static forceGetInternal(id: string): InternalRegisteredStorageType {
    const registered = InternalRegisteredStorageType.getInternal(id);
    if (!registered) {
      raise(
        `Expected '${id}' to be registered as a storage type, but it could not be found in the storage type registry.`,
      );
    }
    return registered;
  }
}

// register energy by default
registerStorageType(STANDARD_STORAGE_TYPE_DEFINITIONS.energy);

function registerStorageType(data: StorageTypeDefinition): void {
  // Don't send override logs when the two types are identical
  const existing = storageTypeRegistry.get(data.id);
  if (existing !== undefined && existing.category === data.category) return;

  // The category changed
  if (existing !== undefined) {
    logWarn(`overrode category of storage type '${data.id}', originally was '${existing.category}', now is '${data.category}'`);
  }

  const registered = new InternalRegisteredStorageType(data);
  storageTypeRegistry.set(data.id, registered);

  const objectiveId = `fluffyalien_energisticscore:storage${data.id}`;

  if (!world.scoreboard.getObjective(objectiveId)) {
    world.scoreboard.addObjective(objectiveId);
  }
}

export function registerStorageTypeListener(
  payload: ipc.SerializableValue,
): null {
  const data = payload as StorageTypeDefinition;
  registerStorageType(data);
  return null;
}
