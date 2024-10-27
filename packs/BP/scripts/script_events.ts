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
  getBlockIoCategories,
} from "@/public_api/src";
import { setMachineSlotItem } from "./data";
import {
  registerScriptEventHandler,
  registerScriptEventListener,
  registerScriptEventStreamListener,
} from "mcbe-addon-ipc";
import {
  deserializeDimensionLocation,
  MangledRegisteredMachine,
  SerializableDimensionLocation,
} from "@/public_api/src/internal";
import {
  NetworkLinkGetRequest,
  NetworkLinkGetResponse,
  NetworkLinkAddRequest,
  NetworkLinkRemoveRequest,
  NetworkLinkDestroyRequest,
} from "@/public_api/src/network_links/ipc_events";
import { getNetworkLinkNode } from "./network_links/network_link_component";
import {
  networkDestroyListener,
  networkEstablishHandler,
  networkGetAllWithHandler,
  networkGetOrEstablishHandler,
  networkGetWithHandler,
  networkIsPartOfNetworkHandler,
  networkQueueSendListener,
} from "./network_ipc";

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

    MachineNetwork.updateWithBlock(block);
  },
);

registerScriptEventListener<SerializableDimensionLocation>(
  "fluffyalien_energisticscore:ipc.updateMachineConnectableNetworks",
  (payload) => {
    const loc = deserializeDimensionLocation(payload);
    const block = loc.dimension.getBlock(loc);
    if (!block) return;

    const ioCategories = getBlockIoCategories(block);

    MachineNetwork.updateAdjacent(
      block,
      ioCategories === "any" ? undefined : ioCategories,
    );
  },
);

registerScriptEventListener<SerializableDimensionLocation>(
  "fluffyalien_energisticscore:ipc.updateMachineAdjacentNetworks",
  (payload) => {
    const loc = deserializeDimensionLocation(payload);
    MachineNetwork.updateAdjacent(loc);
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
    setMachineSlotItem(
      deserializeDimensionLocation(payload.loc),
      payload.slot,
      payload.item,
    );
  },
);

registerScriptEventListener(
  "fluffyalien_energisticscore:ipc.networkDestroy",
  networkDestroyListener,
);

registerScriptEventListener(
  "fluffyalien_energisticscore:ipc.networkQueueSend",
  networkQueueSendListener,
);

registerScriptEventHandler(
  "fluffyalien_energisticscore:ipc.networkEstablish",
  networkEstablishHandler,
);

registerScriptEventHandler(
  "fluffyalien_energisticscore:ipc.networkGetWith",
  networkGetWithHandler,
);

registerScriptEventHandler(
  "fluffyalien_energisticscore:ipc.networkGetAllWith",
  networkGetAllWithHandler,
);

registerScriptEventHandler(
  "fluffyalien_energisticscore:ipc.networkGetOrEstablish",
  networkGetOrEstablishHandler,
);

registerScriptEventHandler(
  "fluffyalien_energisticscore:ipc.networkIsPartOfNetwork",
  networkIsPartOfNetworkHandler,
);

registerScriptEventHandler<string, RegisteredMachine | null>(
  "fluffyalien_energisticscore:ipc.getRegisteredMachine",
  (machineId) => machineRegistry[machineId] ?? null,
);

registerScriptEventHandler<NetworkLinkGetRequest, NetworkLinkGetResponse>(
  "fluffyalien_energisticscore:ipc.networkLinkGet",
  (payload) => {
    const link = getNetworkLinkNode(payload.self);
    return { locations: link.getConnections() };
  },
);

registerScriptEventHandler<NetworkLinkAddRequest, null>(
  "fluffyalien_energisticscore:ipc.networkLinkAdd",
  (payload) => {
    const link = getNetworkLinkNode(payload.self);
    link.addConnection(payload.other);
    return null;
  },
);

registerScriptEventHandler<NetworkLinkRemoveRequest, null>(
  "fluffyalien_energisticscore:ipc.networkLinkRemove",
  (payload) => {
    const link = getNetworkLinkNode(payload.self);
    link.removeConnection(payload.other);
    return null;
  },
);

registerScriptEventHandler<NetworkLinkDestroyRequest, null>(
  "fluffyalien_energisticscore:ipc.networkLinkDestroy",
  (payload) => {
    const link = getNetworkLinkNode(payload.self);
    link.destroyNode();
    return null;
  },
);
