import { DimensionLocation } from "@minecraft/server";
import {
  OnTickHandlerResponse,
  RegisterMachineOptions,
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
  makeSerializableDimensionLocation,
  SerializableDimensionLocation,
} from "./internal";
import { dispatchScriptEvent, registerScriptEventHandler } from "./addon_ipc";

export * from "./registry_types";

/**
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
 * Registers a machine. This function should be called in the `worldInitialize` after event.
 */
export function registerMachine(options: RegisterMachineOptions): void {
  const onTickEvent = `${options.description.id}__onTickHandler`;
  registerScriptEventHandler<
    SerializableDimensionLocation,
    OnTickHandlerResponse
  >(onTickEvent, (payload) =>
    options.handlers.onTick(deserializeDimensionLocation(payload)),
  );

  let updateUiEvent: string | undefined;
  if (options.handlers.updateUi) {
    updateUiEvent = `${options.description.id}__updateUiHandler`;
    registerScriptEventHandler<
      SerializableDimensionLocation,
      UpdateUiHandlerResponse
    >(updateUiEvent, (payload) =>
      options.handlers.updateUi!(deserializeDimensionLocation(payload)),
    );
  }

  dispatchScriptEvent("fluffyalien_energisticscore:register_machine", {
    description: options.description,
    onTickEvent,
    updateUiEvent,
  });
}

/**
 * @beta
 * Updates the network that a block belongs to, if it has one.
 */
export function updateBlockNetwork(blockLocation: DimensionLocation): void {
  dispatchScriptEvent(
    "fluffyalien_energisticscore:update_block_network",
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
    "fluffyalien_energisticscore:update_block_adjacent_networks",
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
  dispatchScriptEvent("fluffyalien_energistics:set_item_in_machine_slot", {
    loc,
    slot: slotId,
    item: newItemStack,
  });
}
