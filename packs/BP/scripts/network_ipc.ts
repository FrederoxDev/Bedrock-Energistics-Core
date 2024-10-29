import { deserializeDimensionLocation } from "@/public_api/src/serialize_utils";
import {
  MangledGeneratePayload,
  MangledNetworkEstablishPayload,
  MangledNetworkGetAllWithPayload,
  MangledNetworkGetWithPayload,
  MangledNetworkInstanceMethodPayload,
  MangledNetworkIsPartOfNetworkPayload,
  MangledNetworkQueueSendPayload,
} from "@/public_api/src/network_internal";
import { MachineNetwork } from "./network";
import { storageTypeRegistry } from "./registry";
import { getMachineStorage } from "./data";

export function networkDestroyListener(
  payload: MangledNetworkInstanceMethodPayload,
): void {
  const networkId = payload.a;
  MachineNetwork.getFromId(networkId)?.destroy();
}

export function networkQueueSendListener(
  payload: MangledNetworkQueueSendPayload,
): void {
  const networkId = payload.a;
  const location = deserializeDimensionLocation(payload.b);
  const type = payload.c;
  const amount = payload.d;

  const block = location.dimension.getBlock(location);
  if (!block) return;

  MachineNetwork.getFromId(networkId)?.queueSend(block, type, amount);
}

export function networkEstablishHandler(
  payload: MangledNetworkEstablishPayload,
): number | null {
  const category = payload.a;
  const blockLocation = deserializeDimensionLocation(payload.b);

  const block = blockLocation.dimension.getBlock(blockLocation);
  if (!block) return null;

  return MachineNetwork.establish(category, block)?.id ?? null;
}

export function networkGetWithHandler(
  payload: MangledNetworkGetWithPayload,
): number | null {
  const category = payload.a;
  const location = deserializeDimensionLocation(payload.b);
  const type = payload.c;

  return MachineNetwork.getWith(category, location, type)?.id ?? null;
}

export function networkGetAllWithHandler(
  payload: MangledNetworkGetAllWithPayload,
): number[] {
  const location = deserializeDimensionLocation(payload.a);
  const type = payload.b;

  return MachineNetwork.getAllWith(location, type).map((network) => network.id);
}

export function networkGetOrEstablishHandler(
  payload: MangledNetworkEstablishPayload,
): number | null {
  const category = payload.a;
  const blockLocation = deserializeDimensionLocation(payload.b);

  const block = blockLocation.dimension.getBlock(blockLocation);
  if (!block) return null;

  return (
    (
      MachineNetwork.getWithBlock(category, block) ??
      MachineNetwork.establish(category, block)
    )?.id ?? null
  );
}

export function networkIsPartOfNetworkHandler(
  payload: MangledNetworkIsPartOfNetworkPayload,
): boolean {
  const networkId = payload.a;
  const location = deserializeDimensionLocation(payload.b);
  const type = payload.c;

  return (
    MachineNetwork.getFromId(networkId)?.isPartOfNetwork(location, type) ??
    false
  );
}

export function generateListener(payload: MangledGeneratePayload): void {
  const location = deserializeDimensionLocation(payload.a);
  const type = payload.b;
  const amount = payload.c;

  const block = location.dimension.getBlock(location);
  if (!block) return;

  const fullAmount = amount + getMachineStorage(location, type);
  if (!fullAmount) return;

  const storageType = storageTypeRegistry[type];

  MachineNetwork.getOrEstablish(storageType.category, block)?.queueSend(
    block,
    type,
    fullAmount,
  );
}
