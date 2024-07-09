import { DimensionLocation, system, Vector3, world } from "@minecraft/server";
import { registerMachineScriptEvent } from "./registry";
import { MachineNetwork } from "./network";
import { MachineItemStack } from "@/public_api/src";
import { setItemInMachineSlot } from "./data";

interface SerializedDimensionLocation extends Vector3 {
  dimension: string;
}

interface SetItemInMachineSlotPayload {
  loc: SerializedDimensionLocation;
  slot: number;
  item?: MachineItemStack;
}

function deserializeDimensionLocation(
  loc: SerializedDimensionLocation,
): DimensionLocation {
  return {
    dimension: world.getDimension(loc.dimension),
    x: loc.x,
    y: loc.y,
    z: loc.z,
  };
}

system.afterEvents.scriptEventReceive.subscribe(
  (e) => {
    switch (e.id) {
      case "fluffyalien_energisticscore:register_machine":
        registerMachineScriptEvent(e.message);
        break;
      case "fluffyalien_energisticscore:update_block_network": {
        const payload = JSON.parse(e.message) as SerializedDimensionLocation;
        const loc = deserializeDimensionLocation(payload);
        const block = loc.dimension.getBlock(loc);
        if (!block) return;

        MachineNetwork.get(block)?.destroy();
        break;
      }
      case "fluffyalien_energisticscore:update_block_adjacent_networks": {
        const payload = JSON.parse(e.message) as SerializedDimensionLocation;
        const loc = deserializeDimensionLocation(payload);
        const block = loc.dimension.getBlock(loc);
        if (!block) return;

        MachineNetwork.updateAdjacent(block);
        break;
      }
      case "fluffyalien_energistics:set_item_in_machine_slot": {
        const payload = JSON.parse(e.message) as SetItemInMachineSlotPayload;

        const loc = deserializeDimensionLocation(payload.loc);
        setItemInMachineSlot(loc, payload.slot, payload.item);
        break;
      }
    }
  },
  {
    namespaces: ["fluffyalien_energisticscore"],
  },
);
