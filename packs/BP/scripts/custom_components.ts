import { world } from "@minecraft/server";
import { machineComponent } from "./machine_component";
import { conduitComponent } from "./conduit_component";

world.beforeEvents.worldInitialize.subscribe((e) => {
  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energisticscore:machine",
    machineComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energisticscore:conduit",
    conduitComponent,
  );
});
