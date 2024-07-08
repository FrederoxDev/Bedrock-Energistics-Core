import { system, Vector3, world } from "@minecraft/server";
import { registerMachineScriptEvent } from "./registry";
import { MachineNetwork } from "./network";

interface SerializedDimensionLocation extends Vector3 {
  dimension: string;
}

system.afterEvents.scriptEventReceive.subscribe(
  (e) => {
    switch (e.id) {
      case "fluffyalien_energisticscore:register_machine":
        registerMachineScriptEvent(e.message);
        break;
      case "fluffyalien_energisticscore:update_block_network": {
        const loc = JSON.parse(e.message) as SerializedDimensionLocation;
        const dimension = world.getDimension(loc.dimension);
        const block = dimension.getBlock(loc);
        if (!block) return;

        MachineNetwork.get(block)?.destroy();
        break;
      }
      case "fluffyalien_energisticscore:update_block_adjacent_networks": {
        const loc = JSON.parse(e.message) as SerializedDimensionLocation;
        const dimension = world.getDimension(loc.dimension);
        const block = dimension.getBlock(loc);
        if (!block) return;

        MachineNetwork.updateAdjacent(block);
        break;
      }
    }
  },
  {
    namespaces: ["fluffyalien_energisticscore"],
  },
);
