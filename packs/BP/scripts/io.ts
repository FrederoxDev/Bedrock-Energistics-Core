import { Block } from "@minecraft/server";

export function getBlockIoCategories(block: Block): string[] {
  const tags = block.getTags();
  const categories: string[] = [];

  for (const tag of tags) {
    if (tag.startsWith("fluffyalien_energisticscore:io.")) {
      categories.push(tag.slice("fluffyalien_energisticscore:io.".length));
    }
  }

  return categories;
}
