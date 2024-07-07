import { Block, DimensionLocation } from "@minecraft/server";
import { solarGeneratorSystem } from "./solar_generator";
import { StorageType, RegisteredMachine } from "../registry";
import { timedCraftingSystem } from "./timed_crafing";

export interface MachineSystemUiElementUpdateOptions {
  element: string;
}

export interface MachineSystemUiStorageBarUpdateOptions
  extends MachineSystemUiElementUpdateOptions {
  type: StorageType;
  change: number;
}

export interface MachineSystemUiData {
  storageBars?: MachineSystemUiStorageBarUpdateOptions[];
  progressIndicators?: Record<string, number>;
}

export interface MachineSystemTickStorageUpdateOptions {
  type: StorageType;
  change: number;
}

interface MachineSystemMethodArg<TOptions> {
  options: TOptions;
  definition: RegisteredMachine;
}

interface UpdateUiMachineSystemMethodArg<TOptions>
  extends MachineSystemMethodArg<TOptions> {
  location: DimensionLocation;
}

interface OnTickMachineSystemMethodArg<TOptions>
  extends MachineSystemMethodArg<TOptions> {
  block: Block;
}

export interface MachineSystem<TOptions> {
  updateUi?(arg: UpdateUiMachineSystemMethodArg<TOptions>): MachineSystemUiData;
  onTick(
    arg: OnTickMachineSystemMethodArg<TOptions>,
  ): MachineSystemTickStorageUpdateOptions[] | undefined;
}

export const MACHINE_SYSTEMS: Record<string, MachineSystem<object>> = {
  solarGenerator: solarGeneratorSystem,
  timedCrafting: timedCraftingSystem,
};
