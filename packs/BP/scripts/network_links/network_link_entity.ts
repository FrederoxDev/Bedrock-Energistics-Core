import { world } from "@minecraft/server";

world.afterEvents.entitySpawn.subscribe((e) => {
  if (e.entity.typeId !== "fluffyalien_energisticscore:network_link") return;
  // we need to do this in this event because these entities can be spawned from the public api
  // but the dynamic property can only be set from bedrock energistics core as dynamic properties
  // are sandboxed
  e.entity.setDynamicProperty(
    "fluffyalien_energisticscore:block_location",
    e.entity.location,
  );
});
