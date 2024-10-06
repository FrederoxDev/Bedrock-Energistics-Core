import { world } from "@minecraft/server";
import { machineComponent } from "./machine";
import { conduitComponent } from "./conduit_component";
import { networkLinkComponent } from "./network_links/network_link_component";

world.beforeEvents.worldInitialize.subscribe((e) => {
  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energisticscore:machine",
    machineComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energisticscore:conduit",
    conduitComponent,
  );

  e.blockComponentRegistry.registerCustomComponent(
    "fluffyalien_energisticscore:network_link",
    networkLinkComponent
  )
});
