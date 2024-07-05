import {
  MachineUiItemSlotElement,
  RegisteredMachine,
  TimedCraftingSystemOptions,
  TimedCraftingSystemRecipe,
} from "../../registry";
import { MachineSystem } from ".";
import {
  MachineItemStack,
  getItemInMachineSlot,
  getMachineStorage,
} from "../data";
import { DimensionLocation } from "@minecraft/server";
import { MACHINE_BLOCK_TICK_TIME } from "../../constants";

function getRecipe(
  loc: DimensionLocation,
  options: TimedCraftingSystemOptions,
  definition: RegisteredMachine,
): TimedCraftingSystemRecipe | undefined {
  const itemCache: Record<string, MachineItemStack | null> = {};

  return options.recipes.find((recipe) => {
    const hasStorage = recipe.consumption.every((consumption) => {
      const stored = getMachineStorage(loc, consumption.type);
      return stored >= consumption.amountPerProgress * recipe.maxProgress;
    });
    if (!hasStorage) {
      return false;
    }

    const hasItems = recipe.ingredients.every((ingredient) => {
      let item = itemCache[ingredient.slot] as
        | MachineItemStack
        | null
        | undefined;

      const element = definition.uiElements[
        ingredient.slot
      ] as MachineUiItemSlotElement;

      if (item === undefined) {
        item = getItemInMachineSlot(loc, element.slotId) ?? null;
        itemCache[ingredient.slot] = item;
      }

      if (!item) {
        return false;
      }

      return item.type === element.allowedItems.indexOf(ingredient.item);
    });

    return hasItems;
  });
}

export const timedCraftingSystem: MachineSystem<TimedCraftingSystemOptions> = {
  updateUi({ location, options, definition }) {
    const recipe = getRecipe(location, options, definition);

    if (!recipe) {
      return {
        storageBars: options.storageBars.map((storageBar) => ({
          ...storageBar,
          change: 0,
        })),
      };
    }

    return {
      storageBars: options.storageBars.map((storageBar) => ({
        ...storageBar,
        change:
          recipe.consumption[0].amountPerProgress / MACHINE_BLOCK_TICK_TIME,
      })),
    };
  },
  onTick() {
    return undefined;
  },
};
