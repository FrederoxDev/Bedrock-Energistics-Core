import { Vector3Utils } from "@minecraft/math";
import { DimensionLocation } from "@minecraft/server";

export function truncateNumber(num: number, decPlaces: number): string {
  const [beforeDec, afterDec] = num.toString().split(".");

  if (afterDec) {
    return `${beforeDec}.${afterDec.slice(0, decPlaces)}`;
  }

  return beforeDec;
}

export function stringifyDimensionLocation(loc: DimensionLocation): string {
  return `${Vector3Utils.toString(loc)} in '${loc.dimension.id}'`;
}
