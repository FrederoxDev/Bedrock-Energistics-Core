import {
  MachineUiItemSlotElement,
  MachineUiProgressIndicatorElement,
  RegisteredMachine,
  TimedCraftingSystemOptions,
  TimedCraftingSystemRecipe,
} from "../../registry";
import { MachineSystem } from ".";
import {
  getBlockUniqueId,
  getItemInMachineSlot,
  getMachineStorage,
  setItemInMachineSlot,
} from "../data";
import { DimensionLocation, ItemStack } from "@minecraft/server";
import { MACHINE_BLOCK_TICK_TIME } from "../../constants";
import { PROGRESS_INDICATOR_MAX_VALUES } from "../ui";

interface Data {
  progress: number;
  recipe: TimedCraftingSystemRecipe;
}

const dataMap = new Map<string, Data>();

function matchesRecipe(
  loc: DimensionLocation,
  definition: RegisteredMachine,
  recipe: TimedCraftingSystemRecipe,
): boolean {
  for (const ingredient of recipe.ingredients) {
    const element = definition.uiElements[
      ingredient.slot
    ] as MachineUiItemSlotElement;

    const item = getItemInMachineSlot(loc, element.slotId);

    if (!item || item.type !== element.allowedItems.indexOf(ingredient.item)) {
      return false;
    }
  }

  return true;
}

function getRecipe(
  loc: DimensionLocation,
  options: TimedCraftingSystemOptions,
  definition: RegisteredMachine,
): TimedCraftingSystemRecipe | undefined {
  return options.recipes.find((recipe) =>
    matchesRecipe(loc, definition, recipe),
  );
}

export const timedCraftingSystem: MachineSystem<TimedCraftingSystemOptions> = {
  updateUi({ location, options, definition }) {
    const blockUid = getBlockUniqueId(location);
    const data = dataMap.get(blockUid);

    if (!data?.progress) {
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
          -data.recipe.consumption[0].amountPerProgress /
          MACHINE_BLOCK_TICK_TIME,
      })),
      progressIndicators: {
        [options.progressIndicator]: Math.floor(
          data.progress /
            (data.recipe.maxProgress /
              PROGRESS_INDICATOR_MAX_VALUES[
                (
                  definition.uiElements[
                    options.progressIndicator
                  ] as MachineUiProgressIndicatorElement
                ).indicator
              ]),
        ),
      },
    };
  },
  onTick({ block, options, definition }) {
    const blockUid = getBlockUniqueId(block);

    const data = dataMap.get(blockUid);

    if (!data) {
      const recipe = getRecipe(block, options, definition);
      if (!recipe) return;

      dataMap.set(blockUid, { progress: 0, recipe });
      return;
    }

    if (!matchesRecipe(block, definition, data.recipe)) {
      dataMap.delete(blockUid);
      return;
    }

    for (const consumption of data.recipe.consumption) {
      const stored = getMachineStorage(block, consumption.type);
      if (
        stored <
        consumption.amountPerProgress *
          (data.recipe.maxProgress - data.progress)
      ) {
        data.progress = 0;
        return;
      }
    }

    for (const result of data.recipe.result) {
      const element = definition.uiElements[
        result.slot
      ] as MachineUiItemSlotElement;

      const item = getItemInMachineSlot(block, element.slotId);
      if (!item) continue;

      const itemStrId = element.allowedItems[item.type];
      if (
        itemStrId !== result.item ||
        item.count + (result.count ?? 1) > new ItemStack(itemStrId).maxAmount
      ) {
        data.progress = 0;
        return;
      }
    }

    if (data.progress >= data.recipe.maxProgress) {
      data.progress = 0;

      for (const ingredient of data.recipe.ingredients) {
        const slotId = (
          definition.uiElements[ingredient.slot] as MachineUiItemSlotElement
        ).slotId;

        const item = getItemInMachineSlot(block, slotId);
        if (item) {
          item.count--;
        }
        setItemInMachineSlot(block, slotId, item);
      }

      for (const result of data.recipe.result) {
        const element = definition.uiElements[
          result.slot
        ] as MachineUiItemSlotElement;

        const item = getItemInMachineSlot(block, element.slotId);
        if (item) {
          item.count += result.count ?? 1;
          setItemInMachineSlot(block, element.slotId, item);
          continue;
        }

        setItemInMachineSlot(block, element.slotId, {
          type: element.allowedItems.indexOf(result.item),
          count: result.count ?? 1,
        });
      }
    } else {
      data.progress++;
    }

    return data.recipe.consumption.map((v) => ({
      type: v.type,
      change: -v.amountPerProgress,
    }));
  },
};
