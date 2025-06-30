import { system } from "@minecraft/server";

const REGISTRATION_MAX_TICK = 20;

let worldInitializedTick: number | undefined;

system.beforeEvents.startup.subscribe(() => {
  worldInitializedTick = system.currentTick;
});

/**
 * @internal
 */
export function isRegistrationAllowed(): boolean {
  if (worldInitializedTick === undefined) return true;
  return system.currentTick - worldInitializedTick <= REGISTRATION_MAX_TICK;
}
