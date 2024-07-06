export type MachineStorageType = "energy";
export type MachineUiProgressIndicatorElementType = "arrow";

// ui
export interface MachineUiStorageBarElement {
  type: "storageBar";
  startIndex: number;
}

export interface MachineUiItemSlotElement {
  type: "itemSlot";
  index: number;
  slotId: number;
  allowedItems: string[];
}

export interface MachineUiProgressIndicatorElement {
  type: "progressIndicator";
  indicator: MachineUiProgressIndicatorElementType;
  index: number;
}

export type MachineUiElement =
  | MachineUiStorageBarElement
  | MachineUiItemSlotElement
  | MachineUiProgressIndicatorElement;

// systems
export interface SolarGeneratorSystemOptions {
  system: "solarGenerator";
  baseGeneration: number;
  rainGeneration: number;
  outputBar: string;
}

export interface TimedCraftingSystemRecipe {
  maxProgress: number;
  consumption: {
    type: MachineStorageType;
    amountPerProgress: number;
  }[];
  ingredients: {
    slot: string;
    item: string;
  }[];
  result: {
    slot: string;
    item: string;
    count?: number;
  }[];
}

export interface TimedCraftingSystemOptions {
  system: "timedCrafting";
  progressIndicator: string;
  storageBars: {
    type: MachineStorageType;
    element: string;
  }[];
  recipes: TimedCraftingSystemRecipe[];
}

export type SystemOptions =
  | SolarGeneratorSystemOptions
  | TimedCraftingSystemOptions;

// registered machine
export interface RegisteredMachine {
  description: {
    id: string;
    uiElements: Record<string, MachineUiElement>;
    workingState?: string;
  };
  systems: SystemOptions[];
}
