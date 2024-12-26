import { ipcInvoke, ipcSend } from "./ipc_wrapper.js";
import { StorageTypeColor, StorageTypeDefinition } from "./registry_types.js";

/**
 * @beta
 */
export interface StorageTypeData {
  id: string;
  category: string;
}

/**
 * Representation of a storage type definition that has been registered.
 * @beta
 * @see {@link StorageTypeDefinition}, {@link registerStorageType}
 */
export class RegisteredStorageType implements StorageTypeData {
  private constructor(
    /**
     * @internal
     */
    protected readonly definition: StorageTypeDefinition,
  ) {}

  /**
   * @returns The ID of this storage type.
   * @beta
   */
  get id(): string {
    return this.definition.id;
  }

  /**
   * @returns The category of this storage type.
   * @beta
   */
  get category(): string {
    return this.definition.category;
  }

  /**
   * @returns The {@link StorageTypeColor} of this storage type.
   * @beta
   */
  get color(): StorageTypeColor {
    return this.definition.color;
  }

  /**
   * @returns The name of this storage type.
   * @beta
   */
  get name(): string {
    return this.definition.name;
  }

  /**
   * Get a registered storage type by its ID.
   * @beta
   * @param id The ID of the storage type to get.
   * @returns The registered storage type, or `undefined` if it does not exist.
   */
  static async get(id: string): Promise<RegisteredStorageType | undefined> {
    const def = (await ipcInvoke(
      "fluffyalien_energisticscore:ipc.registeredStorageTypeGet",
      id,
    )) as StorageTypeDefinition | null;

    if (!def) return;

    return new RegisteredStorageType(def);
  }
}

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
  const payload: StorageTypeDefinition = {
    id: definition.id,
    category: definition.category,
    color: definition.color,
    name: definition.name,
  };

  ipcSend("fluffyalien_energisticscore:ipc.registerStorageType", payload);
}
