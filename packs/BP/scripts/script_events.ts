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
  registerScriptEventStreamListener,
} from "@/public_api/src/addon_ipc";
import {
  deserializeDimensionLocation,
  MangledRegisteredMachine,
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

registerScriptEventListener<MangledRegisteredMachine>(
  "fluffyalien_energisticscore:ipc.registerMachine",
  registerMachineScriptEventListener,
);

registerScriptEventStreamListener<MangledRegisteredMachine>(
  "fluffyalien_energisticscore:ipc.stream.registerMachine",
  registerMachineScriptEventListener,
);

registerScriptEventListener<StorageTypeDefinition>(
  "fluffyalien_energisticscore:ipc.registerStorageType",
  registerStorageTypeScriptEventListener,
);

registerScriptEventListener<SerializableDimensionLocation>(
  "fluffyalien_energisticscore:ipc.updateMachineNetworks",
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
  "fluffyalien_energisticscore:ipc.updateMachineConnectableNetworks",
  (payload) => {
    const loc = deserializeDimensionLocation(payload);
    const block = loc.dimension.getBlock(loc);
    if (!block) return;

    MachineNetwork.updateAdjacent(block, getBlockIoCategories(block));
  },
);

registerScriptEventListener<SerializableDimensionLocation>(
  "fluffyalien_energisticscore:ipc.updateMachineAdjacentNetworks",
  (payload) => {
    const loc = deserializeDimensionLocation(payload);
    const block = loc.dimension.getBlock(loc);
    if (!block) return;

    MachineNetwork.updateAdjacent(block);
  },
);

registerScriptEventListener<QueueSendPayload>(
  "fluffyalien_energisticscore:ipc.queueSend",
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
  "fluffyalien_energisticscore:ipc.setMachineSlot",
  (payload) => {
    setItemInMachineSlot(
      deserializeDimensionLocation(payload.loc),
      payload.slot,
      payload.item,
    );
  },
);

registerScriptEventHandler<string, RegisteredMachine | null>(
  "fluffyalien_energisticscore:ipc.getRegisteredMachine",
  (machineId) => machineRegistry[machineId] ?? null,
);
