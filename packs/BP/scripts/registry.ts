import { DimensionLocation, world } from "@minecraft/server";
import { logInfo, makeErrorString } from "./utils/log";
import {
  RegisteredMachine,
  StorageTypeDefinition,
  UpdateUiHandlerResponse,
} from "@/public_api/src";
import { invokeScriptEvent } from "mcbe-addon-ipc";
import {
  makeSerializableDimensionLocation,
  MangledRegisteredMachine,
} from "@/public_api/src/internal";

export * from "@/public_api/src/registry_types";

export const machineRegistry: Record<string, InternalRegisteredMachine> = {};
export const machineEntityToBlockIdMap: Record<string, string> = {};
export const storageTypeRegistry: Record<string, StorageTypeDefinition> = {};

export class InternalRegisteredMachine extends RegisteredMachine {
  get updateUiEvent(): string | undefined {
    return this.internal.d;
  }

  callUpdateUiHandler(
    dimensionLocation: DimensionLocation,
  ): Promise<UpdateUiHandlerResponse> {
    if (!this.updateUiEvent) {
      throw new Error(
        makeErrorString(
          "trying to call the 'updateUi' handler but it is not defined",
        ),
      );
    }

    return invokeScriptEvent(
      this.updateUiEvent,
      "fluffyalien_energisticscore",
      makeSerializableDimensionLocation(dimensionLocation),
    ) as Promise<UpdateUiHandlerResponse>;
  }
}

// register energy by default
registerStorageTypeScriptEventListener({
  id: "energy",
  category: "energy",
  color: "yellow",
  name: "energy",
});

export function registerMachineScriptEventListener(
  mData: MangledRegisteredMachine,
): void {
  const data = new InternalRegisteredMachine(mData);

  const entityExistingAttachment = machineEntityToBlockIdMap[data.entityId];
  if (entityExistingAttachment !== data.id) {
    throw new Error(
      makeErrorString(
        `can't register machine '${data.id}': the machine entity '${data.entityId}' is already attached to the machine '${entityExistingAttachment}'`,
      ),
    );
  }

  if (data.id in machineRegistry) {
    logInfo(`overrode machine '${data.id}'`);
  }

  machineRegistry[data.id] = data;
  machineEntityToBlockIdMap[data.entityId] = data.id;
}

export function registerStorageTypeScriptEventListener(
  data: StorageTypeDefinition,
): void {
  if (data.id in storageTypeRegistry) {
    logInfo(`overrode storage type '${data.id}'`);
  }

  storageTypeRegistry[data.id] = data;

  const objectiveId = `fluffyalien_energisticscore:storage${data.id}`;

  if (!world.scoreboard.getObjective(objectiveId)) {
    world.scoreboard.addObjective(objectiveId);
  }
}
