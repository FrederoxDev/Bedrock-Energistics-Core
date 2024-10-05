import { Block } from "@minecraft/server";

const blockIoCategoryCache: Record<string, string[] | "any"> = {};

export function getBlockIoCategories(block: Block): string[] | "any" {
  // Cache the result of the block tags since they will never change
  // Don't bother iterating all tags of a block every single time its needed.
  if (block.typeId in blockIoCategoryCache) {
    return blockIoCategoryCache[block.typeId];
  }

  // Determine and cache for future lookups.
  const categories = block.hasTag("fluffyalien_energisticscore:io._any")
    ? "any"
    : block.getTags()
      .filter(t => t.startsWith("fluffyalien_energisticscore:io."))
      .map(t => t.slice("fluffyalien_energisticscore:io.".length));

  blockIoCategoryCache[block.typeId] = categories;
  return categories;
}
