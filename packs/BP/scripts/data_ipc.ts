import {
  GetMachineSlotPayload,
  SetMachineSlotPayload,
} from "@/public_api/src/machine_data_internal";
import * as ipc from "mcbe-addon-ipc";
import { getMachineSlotItem, setMachineSlotItem } from "./data";
import {
  deserializeDimensionLocation,
  SerializableDimensionLocation,
} from "@/public_api/src/serialize_utils";
import { MachineItemStack } from "@/public_api/src";
import { InternalRegisteredMachine } from "./machine_registry";
import { removeMachine } from "./machine";

export function getMachineSlotListener(
  payload: ipc.SerializableValue,
): MachineItemStack | null {
  const data = payload as GetMachineSlotPayload;
  return (
    getMachineSlotItem(deserializeDimensionLocation(data.loc), data.slot) ??
    null
  );
}

export function setMachineSlotListener(payload: ipc.SerializableValue): null {
  const data = payload as SetMachineSlotPayload;
  setMachineSlotItem(
    deserializeDimensionLocation(data.loc),
    data.slot,
    data.item,
  );
  return null;
}

export function removeMachineListener(payload: ipc.SerializableValue): null {
  const data = payload as SerializableDimensionLocation;

  const loc = deserializeDimensionLocation(data);
  const block = loc.dimension.getBlock(loc);
  if (!block) {
    throw new Error(`Expected a block at '${JSON.stringify(data)}'.`);
  }

  const def = InternalRegisteredMachine.forceGetInternal(block.typeId);

  removeMachine(block, def);

  return null;
}
