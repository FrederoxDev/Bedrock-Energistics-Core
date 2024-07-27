import { DimensionLocation, ItemTypes } from "@minecraft/server";
import {
  Description,
  MachineDefinition,
  StorageType,
  UpdateUiHandlerResponse,
} from "./registry_types";
import {
  deserializeDimensionLocation,
  getBlockUniqueId,
  getItemCountScoreboard,
  getItemTypeScoreboard,
  getScore,
  getStorageScoreboard,
  logInfo,
  makeSerializableDimensionLocation,
  SerializableDimensionLocation,
} from "./internal";
import {
  dispatchScriptEvent,
  invokeScriptEvent,
  registerScriptEventHandler,
} from "./addon_ipc";

export * from "./registry_types";

/**
 * @beta
 * Representation of an item stack stored in a machine inventory.
 */
export interface MachineItemStack {
  /**
   * The index of the item in the slot's `allowedItems`.
   * @see {@link UiItemSlotElement}
   */
  type: number;
  /**
   * The amount of this item.
   */
  count: number;
}

/**
 * @beta
 * Serializable {@link MachineDefinition}.
 * @see {@link MachineDefinition}, {@link registerMachine}
 */
export interface RegisteredMachine {
  description: Description;
  updateUiEvent?: string;
}

export interface InitOptions {
  namespace: string;
}

let initOptions: InitOptions | undefined;

/**
 * @beta
 * Sets global info to be used by functions in this package.
 */
export function init(options: InitOptions): void {
  if (initOptions) {
    throw new Error("'init' has already been called");
  }

  initOptions = options;
}

function ensureInitialized(): void {
  if (!initOptions) {
    throw new Error("'init' has not been called");
  }
}

/**
 * @beta
 * Tests whether Bedrock Energistics Core is in the world or not.
 */
export function isBedrockEnergisticsCoreInWorld(): boolean {
  return !!ItemTypes.get(
    "fluffyalien_energisticscore:ui_disabled_storage_bar_segment",
  );
}

/**
 * @beta
 * Registers a machine. This function should be called in the `worldInitialize` after event.
 */
export function registerMachine(options: MachineDefinition): void {
  ensureInitialized();

  logInfo(
    `sending register machine event for '${options.description.id}' (from '${initOptions!.namespace}')`,
  );

  let updateUiEvent: string | undefined;
  if (options.handlers?.updateUi) {
    updateUiEvent = `${options.description.id}__updateUiHandler`;
    registerScriptEventHandler<
      SerializableDimensionLocation,
      UpdateUiHandlerResponse
    >(updateUiEvent, (payload) =>
      options.handlers!.updateUi!(deserializeDimensionLocation(payload)),
    );
  }

  const payload: RegisteredMachine = {
    description: options.description,
    updateUiEvent,
  };

  dispatchScriptEvent(
    "fluffyalien_energisticscore:ipc.register_machine",
    payload,
  );
}

/**
 * @beta
 * Updates the network that a block belongs to, if it has one.
 */
export function updateBlockNetwork(blockLocation: DimensionLocation): void {
  dispatchScriptEvent(
    "fluffyalien_energisticscore:ipc.update_block_network",
    makeSerializableDimensionLocation(blockLocation),
  );
}

/**
 * @beta
 * Updates the networks adjacent to a block.
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
 * @beta
 * Gets the storage of a specific type in a machine.
 * @param loc The location of the machine.
 * @param type The type of storage to get.
 */
export function getMachineStorage(
  loc: DimensionLocation,
  type: StorageType,
): number {
  return getScore(getStorageScoreboard(type), getBlockUniqueId(loc)) ?? 0;
}

/**
 * @beta
 * Sets the storage of a specific type in a machine.
 * @param loc The location of the machine.
 * @param type The type of storage to set.
 * @param value The new value.
 */
export function setMachineStorage(
  loc: DimensionLocation,
  type: StorageType,
  value: number,
): void {
  getStorageScoreboard(type).setScore(getBlockUniqueId(loc), value);
}

/**
 * @beta
 * Gets an item from a machine inventory.
 * @param loc The location of the machine.
 * @param slotId The number ID of the slot as defined when the machine was registered (see {@link UiItemSlotElement}).
 * @returns The {@link MachineItemStack}.
 */
export function getItemInMachineSlot(
  loc: DimensionLocation,
  slotId: number,
): MachineItemStack | undefined {
  const participantId = getBlockUniqueId(loc);

  const itemType = getScore(getItemTypeScoreboard(slotId), participantId);
  if (itemType === undefined) {
    return;
  }

  const itemCount = getScore(getItemCountScoreboard(slotId), participantId);
  if (!itemCount) {
    return;
  }

  return {
    type: itemType,
    count: itemCount,
  };
}

/**
 * @beta
 * Sets an item in a machine inventory
 * @param loc The location of the machine
 * @param slotId The number ID of the slot as defined when the machine was registered (see {@link UiItemSlotElement}).
 * @param newItemStack The {@link MachineItemStack} to put in the slot. Pass `undefined` to remove the item in the slot
 */
export function setItemInMachineSlot(
  loc: DimensionLocation,
  slotId: number,
  newItemStack?: MachineItemStack,
): void {
  dispatchScriptEvent(
    "fluffyalien_energisticscore:ipc.set_item_in_machine_slot",
    {
      loc,
      slot: slotId,
      item: newItemStack,
    },
  );
}

/**
 * @beta
 * Queue sending energy, gas, or fluid over a machine network.
 * @remarks
 * Note: in most cases, prefer {@link generate} over this function.
 * Automatically sets the machine's reserve storage to the amount that was not received.
 * @param blockLocation The location of the machine that is sending the energy, gas, or fluid.
 * @param type The storage type to send.
 * @param amount The amount to send.
 * @throws if `amount` is <= 0
 * @see {@link generate}
 */
export function queueSend(
  blockLocation: DimensionLocation,
  type: StorageType,
  amount: number,
): void {
  dispatchScriptEvent("fluffyalien_energisticscore:ipc.queue_send", {
    loc: makeSerializableDimensionLocation(blockLocation),
    type,
    amount,
  });
}

/**
 * @beta
 * Sends energy, gas, or fluid over a machine network. Includes reserve storage as well.
 * @remarks
 * This function should be called every block tick for generators even if the generation is `0` because it sends reserve storage.
 * Automatically sets the machine's reserve storage to the amount that was not received.
 * This function is a wrapper around {@link queueSend}.
 * Unlike `queueSend`, this function does not throw if `amount` <= 0.
 * @param blockLocation The location of the machine that is generating.
 * @param type The storage type to generate.
 * @param amount The amount to generate
 * @see {@link queueSend}
 */
export function generate(
  blockLocation: DimensionLocation,
  type: StorageType,
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
 * @beta
 * Gets a {@link RegisteredMachine} with the specified `id` or `null` if it doesn't exist.
 * @param id The ID of the machine.
 * @returns The RegisteredMachine with the specified `id` or `null` if it doesn't exist.
 * @throws if Bedrock Energistics Core takes too long to respond.
 */
export function getRegisteredMachine(
  id: string,
): Promise<RegisteredMachine | null> {
  ensureInitialized();

  return invokeScriptEvent(
    "fluffyalien_energisticscore:ipc.get_registered_machine",
    initOptions!.namespace,
    id,
  );
}
