/**
 * Generates the ui bar items & textures based on the composite images in packs/data/ui_bars
 */

import * as imgManip from "imagescript";
import * as fs from "fs";
import * as path from "path";
import { TMP_DIR } from "./common";

const powerSegmentOff = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/power_segment_off.png"),
)) as imgManip.Image;

const powerSegmentOn = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/power_segment_on.png"),
)) as imgManip.Image;

const hydrogenSegmentOff = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/hydrogen_segment_off.png"),
)) as imgManip.Image;

const hydrogenSegmentOn = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/hydrogen_segment_on.png"),
)) as imgManip.Image;

const nitrogenSegmentOff = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/nitrogen_segment_off.png"),
)) as imgManip.Image;

const nitrogenSegmentOn = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/nitrogen_segment_on.png"),
)) as imgManip.Image;

const carbonSegmentOff = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/carbon_segment_off.png"),
)) as imgManip.Image;

const carbonSegmentOn = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/carbon_segment_on.png"),
)) as imgManip.Image;

const oilSegmentOff = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/oil_segment_off.png"),
)) as imgManip.Image;

const oilSegmentOn = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/oil_segment_on.png"),
)) as imgManip.Image;

const ammoniaSegmentOff = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/ammonia_segment_off.png"),
)) as imgManip.Image;

const ammoniaSegmentOn = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/ammonia_segment_on.png"),
)) as imgManip.Image;

const arrowProgressEmpty = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/arrow_progress_empty.png"),
)) as imgManip.Image;

const arrowProgressFull = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/arrow_progress_full.png"),
)) as imgManip.Image;

const flameProgressEmpty = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/flame_progress_empty.png"),
)) as imgManip.Image;

const flameProgressFull = (await imgManip.decode(
  fs.readFileSync("packs/data/ui_bars/flame_progress_full.png"),
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
await makeStorageBar("ui_power_segment", powerSegmentOn, powerSegmentOff);
await makeStorageBar(
  "ui_hydrogen_segment",
  hydrogenSegmentOn,
  hydrogenSegmentOff,
);
await makeStorageBar(
  "ui_nitrogen_segment",
  nitrogenSegmentOn,
  nitrogenSegmentOff,
);
await makeStorageBar("ui_carbon_segment", carbonSegmentOn, carbonSegmentOff);
await makeStorageBar("ui_oil_segment", oilSegmentOn, oilSegmentOff);
await makeStorageBar("ui_ammonia_segment", ammoniaSegmentOn, ammoniaSegmentOff);

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
