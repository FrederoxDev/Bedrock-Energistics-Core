import * as ipc from "mcbe-addon-ipc";
import { world } from "@minecraft/server";
import { logInfo, raise } from "./utils/log";
import { StorageTypeDefinition } from "@/public_api/src";
import { MangledStorageTypeDefinition } from "@/public_api/src/storage_type_registry_internal";

const storageTypeRegistry: Record<string, StorageTypeDefinition> = {};

export function getRegisteredStorageType(
  id: string,
): StorageTypeDefinition | undefined {
  return storageTypeRegistry[id];
}

export function forceGetRegisteredStorageType(
  id: string,
): StorageTypeDefinition {
  const registered = getRegisteredStorageType(id);
  if (!registered) {
    raise(
      `Expected '${id}' to be registered as a storage type, but it could not be found in the storage type registry.`,
    );
  }
  return registered;
}

// register energy by default
registerStorageType({
  id: "energy",
  category: "energy",
  color: "yellow",
  name: "energy",
});

function registerStorageType(data: StorageTypeDefinition): void {
  if (data.id in storageTypeRegistry) {
    logInfo(`overrode storage type '${data.id}'`);
  }

  storageTypeRegistry[data.id] = data;

  const objectiveId = `fluffyalien_energisticscore:storage${data.id}`;

  if (!world.scoreboard.getObjective(objectiveId)) {
    world.scoreboard.addObjective(objectiveId);
  }
}

export function registerStorageTypeListener(
  payload: ipc.SerializableValue,
): null {
  const mData = payload as unknown as MangledStorageTypeDefinition;
  const data: StorageTypeDefinition = {
    id: mData.a,
    category: mData.b,
    color: mData.c,
    name: mData.d,
  };

  registerStorageType(data);

  return null;
}
