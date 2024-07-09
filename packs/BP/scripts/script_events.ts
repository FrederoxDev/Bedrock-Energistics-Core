import { RegisteredMachine, registerMachineScriptEvent } from "./registry";
import { MachineNetwork } from "./network";
import { MachineItemStack } from "@/public_api/src";
import { setItemInMachineSlot } from "./data";
import { registerScriptEventListener } from "@/public_api/src/addon_ipc";
import {
  deserializeDimensionLocation,
  SerializableDimensionLocation,
} from "@/public_api/src/internal";

interface SetItemInMachineSlotPayload {
  loc: SerializableDimensionLocation;
  slot: number;
  item?: MachineItemStack;
}

registerScriptEventListener<RegisteredMachine>(
  "fluffyalien_energisticscore:register_machine",
  (payload) => {
    registerMachineScriptEvent(payload);
  },
);

registerScriptEventListener<SerializableDimensionLocation>(
  "fluffyalien_energisticscore:update_block_network",
  (payload) => {
    const loc = deserializeDimensionLocation(payload);
    const block = loc.dimension.getBlock(loc);
    if (!block) return;

    MachineNetwork.get(block)?.destroy();
  },
);

registerScriptEventListener<SerializableDimensionLocation>(
  "fluffyalien_energisticscore:update_block_adjacent_networks",
  (payload) => {
    const loc = deserializeDimensionLocation(payload);
    const block = loc.dimension.getBlock(loc);
    if (!block) return;

    MachineNetwork.updateAdjacent(block);
  },
);

registerScriptEventListener<SetItemInMachineSlotPayload>(
  "fluffyalien_energistics:set_item_in_machine_slot",
  (payload) => {
    setItemInMachineSlot(
      deserializeDimensionLocation(payload.loc),
      payload.slot,
      payload.item,
    );
  },
);
