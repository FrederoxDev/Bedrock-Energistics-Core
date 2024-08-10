import { world } from "@minecraft/server";
import { machineComponent } from "./machine";
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
