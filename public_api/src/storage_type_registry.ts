import * as ipc from "mcbe-addon-ipc";
import { StorageTypeDefinition } from "./registry_types.js";
import { MangledStorageTypeDefinition } from "./storage_type_registry_internal.js";

/**
 * Registers a storage type. This function should be called in the `worldInitialize` after event.
 * @beta
 */
export function registerStorageType(definition: StorageTypeDefinition): void {
  if (definition.id.startsWith("_") || definition.category.startsWith("_")) {
    throw new Error(
      `can't register storage type '${definition.id}' (category: '${definition.category}'): storage type IDs and categories cannot start with '_'`,
    );
  }

  // reconstruct the definition in case the passed `definition` contains unnecessary keys
  const payload: MangledStorageTypeDefinition = {
    a: definition.id,
    b: definition.category,
    c: definition.color,
    d: definition.name,
  };

  void ipc.sendAuto(
    "fluffyalien_energisticscore:ipc.registerStorageType",
    payload,
  );
}
