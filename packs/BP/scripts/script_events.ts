import {
  machineRegistry,
  registerMachineScriptEventListener,
  registerStorageTypeScriptEventListener,
  storageTypeRegistry,
} from "./registry";
import { MachineNetwork } from "./network";
import {
  MachineItemStack,
  RegisteredMachine,
  StorageTypeDefinition,
} from "@/public_api/src";
import { setItemInMachineSlot } from "./data";
import {
  registerScriptEventHandler,
  registerScriptEventListener,
} from "@/public_api/src/addon_ipc";
import {
  deserializeDimensionLocation,
  SerializableDimensionLocation,
} from "@/public_api/src/internal";
import { getBlockIoCategories } from "./io";

interface SetItemInMachineSlotPayload {
  loc: SerializableDimensionLocation;
  slot: number;
  item?: MachineItemStack;
}

interface QueueSendPayload {
  loc: SerializableDimensionLocation;
  type: string;
  amount: number;
}

registerScriptEventListener<RegisteredMachine>(
  "fluffyalien_energisticscore:ipc.register_machine",
  registerMachineScriptEventListener,
);

registerScriptEventListener<StorageTypeDefinition>(
  "fluffyalien_energisticscore:ipc.register_storage_type",
  registerStorageTypeScriptEventListener,
);

registerScriptEventListener<SerializableDimensionLocation>(
  "fluffyalien_energisticscore:ipc.update_block_networks",
  (payload) => {
    const loc = deserializeDimensionLocation(payload);
    const block = loc.dimension.getBlock(loc);
    if (!block) return;

    for (const category of getBlockIoCategories(block)) {
      MachineNetwork.get(category, block)?.destroy();
    }
  },
);

registerScriptEventListener<SerializableDimensionLocation>(
  "fluffyalien_energisticscore:ipc.update_block_connectable_networks",
  (payload) => {
    const loc = deserializeDimensionLocation(payload);
    const block = loc.dimension.getBlock(loc);
    if (!block) return;

    MachineNetwork.updateAdjacent(block, getBlockIoCategories(block));
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

    const storageType = storageTypeRegistry[payload.type];

    MachineNetwork.getOrEstablish(storageType.category, block)?.queueSend(
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
