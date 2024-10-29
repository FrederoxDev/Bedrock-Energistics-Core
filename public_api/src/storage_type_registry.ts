import { dispatchScriptEvent } from "mcbe-addon-ipc";
import { ensureInitialized } from "./init.js";
import { StorageTypeDefinition } from "./registry_types.js";

/**
 * Registers a storage type. This function should be called in the `worldInitialize` after event.
 * @beta
 */
export function registerStorageType(definition: StorageTypeDefinition): void {
  ensureInitialized();

  if (definition.id.startsWith("_") || definition.category.startsWith("_")) {
    throw new Error(
      `can't register storage type '${definition.id}' (category: '${definition.category}'): storage type IDs and categories cannot start with '_'`,
    );
  }

  // reconstruct the definition in case the passed `definition` contains unnecessary keys
  const payload: StorageTypeDefinition = {
    id: definition.id,
    category: definition.category,
    color: definition.color,
    name: definition.name,
  };

  dispatchScriptEvent(
    "fluffyalien_energisticscore:ipc.registerStorageType",
    payload,
  );
}
