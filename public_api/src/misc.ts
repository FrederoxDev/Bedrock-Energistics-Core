import { ItemTypes } from "@minecraft/server";

/**
 * Tests whether Bedrock Energistics Core is in the world or not.
 * @beta
 */
export function isBedrockEnergisticsCoreInWorld(): boolean {
  return !!ItemTypes.get(
    "fluffyalien_energisticscore:ui_disabled_storage_bar_segment",
  );
}
