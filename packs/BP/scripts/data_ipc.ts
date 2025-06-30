import {
  GetMachineSlotPayload,
  SetMachineSlotPayload,
} from "@/public_api/src/machine_data_internal";
import * as ipc from "mcbe-addon-ipc";
import { getMachineSlotItemRaw, setMachineSlotItem } from "./data";
import {
  deserializeDimensionLocation,
  SerializableDimensionLocation,
} from "@/public_api/src/serialize_utils";
import { InternalRegisteredMachine } from "./machine_registry";
import { removeMachine } from "./machine";
import { deserializeMachineItemStack } from "@/public_api/src/serialize_machine_item_stack";
import { raise } from "./utils/log";
import { Vector3Utils } from "@minecraft/math";

export function getMachineSlotListener(
  payload: ipc.SerializableValue,
): string | null {
  const data = payload as GetMachineSlotPayload;
  return (
    getMachineSlotItemRaw(deserializeDimensionLocation(data.loc), data.slot) ??
    null
  );
}

export function setMachineSlotListener(payload: ipc.SerializableValue): null {
  const data = payload as SetMachineSlotPayload;
  const loc = deserializeDimensionLocation(data.loc);
  const block = loc.dimension.getBlock(loc);
  if (!block) {
    raise(
      `Failed to set machine slot item. Block not found at ${Vector3Utils.toString(loc)} in '${loc.dimension.id}'.`,
    );
  }

  setMachineSlotItem(
    block,
    data.slot,
    data.item ? deserializeMachineItemStack(data.item) : undefined,
  );

  return null;
}

export function removeMachineListener(payload: ipc.SerializableValue): null {
  const data = payload as SerializableDimensionLocation;

  const loc = deserializeDimensionLocation(data);
  const block = loc.dimension.getBlock(loc);
  if (!block) {
    raise(
      `Expected a block at ${Vector3Utils.toString(loc)} in '${loc.dimension.id}'.`,
    );
  }

  const def = InternalRegisteredMachine.forceGetInternal(block.typeId);

  removeMachine(block, def);

  return null;
}
