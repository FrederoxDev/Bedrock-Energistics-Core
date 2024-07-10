import {
  machineRegistry,
  registerMachineScriptEvent,
  StorageType,
} from "./registry";
import { MachineNetwork } from "./network";
import { MachineItemStack, RegisteredMachine } from "@/public_api/src";
import { setItemInMachineSlot } from "./data";
import {
  registerScriptEventHandler,
  registerScriptEventListener,
} from "@/public_api/src/addon_ipc";
import {
  deserializeDimensionLocation,
  SerializableDimensionLocation,
} from "@/public_api/src/internal";

interface SetItemInMachineSlotPayload {
  loc: SerializableDimensionLocation;
  slot: number;
  item?: MachineItemStack;
}

interface QueueSendPayload {
  loc: SerializableDimensionLocation;
  type: StorageType;
  amount: number;
}

registerScriptEventListener<RegisteredMachine>(
  "fluffyalien_energisticscore:ipc.register_machine",
  (payload) => {
    registerMachineScriptEvent(payload);
  },
);

registerScriptEventListener<SerializableDimensionLocation>(
  "fluffyalien_energisticscore:ipc.update_block_network",
  (payload) => {
    const loc = deserializeDimensionLocation(payload);
    const block = loc.dimension.getBlock(loc);
    if (!block) return;

    MachineNetwork.get(block)?.destroy();
  },
);

registerScriptEventListener<SerializableDimensionLocation>(
  "fluffyalien_energisticscore:ipc.update_block_adjacent_networks",
  (payload) => {
    const loc = deserializeDimensionLocation(payload);
    const block = loc.dimension.getBlock(loc);
    if (!block) return;

    MachineNetwork.updateAdjacent(block);
  },
);

registerScriptEventListener<SerializableDimensionLocation>(
  "fluffyalien_energisticscore:ipc.update_block_adjacent_networks",
  (payload) => {
    const loc = deserializeDimensionLocation(payload);
    const block = loc.dimension.getBlock(loc);
    if (!block) return;

    MachineNetwork.updateAdjacent(block);
  },
);

registerScriptEventListener<QueueSendPayload>(
  "fluffyalien_energisticscore:ipc.queue_send",
  (payload) => {
    const loc = deserializeDimensionLocation(payload.loc);
    const block = loc.dimension.getBlock(loc);
    if (!block) return;

    MachineNetwork.getOrEstablish(block)?.queueSend(
      block,
      payload.type,
      payload.amount,
    );
  },
);

registerScriptEventListener<SetItemInMachineSlotPayload>(
  "fluffyalien_energisticscore:ipc.set_item_in_machine_slot",
  (payload) => {
    setItemInMachineSlot(
      deserializeDimensionLocation(payload.loc),
      payload.slot,
      payload.item,
    );
  },
);

registerScriptEventHandler<string, RegisteredMachine | null>(
  "fluffyalien_energisticscore:ipc.get_registered_machine",
  (machineId) => machineRegistry[machineId] ?? null,
);
