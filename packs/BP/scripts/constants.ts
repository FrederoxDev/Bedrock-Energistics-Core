import { version as VERSION } from "@/packs/data/simple_manifest.json";
export { VERSION };

export {
  STORAGE_AMOUNT_PER_BAR_SEGMENT,
  MAX_MACHINE_STORAGE,
} from "@/public_api/src";

export const VERSION_STR = VERSION.join(".");
