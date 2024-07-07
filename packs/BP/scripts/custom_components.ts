import { world } from "@minecraft/server";
import { machineComponent } from "./machine_component";

world.beforeEvents.worldInitialize.subscribe((e) => {
  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energisticscore:machine",
    machineComponent,
  );
});
