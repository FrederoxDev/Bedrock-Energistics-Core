import { MachineItemStack } from "@/public_api/src";
import { setMachineSlotItem } from "./data";
import {
  registerScriptEventHandler,
  registerScriptEventListener,
  registerScriptEventStreamListener,
} from "mcbe-addon-ipc";
import {
  deserializeDimensionLocation,
  SerializableDimensionLocation,
} from "@/public_api/src/serialize_utils";
import {
  NetworkLinkGetRequest,
  NetworkLinkGetResponse,
  NetworkLinkAddRequest,
  NetworkLinkRemoveRequest,
  NetworkLinkDestroyRequest,
} from "@/public_api/src/network_links/ipc_events";
import { getNetworkLinkNode } from "./network_links/network_link_component";
import {
  generateListener,
  networkDestroyListener,
  networkEstablishHandler,
  networkGetAllWithHandler,
  networkGetOrEstablishHandler,
  networkGetWithHandler,
  networkIsPartOfNetworkHandler,
  networkQueueSendListener,
} from "./network_ipc";
import { MangledRegisteredMachine } from "@/public_api/src/machine_registry_internal";
import {
  InternalRegisteredMachine,
  registerMachineListener,
} from "./machine_registry";
import { registerStorageTypeListener } from "./storage_type_registry";

interface SetItemInMachineSlotPayload {
  loc: SerializableDimensionLocation;
  slot: number;
  item?: MachineItemStack;
}

registerScriptEventListener<MangledRegisteredMachine>(
  "fluffyalien_energisticscore:ipc.registerMachine",
  registerMachineListener,
);

registerScriptEventStreamListener<MangledRegisteredMachine>(
  "fluffyalien_energisticscore:ipc.stream.registerMachine",
  registerMachineListener,
);

registerScriptEventListener(
  "fluffyalien_energisticscore:ipc.registerStorageType",
  registerStorageTypeListener,
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

registerScriptEventListener(
  "fluffyalien_energisticscore:ipc.generate",
  generateListener,
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

registerScriptEventHandler<string, MangledRegisteredMachine | null>(
  "fluffyalien_energisticscore:ipc.getRegisteredMachine",
  (machineId) =>
    //TODO: this needs to use streaming since machine definitions can be streamed
    // so they must be streamed back as well
    // there is no handler response streaming in mcbe-addon-ipc yet
    InternalRegisteredMachine.getInternal(machineId)?.internal ?? null,
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
