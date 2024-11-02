import * as ipc from "mcbe-addon-ipc";
import { world } from "@minecraft/server";
import { logInfo, raise } from "./utils/log";
import { RegisteredStorageType, StorageTypeDefinition } from "@/public_api/src";
import { MangledStorageTypeDefinition } from "@/public_api/src/storage_type_registry_internal";

const storageTypeRegistry: Record<string, RegisteredStorageType> = {};

export function getRegisteredStorageType(
  id: string,
): RegisteredStorageType | undefined {
  return storageTypeRegistry[id];
}

export function forceGetRegisteredStorageType(
  id: string,
): RegisteredStorageType {
  const registered = getRegisteredStorageType(id);
  if (!registered) {
    raise(
      `Expected '${id}' to be registered as a storage type, but it could not be found in the storage type registry.`,
    );
  }
  return registered;
}

// register energy by default
registerStorageType(
  makeRegisteredStorageTypeFromDefinition({
    id: "energy",
    category: "energy",
    color: "yellow",
    name: "energy",
  }),
);

function makeRegisteredStorageTypeFromDefinition(
  def: StorageTypeDefinition,
): RegisteredStorageType {
  return new RegisteredStorageType({
    a: def.id,
    b: def.category,
    c: def.color,
    d: def.name,
  });
}

function registerStorageType(data: RegisteredStorageType): void {
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
  const mData = payload as MangledStorageTypeDefinition;
  const data = new RegisteredStorageType(mData);
  registerStorageType(data);
  return null;
}
