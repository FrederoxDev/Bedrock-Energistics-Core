export type StorageType = "energy";
export type UiProgressIndicatorElementType = "arrow";

// ui
export interface UiStorageBarElement {
  type: "storageBar";
  startIndex: number;
}

export interface UiItemSlotElement {
  type: "itemSlot";
  index: number;
  slotId: number;
  allowedItems: string[];
}

export interface UiProgressIndicatorElement {
  type: "progressIndicator";
  indicator: UiProgressIndicatorElementType;
  index: number;
}

export type UiElement =
  | UiStorageBarElement
  | UiItemSlotElement
  | UiProgressIndicatorElement;

// systems
export interface SolarGeneratorSystemOptions {
  system: "solarGenerator";
  baseGeneration: number;
  rainGeneration: number;
  outputBar: string;
}

export interface TimedCraftingSystemRecipeConsumption {
  type: StorageType;
  amountPerProgress: number;
}

export interface TimedCraftingSystemRecipeIngredient {
  slot: string;
  item: string;
}

export interface TimedCraftingSystemRecipeResult {
  slot: string;
  item: string;
  count?: number;
}

export interface TimedCraftingSystemRecipe {
  maxProgress: number;
  consumption: TimedCraftingSystemRecipeConsumption[];
  ingredients: TimedCraftingSystemRecipeIngredient[];
  result: TimedCraftingSystemRecipeResult[];
}

export interface TimedCraftingSystemStorageBarOptions {
  type: StorageType;
  element: string;
}

export interface TimedCraftingSystemOptions {
  system: "timedCrafting";
  progressIndicator: string;
  storageBars: TimedCraftingSystemStorageBarOptions[];
  recipes: TimedCraftingSystemRecipe[];
}

export type SystemOptions =
  | SolarGeneratorSystemOptions
  | TimedCraftingSystemOptions;

// description
export interface RegisteredMachineDescription {
  id: string;
  uiElements: Record<string, UiElement>;
  workingState?: string;
}

// registered machine
export interface RegisteredMachine {
  description: RegisteredMachineDescription;
  systems: SystemOptions[];
}
