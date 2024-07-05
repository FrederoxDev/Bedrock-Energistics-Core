import { system } from "@minecraft/server";
import { logInfo } from "./utils/log";

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
  progressIndicator: string;
  storageBars: {
    type: MachineStorageType;
    element: string;
  }[];
  recipes: TimedCraftingSystemRecipe[];
}

// registered machine
export interface RegisteredMachine {
  id: string;
  uiElements: Record<string, MachineUiElement>;
  systems: {
    solarGenerator?: SolarGeneratorSystemOptions;
    timedCrafting?: TimedCraftingSystemOptions;
  };
}

export const machineRegistry: Record<string, RegisteredMachine> = {};

system.afterEvents.scriptEventReceive.subscribe(
  (e) => {
    if (e.id !== "fluffyalien_energisticscore:register_machine") {
      return;
    }

    const data = JSON.parse(e.message) as RegisteredMachine;

    if (data.id in machineRegistry) {
      logInfo(`reregistered machine '${data.id}'`);
    } else {
      logInfo(`registered machine '${data.id}'`);
    }

    machineRegistry[data.id] = data;
  },
  {
    namespaces: ["fluffyalien_energisticscore"],
  },
);
