import { ItemStack } from "@minecraft/server";
import { logWarn } from "./log";

export function tryCreateItemStack(
  id: string,
  amount?: number,
): ItemStack | undefined {
  let itemStack: ItemStack | undefined;
  try {
    itemStack = new ItemStack(id, amount);
  } catch (e) {
    logWarn(
      `An error occured while trying to create an ItemStack: ${String(e)}.`,
    );
  }
  return itemStack;
}

