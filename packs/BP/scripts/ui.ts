import {
  machineRegistry,
  StorageTypeColor,
  storageTypeRegistry,
  UiItemSlotElement,
  UiProgressIndicatorElementType,
  UiStorageBarUpdateOptions,
  UpdateUiHandlerResponse,
} from "./registry";
import {
  Container,
  DimensionLocation,
  Entity,
  ItemStack,
  Player,
  system,
  world,
} from "@minecraft/server";
import {
  MAX_MACHINE_STORAGE,
  STORAGE_AMOUNT_PER_BAR_SEGMENT,
} from "./constants";
import {
  getBlockUniqueId,
  getItemInMachineSlot,
  getMachineStorage,
  machineItemStackToItemStack,
  setItemInMachineSlot,
} from "./data";
import { stringifyDimensionLocation, truncateNumber } from "./utils/string";
import { invokeScriptEvent } from "@/public_api/src/addon_ipc";
import {
  makeSerializableDimensionLocation,
  SerializableDimensionLocation,
} from "@/public_api/src/internal";
import { makeErrorString } from "./utils/log";

export const PROGRESS_INDICATOR_MAX_VALUES: Record<
  UiProgressIndicatorElementType,
  number
> = {
  arrow: 16,
};

const STORAGE_TYPE_COLOR_TO_FORMATTING_CODE: Record<StorageTypeColor, string> =
  {
    black: "8",
    orange: "6",
    pink: "d",
    purple: "u",
    red: "4",
    yellow: "e",
  };

/**
 * key = machine entity
 * value = last player in UI
 */
const playersInUi = new Map<Entity, Player>();

/**
 * key = block uid (see getBlockUniqueId)
 * value = array of slot IDs that have changed
 */
export const machineChangedItemSlots = new Map<string, number[]>();

function isUiItem(item: ItemStack): boolean {
  return item.hasTag("fluffyalien_energisticscore:ui_item");
}

/**
 * @returns whether anything was cleared or not
 */
function clearUiItemsFromPlayer(player: Player): boolean {
  let anythingCleared = false;

  const playerCursorInventory = player.getComponent("cursor_inventory")!;
  if (playerCursorInventory.item && isUiItem(playerCursorInventory.item)) {
    playerCursorInventory.clear();
    anythingCleared = true;
  }

  const playerInventory = player.getComponent("inventory")!.container!;
  for (let i = 0; i < playerInventory.size; i++) {
    const item = playerInventory.getItem(i);

    if (item && isUiItem(item)) {
      playerInventory.setItem(i);
      anythingCleared = true;
    }
  }

  return anythingCleared;
}

function fillDisabledUiBar(inventory: Container, startIndex: number): void {
  const itemStack = new ItemStack(
    "fluffyalien_energisticscore:ui_disabled_storage_bar_segment",
  );
  itemStack.nameTag = "§rDisabled";

  inventory.setItem(startIndex, itemStack);
  inventory.setItem(startIndex + 1, itemStack);
  inventory.setItem(startIndex + 2, itemStack);
  inventory.setItem(startIndex + 3, itemStack);
}

function fillUiBar(
  segmentItemBaseId: string,
  labelColorCode: string,
  name: string,
  inventory: Container,
  amount: number,
  startIndex: number,
  change = 0,
): void {
  let remainingSegments = Math.floor(amount / STORAGE_AMOUNT_PER_BAR_SEGMENT);

  for (let i = startIndex + 3; i >= startIndex; i--) {
    const segments = Math.min(16, remainingSegments);
    remainingSegments -= segments;

    const itemStack = new ItemStack(segmentItemBaseId + segments.toString());

    itemStack.nameTag = `§r§${labelColorCode}${amount.toString()}/${MAX_MACHINE_STORAGE.toString()} ${name}`;
    if (change) {
      itemStack.nameTag += ` (${change < 0 ? "" : "+"}${truncateNumber(change, 2)}/t)`;
    }

    inventory.setItem(i, itemStack);
  }
}

function handleBarItems(
  location: DimensionLocation,
  inventory: Container,
  startIndex: number,
  player: Player,
  type: string = "_disabled",
  amount = 0,
  change = 0,
): void {
  for (let i = startIndex; i < startIndex + 4; i++) {
    const inventoryItem = inventory.getItem(i);
    if (inventoryItem?.hasTag("fluffyalien_energisticscore:ui_item")) {
      continue;
    }

    clearUiItemsFromPlayer(player);

    if (inventoryItem) {
      player.dimension.spawnItem(inventoryItem, player.location);
    }

    break;
  }

  if (type === "_disabled") {
    fillDisabledUiBar(inventory, startIndex);
    return;
  }

  if (!(type in storageTypeRegistry)) {
    throw new Error(
      makeErrorString(
        `can't update UI for block at ${stringifyDimensionLocation(location)}: storage type '${type}' does not exist`,
      ),
    );
  }

  const storageTypeOptions = storageTypeRegistry[type];

  fillUiBar(
    `fluffyalien_energisticscore:ui_storage_bar_segment_${storageTypeOptions.color}`,
    STORAGE_TYPE_COLOR_TO_FORMATTING_CODE[storageTypeOptions.color],
    storageTypeOptions.name,
    inventory,
    amount,
    startIndex,
    change,
  );
}

function handleItemSlot(
  loc: DimensionLocation,
  inventory: Container,
  element: UiItemSlotElement,
  player: Player,
  init: boolean,
): void {
  const expectedMachineItem = getItemInMachineSlot(loc, element.slotId);
  const expectedItemStack = machineItemStackToItemStack(
    element,
    expectedMachineItem,
  );

  const changedSlots = machineChangedItemSlots.get(getBlockUniqueId(loc));
  const slotChanged = changedSlots?.includes(element.slotId);

  const containerSlot = inventory.getSlot(element.index);

  if (slotChanged || init) {
    containerSlot.setItem(expectedItemStack);
    return;
  }

  if (!containerSlot.hasItem()) {
    clearUiItemsFromPlayer(player);
    setItemInMachineSlot(loc, element.slotId, undefined, false);
    containerSlot.setItem(machineItemStackToItemStack(element));
    return;
  }

  if (containerSlot.typeId === expectedItemStack.typeId) {
    if (
      expectedMachineItem &&
      containerSlot.amount !== expectedItemStack.amount
    ) {
      setItemInMachineSlot(
        loc,
        element.slotId,
        {
          typeIndex: expectedMachineItem.typeIndex,
          count: containerSlot.amount,
        },
        false,
      );
    }

    return;
  }

  clearUiItemsFromPlayer(player);

  const newTypeIndex = element.allowedItems.indexOf(containerSlot.typeId);
  if (newTypeIndex === -1) {
    setItemInMachineSlot(loc, element.slotId, undefined, false);
    player.dimension.spawnItem(containerSlot.getItem()!, player.location);
    containerSlot.setItem(machineItemStackToItemStack(element));
    return;
  }

  setItemInMachineSlot(
    loc,
    element.slotId,
    {
      typeIndex: newTypeIndex,
      count: containerSlot.amount,
    },
    false,
  );
}

function handleProgressIndicator(
  inventory: Container,
  index: number,
  indicator: UiProgressIndicatorElementType,
  player: Player,
  value = 0,
): void {
  const inventoryItem = inventory.getItem(index);
  if (!inventoryItem?.hasTag("fluffyalien_energisticscore:ui_item")) {
    clearUiItemsFromPlayer(player);

    if (inventoryItem) {
      player.dimension.spawnItem(inventoryItem, player.location);
    }
  }

  inventory.setItem(
    index,
    new ItemStack(
      `fluffyalien_energisticscore:ui_progress_${indicator}${value.toString()}`,
    ),
  );
}

async function updateEntityUi(
  entity: Entity,
  player: Player,
  init: boolean,
): Promise<void> {
  const definition = machineRegistry[entity.typeId];

  if (!definition.description.ui) {
    throw new Error(
      makeErrorString(
        `machine '${entity.typeId}' does not have 'description.ui' defined but has a machine entity`,
      ),
    );
  }

  if (!definition.updateUiEvent) {
    throw new Error(
      makeErrorString(
        `machine '${entity.typeId}' is missing the 'updateUi' handler but has 'description.ui' defined`,
      ),
    );
  }

  const dimensionLocation = {
    x: Math.floor(entity.location.x),
    y: Math.floor(entity.location.y),
    z: Math.floor(entity.location.z),
    dimension: entity.dimension,
  };

  const result = await invokeScriptEvent<
    SerializableDimensionLocation,
    UpdateUiHandlerResponse
  >(
    definition.updateUiEvent,
    "fluffyalien_energisticscore",
    makeSerializableDimensionLocation(dimensionLocation),
  );

  // ensure the entity is still valid after invoking updateUi
  if (!entity.isValid()) {
    return;
  }

  const storageBarChanges: Record<string, UiStorageBarUpdateOptions> = {};

  let progressIndicators: Record<string, number> = {};

  if (result.storageBars) {
    for (const changeOptions of result.storageBars) {
      if (changeOptions.element in storageBarChanges) {
        storageBarChanges[changeOptions.element].change += changeOptions.change;
        continue;
      }

      storageBarChanges[changeOptions.element] = changeOptions;
    }
  }

  if (result.progressIndicators) {
    progressIndicators = {
      ...progressIndicators,
      ...result.progressIndicators,
    };
  }

  const inventory = entity.getComponent("inventory")!.container!;

  for (const [id, options] of Object.entries(
    definition.description.ui.elements,
  )) {
    switch (options.type) {
      case "storageBar": {
        const changeOptions = storageBarChanges[id] as
          | UiStorageBarUpdateOptions
          | undefined;

        if (changeOptions) {
          handleBarItems(
            dimensionLocation,
            inventory,
            options.startIndex,
            player,
            changeOptions.type,
            getMachineStorage(dimensionLocation, changeOptions.type),
            changeOptions.change,
          );
          break;
        }

        handleBarItems(
          dimensionLocation,
          inventory,
          options.startIndex,
          player,
        );
        break;
      }
      case "itemSlot":
        handleItemSlot(dimensionLocation, inventory, options, player, init);
        break;
      case "progressIndicator":
        handleProgressIndicator(
          inventory,
          options.index,
          options.indicator,
          player,
          progressIndicators[id],
        );
        break;
    }
  }

  machineChangedItemSlots.clear();
}

world.afterEvents.playerInteractWithEntity.subscribe((e) => {
  if (
    !e.target.matches({
      families: ["fluffyalien_energisticscore:machine_entity"],
    })
  ) {
    return;
  }

  playersInUi.set(e.target, e.player);
  void updateEntityUi(e.target, e.player, true);
});

world.afterEvents.entitySpawn.subscribe((e) => {
  if (e.entity.typeId !== "minecraft:item") return;

  const itemStack = e.entity.getComponent("item")!.itemStack;

  if (isUiItem(itemStack)) {
    e.entity.remove();
  }
});

system.runInterval(() => {
  for (const [entity, player] of playersInUi) {
    if (!entity.isValid()) {
      playersInUi.delete(entity);
      continue;
    }

    void updateEntityUi(entity, player, false);
  }
}, 5);
