import * as ipc from "mcbe-addon-ipc";
import { MachineItemStack } from "@/public_api/src";
import { setMachineSlotItem } from "./data";
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

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.registerMachine",
  registerMachineListener,
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.registerStorageType",
  registerStorageTypeListener,
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.setMachineSlot",
  (payload_) => {
    const payload = payload_ as unknown as SetItemInMachineSlotPayload;
    setMachineSlotItem(
      deserializeDimensionLocation(payload.loc),
      payload.slot,
      payload.item,
    );
    return null;
  },
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.networkDestroy",
  networkDestroyListener,
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.networkQueueSend",
  networkQueueSendListener,
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.generate",
  generateListener,
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.networkEstablish",
  networkEstablishHandler,
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.networkGetWith",
  networkGetWithHandler,
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.networkGetAllWith",
  networkGetAllWithHandler,
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.networkGetOrEstablish",
  networkGetOrEstablishHandler,
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.networkIsPartOfNetwork",
  networkIsPartOfNetworkHandler,
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.getRegisteredMachine",
  (machineId) =>
    //TODO: this needs to use streaming since machine definitions can be streamed
    // so they must be streamed back as well
    // there is no handler response streaming in mcbe-addon-ipc yet
    InternalRegisteredMachine.getInternal(machineId as string)?.internal ??
    null,
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.networkLinkGet",
  (payload) => {
    const data = payload as unknown as NetworkLinkGetRequest;
    const link = getNetworkLinkNode(data.self);
    const result: NetworkLinkGetResponse = { locations: link.getConnections() };
    return result;
  },
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.networkLinkAdd",
  (payload) => {
    const data = payload as unknown as NetworkLinkAddRequest;
    const link = getNetworkLinkNode(data.self);
    link.addConnection(data.other);
    return null;
  },
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.networkLinkRemove",
  (payload) => {
    const data = payload as unknown as NetworkLinkRemoveRequest;
    const link = getNetworkLinkNode(data.self);
    link.removeConnection(data.other);
    return null;
  },
);

ipc.registerListener(
  "fluffyalien_energisticscore:ipc.networkLinkDestroy",
  (payload) => {
    const data = payload as unknown as NetworkLinkDestroyRequest;
    const link = getNetworkLinkNode(data.self);
    link.destroyNode();
    return null;
  },
);
