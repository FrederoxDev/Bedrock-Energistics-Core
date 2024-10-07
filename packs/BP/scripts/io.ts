import { Block } from "@minecraft/server";

export function getBlockIoCategories(block: Block): string[] | "any" {
  if (block.hasTag("fluffyalien_energisticscore:io._any")) return "any";

  const tags = block.getTags();
  const categories: string[] = [];

  for (const tag of tags) {
    if (tag.startsWith("fluffyalien_energisticscore:io.")) {
      categories.push(tag.slice("fluffyalien_energisticscore:io.".length));
    }
  }

  return categories;
}