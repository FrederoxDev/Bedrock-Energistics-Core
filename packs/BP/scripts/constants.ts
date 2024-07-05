import { version as VERSION } from "@/packs/data/simple_manifest.json";
export { VERSION };

export const VERSION_STR = VERSION.join(".");

/**
 * the number of game ticks per each machine block tick
 */
export const MACHINE_BLOCK_TICK_TIME = 20;

/**
 * the amount that each bar segment in a machine is worth
 */
export const STORAGE_AMOUNT_PER_BAR_SEGMENT = 100;
/**
 * max storage of energy, water, carbon, etc (individually, eg. there can be MAX_MACHINE_STORAGE of both energy and water) in a machine
 */
export const MAX_MACHINE_STORAGE = STORAGE_AMOUNT_PER_BAR_SEGMENT * 64;
