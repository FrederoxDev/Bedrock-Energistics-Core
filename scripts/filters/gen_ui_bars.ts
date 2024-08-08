/**
 * Generates the ui bar items & textures based on the composite images in packs/data/ui_bars
 */

import * as imgManip from "imagescript";
import * as fs from "fs";
import * as path from "path";
import { TMP_DIR } from "./common";

const STORAGE_BAR_COLORS: string[] = [
  "black",
  "orange",
  "pink",
  "purple",
  "red",
  "yellow",
];

const arrowProgressEmpty = (await imgManip.decode(
  fs.readFileSync(
    "packs/data/ui_composite/progress_indicators/arrow_empty.png",
  ),
)) as imgManip.Image;

const arrowProgressFull = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_composite/progress_indicators/arrow_full.png"),
)) as imgManip.Image;

const flameProgressEmpty = (await imgManip.decode(
  fs.readFileSync(
    "packs/data/ui_composite/progress_indicators/flame_empty.png",
  ),
)) as imgManip.Image;

const flameProgressFull = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_composite/progress_indicators/flame_full.png"),
)) as imgManip.Image;

const itemTexturePath = path.join(TMP_DIR, "RP/textures/item_texture.json");

const itemTexture = JSON.parse(fs.readFileSync(itemTexturePath, "utf8")) as {
  texture_data: Record<string, { textures: string }>;
};

function createUiItem(itemId: string): string {
  return JSON.stringify({
    format_version: "1.20.80",
    "minecraft:item": {
      description: {
        identifier: itemId,
        menu_category: {
          category: "none",
        },
      },
      components: {
        "minecraft:tags": {
          tags: ["fluffyalien_energisticscore:ui_item"],
        },
        "minecraft:icon": {
          textures: {
            default: itemId,
          },
        },
      },
    },
  });
}

async function makeStorageBar(
  baseShortId: string,
  onImg: imgManip.Image,
  offImg: imgManip.Image,
): Promise<void> {
  for (let poweredCount = 0; poweredCount <= 16; poweredCount++) {
    const shortId = baseShortId + poweredCount.toString();
    const itemId = `fluffyalien_energisticscore:${shortId}`;

    fs.writeFileSync(
      path.join(TMP_DIR, `BP/items/${shortId}.json`),
      createUiItem(itemId),
    );

    const texturePath = `textures/fluffyalien/energisticscore/${shortId}`;
    itemTexture.texture_data[itemId] = { textures: texturePath };

    const img = new imgManip.Image(16, 16);

    for (let i = 0; i < 16; i++) {
      img.composite(i < poweredCount ? onImg : offImg, 0, 15 - i);
    }

    fs.writeFileSync(
      path.join(TMP_DIR, "RP", `${texturePath}.png`),
      await img.encode(),
    );
  }
}

// storage bars
for (const color of STORAGE_BAR_COLORS) {
  const imgBasePath = `packs/data/ui_composite/storage_bar_segments/${color}`;

  const onImg = (await imgManip.decode(
    fs.readFileSync(`${imgBasePath}_on.png`),
  )) as imgManip.Image;
  const offImg = (await imgManip.decode(
    fs.readFileSync(`${imgBasePath}_off.png`),
  )) as imgManip.Image;

  await makeStorageBar(`ui_storage_bar_segment_${color}`, onImg, offImg);
}

// progress bar IDs must match `ui_progress_${indicator}${progress}`
// see available `indicator` values in scripts/machine_definition_schema.ts under UI elements

// arrow progress bar
for (let progress = 0; progress <= 16; progress++) {
  const shortId = `ui_progress_arrow${progress.toString()}`;
  const itemId = `fluffyalien_energisticscore:${shortId}`;

  fs.writeFileSync(
    path.join(TMP_DIR, `BP/items/${shortId}.json`),
    createUiItem(itemId),
  );

  const texturePath = `textures/fluffyalien/energisticscore/${shortId}`;
  itemTexture.texture_data[itemId] = { textures: texturePath };

  const img = arrowProgressEmpty.clone();

  if (progress > 0) {
    const compositeImg = arrowProgressFull.clone();
    compositeImg.crop(0, 0, progress, 16);

    img.composite(compositeImg);
  }

  fs.writeFileSync(
    path.join(TMP_DIR, "RP", `${texturePath}.png`),
    await img.encode(),
  );
}

// flame progress bar
for (let progress = 0; progress <= 13; progress++) {
  const shortId = `ui_progress_flame${progress.toString()}`;
  const itemId = `fluffyalien_energisticscore:${shortId}`;

  fs.writeFileSync(
    path.join(TMP_DIR, `BP/items/${shortId}.json`),
    createUiItem(itemId),
  );

  const texturePath = `textures/fluffyalien/energisticscore/${shortId}`;
  itemTexture.texture_data[itemId] = { textures: texturePath };

  const img = flameProgressEmpty.clone();

  if (progress > 0) {
    const compositeImg = flameProgressFull.clone();
    compositeImg.crop(0, 16 - progress, 16, progress);

    img.composite(compositeImg, 0, 16 - progress);
  }

  fs.writeFileSync(
    path.join(TMP_DIR, "RP", `${texturePath}.png`),
    await img.encode(),
  );
}

fs.writeFileSync(itemTexturePath, JSON.stringify(itemTexture));
