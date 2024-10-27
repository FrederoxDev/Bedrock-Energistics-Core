import { deserializeDimensionLocation } from "@/public_api/src/internal";
import {
  MangledNetworkEstablishPayload,
  MangledNetworkGetWithPayload,
} from "@/public_api/src/network_internal";
import { MachineNetwork } from "./network";

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
