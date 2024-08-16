import { Block, DimensionLocation, ItemTypes, system } from "@minecraft/server";
import {
  MachineDefinition,
  StorageTypeDefinition,
  UiElement,
  UpdateUiHandlerResponse,
} from "./registry_types";
import {
  deserializeDimensionLocation,
  getBlockUniqueId,
  getItemCountScoreboardObjective,
  getItemTypeScoreboardObjective,
  getScore,
  getStorageScoreboardObjective,
  logInfo,
  makeErrorString,
  makeSerializableDimensionLocation,
  MangledRegisteredMachine,
  removeBlockFromScoreboards,
  SerializableDimensionLocation,
} from "./internal";
import {
  dispatchScriptEvent,
  invokeScriptEvent,
  registerScriptEventHandler,
  streamScriptEvent,
} from "./addon_ipc";

export * from "./registry_types";

/**
 * Representation of an item stack stored in a machine inventory.
 * @beta
 */
export interface MachineItemStack {
  /**
   * The index of the item in the slot's `allowedItems`.
   * @see {@link UiItemSlotElement}
   */
  typeIndex: number;
  /**
   * The amount of this item.
   */
  count: number;
}

/**
 * @beta
 */
export interface InitOptions {
  namespace: string;
}

/**
 * The amount that each storage bar segment in a machine is worth.
 * @beta
 */
export const STORAGE_AMOUNT_PER_BAR_SEGMENT = 100;
/**
 * The max storage of each storage type in a machine.
 * @beta
 */
export const MAX_MACHINE_STORAGE = STORAGE_AMOUNT_PER_BAR_SEGMENT * 64;

/**
 * Representation of a machine definition that has been registered.
 * @beta
 * @see {@link MachineDefinition}, {@link registerMachine}, {@link getRegisteredMachine}
 */
export class RegisteredMachine {
  /**
   * @internal This class shouldn't be manually constructed. Use {@link getRegisteredMachine} to get this object.
   */
  constructor(protected readonly internal: MangledRegisteredMachine) {}

  get id(): string {
    return this.internal.a;
  }

  get persistentEntity(): boolean {
    return this.internal.b ?? false;
  }

  get uiElements(): Record<string, UiElement> | undefined {
    return this.internal.c;
  }
}

let initOptions: InitOptions | undefined;

/**
 * Sets global info to be used by functions in this package.
 * @beta
 */
export function init(options: InitOptions): void {
  if (initOptions) {
    throw new Error(makeErrorString("'init' has already been called"));
  }

  initOptions = options;
}

function ensureInitialized(): void {
  if (!initOptions) {
    throw new Error(makeErrorString("'init' has not been called"));
  }
}

/**
 * Tests whether Bedrock Energistics Core is in the world or not.
 * @beta
 */
export function isBedrockEnergisticsCoreInWorld(): boolean {
  return !!ItemTypes.get(
    "fluffyalien_energisticscore:ui_disabled_storage_bar_segment",
  );
}

/**
 * Registers a machine. This function should be called in the `worldInitialize` after event.
 * @beta
 */
export function registerMachine(
  definition: MachineDefinition,
  fallbackToStream = true,
): void {
  ensureInitialized();

  let updateUiEvent: string | undefined;
  if (definition.handlers?.updateUi) {
    updateUiEvent = `${definition.description.id}__updateUiHandler`;
    registerScriptEventHandler<
      SerializableDimensionLocation,
      UpdateUiHandlerResponse
    >(updateUiEvent, (payload) =>
      definition.handlers!.updateUi!(deserializeDimensionLocation(payload)),
    );
  }

  const payload: MangledRegisteredMachine = {
    a: definition.description.id,
    b: definition.description.persistentEntity,
    c: definition.description.ui?.elements,
    d: updateUiEvent,
  };

  try {
    dispatchScriptEvent(
      "fluffyalien_energisticscore:ipc.register_machine",
      payload,
    );
  } catch (e) {
    const caughtErrMessage = `caught error when trying to register machine '${definition.description.id}': ${e instanceof Error ? e.message : "unknown error"}`;

    if (!fallbackToStream) {
      throw new Error(
        makeErrorString(
          `${caughtErrMessage}. falling back to streaming is disabled`,
        ),
      );
    }

    logInfo(`${caughtErrMessage}. falling back to streaming`);

    system.runJob(
      streamScriptEvent(
        "fluffyalien_energisticscore:ipc.stream.register_machine",
        initOptions!.namespace,
        payload,
      ),
    );

    return;
  }
}

/**
 * Registers a storage type. This function should be called in the `worldInitialize` after event.
 * @beta
 */
export function registerStorageType(definition: StorageTypeDefinition): void {
  ensureInitialized();

  // reconstruct the definition in case the passed `definition` contains unnecessary keys
  const payload: StorageTypeDefinition = {
    id: definition.id,
    category: definition.category,
    color: definition.color,
    name: definition.name,
  };

  dispatchScriptEvent(
    "fluffyalien_energisticscore:ipc.register_storage_type",
    payload,
  );
}

/**
 * Updates the networks that a block belongs to, if it has any.
 * @beta
 */
export function updateBlockNetworks(blockLocation: DimensionLocation): void {
  dispatchScriptEvent(
    "fluffyalien_energisticscore:ipc.update_block_networks",
    makeSerializableDimensionLocation(blockLocation),
  );
}

/**
 * Updates the networks adjacent to a block that the block can connect to.
 * @beta
 */
export function updateBlockConnectableNetworks(
  blockLocation: DimensionLocation,
): void {
  dispatchScriptEvent(
    "fluffyalien_energisticscore:ipc.update_block_connectable_networks",
    makeSerializableDimensionLocation(blockLocation),
  );
}

/**
 * Updates the networks adjacent to a block.
 * @beta
 */
export function updateBlockAdjacentNetworks(
  blockLocation: DimensionLocation,
): void {
  dispatchScriptEvent(
    "fluffyalien_energisticscore:ipc.update_block_adjacent_networks",
    makeSerializableDimensionLocation(blockLocation),
  );
}

/**
 * Gets the storage of a specific type in a machine.
 * @beta
 * @param loc The location of the machine.
 * @param type The type of storage to get.
 * @throws Throws {@link Error} if the storage type does not exist
 */
export function getMachineStorage(
  loc: DimensionLocation,
  type: string,
): number {
  const objective = getStorageScoreboardObjective(type);
  if (!objective) {
    throw new Error(
      makeErrorString(
        `trying to get machine storage of type '${type}' but that storage type does not exist`,
      ),
    );
  }

  return getScore(objective, getBlockUniqueId(loc)) ?? 0;
}

/**
 * Sets the storage of a specific type in a machine.
 * @beta
 * @param block The machine block.
 * @param type The type of storage to set.
 * @param value The new value. Must be an integer.
 * @throws Throws if the storage type does not exist.
 * @throws Throws if the new value is negative or greater than {@link MAX_MACHINE_STORAGE}.
 * @throws Throws if the new value is not an integer.
 * @throws Throws if the block is not valid
 */
export function setMachineStorage(
  block: Block,
  type: string,
  value: number,
): void {
  if (!block.isValid()) {
    throw new Error(
      makeErrorString(
        `trying to set machine storage but the block is not valid`,
      ),
    );
  }

  if (value < 0) {
    throw new Error(
      makeErrorString(
        `trying to set machine storage of type '${type}' to ${value.toString()} which is less than the minimum value (0)`,
      ),
    );
  }

  if (value > MAX_MACHINE_STORAGE) {
    throw new Error(
      makeErrorString(
        `trying to set machine storage of type '${type}' to ${value.toString()} which is greater than the maximum value (${MAX_MACHINE_STORAGE.toString()})`,
      ),
    );
  }

  const objective = getStorageScoreboardObjective(type);
  if (!objective) {
    throw new Error(
      makeErrorString(
        `trying to set machine storage of type '${type}' but that storage type does not exist`,
      ),
    );
  }

  objective.setScore(getBlockUniqueId(block), value);
}

/**
 * Gets an item from a machine inventory.
 * @beta
 * @param loc The location of the machine.
 * @param slotId The number ID of the slot as defined when the machine was registered (see {@link UiItemSlotElement}).
 * @returns The {@link MachineItemStack}.
 */
export function getItemInMachineSlot(
  loc: DimensionLocation,
  slotId: number,
): MachineItemStack | undefined {
  const participantId = getBlockUniqueId(loc);

  const itemType = getScore(
    getItemTypeScoreboardObjective(slotId),
    participantId,
  );
  if (itemType === undefined) {
    return;
  }

  const itemCount = getScore(
    getItemCountScoreboardObjective(slotId),
    participantId,
  );
  if (!itemCount) {
    return;
  }

  return {
    typeIndex: itemType,
    count: itemCount,
  };
}

/**
 * Sets an item in a machine inventory.
 * @beta
 * @param loc The location of the machine.
 * @param slotId The number ID of the slot as defined when the machine was registered (see {@link UiItemSlotElement}).
 * @param newItemStack The {@link MachineItemStack} to put in the slot. Pass `undefined` to remove the item in the slot.
 */
export function setItemInMachineSlot(
  loc: DimensionLocation,
  slotId: number,
  newItemStack?: MachineItemStack,
): void {
  dispatchScriptEvent(
    "fluffyalien_energisticscore:ipc.set_item_in_machine_slot",
    {
      loc: makeSerializableDimensionLocation(loc),
      slot: slotId,
      item: newItemStack,
    },
  );
}

/**
 * Queue sending energy, gas, or fluid over a machine network.
 * @beta
 * @remarks
 * Note: in most cases, prefer {@link generate} over this function.
 * Automatically sets the machine's reserve storage to the amount that was not received.
 * @param blockLocation The location of the machine that is sending the energy, gas, or fluid.
 * @param type The storage type to send.
 * @param amount The amount to send.
 * @throws if `amount` is <= 0.
 * @see {@link generate}
 */
export function queueSend(
  blockLocation: DimensionLocation,
  type: string,
  amount: number,
): void {
  dispatchScriptEvent("fluffyalien_energisticscore:ipc.queue_send", {
    loc: makeSerializableDimensionLocation(blockLocation),
    type,
    amount,
  });
}

/**
 * Sends energy, gas, or fluid over a machine network. Includes reserve storage as well.
 * @beta
 * @remarks
 * This function should be called every block tick for generators even if the generation is `0` because it sends reserve storage.
 * Automatically sets the machine's reserve storage to the amount that was not received.
 * This function is a wrapper around {@link queueSend}.
 * Unlike `queueSend`, this function does not throw if `amount` <= 0.
 * @param blockLocation The location of the machine that is generating.
 * @param type The storage type to generate.
 * @param amount The amount to generate.
 * @see {@link queueSend}
 */
export function generate(
  blockLocation: DimensionLocation,
  type: string,
  amount: number,
): void {
  const stored = getMachineStorage(blockLocation, type);

  const sendAmount = stored + amount;
  if (sendAmount <= 0) {
    return;
  }

  queueSend(blockLocation, type, sendAmount);
}

/**
 * Gets a registered machine.
 * @beta
 * @param id The ID of the machine.
 * @returns The {@link RegisteredMachine} with the specified `id` or `null` if it doesn't exist.
 * @throws if Bedrock Energistics Core takes too long to respond.
 */
export async function getRegisteredMachine(
  id: string,
): Promise<RegisteredMachine | null> {
  ensureInitialized();

  const mangled = (await invokeScriptEvent(
    "fluffyalien_energisticscore:ipc.get_registered_machine",
    initOptions!.namespace,
    id,
  )) as MangledRegisteredMachine;

  return new RegisteredMachine(mangled);
}

/**
 * Cleans up machine data and updates it's networks.
 * @beta
 * @remarks
 * This is automatically done by Bedrock Energistics Core when a machine is destroyed by a player.
 * If you destroy a machine from script, call this function before the block is removed.
 * @param blockLocation The location of the machine.
 */
export function removeMachine(blockLocation: DimensionLocation): void {
  updateBlockNetworks(blockLocation);
  system.run(() => {
    removeBlockFromScoreboards(blockLocation);
  });
}
