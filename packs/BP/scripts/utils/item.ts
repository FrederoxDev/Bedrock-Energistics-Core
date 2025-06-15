import { ItemStack } from "@minecraft/server";
import { logWarn } from "./log";

export function tryCreateItemStack(
  id: string,
  amount?: number,
  warnMsg = "An error occured while trying to create an ItemStack",
): ItemStack | undefined {
  let itemStack: ItemStack | undefined;
  try {
    itemStack = new ItemStack(id, amount);
  } catch (e) {
    logWarn(`${warnMsg}: ${String(e)}.`);
  }
  return itemStack;
}

