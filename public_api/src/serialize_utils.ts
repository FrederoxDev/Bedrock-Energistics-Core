import { DimensionLocation, Vector3, world } from "@minecraft/server";

/**
 * @internal
 */
export interface SerializableDimensionLocation extends Vector3 {
  /**
   * dimension id
   */
  d: string;
}

/**
 * @internal
 */
export function makeSerializableDimensionLocation(
  loc: DimensionLocation,
): SerializableDimensionLocation {
  return {
    d: loc.dimension.id,
    x: loc.x,
    y: loc.y,
    z: loc.z,
  };
}

/**
 * @internal
 */
export function deserializeDimensionLocation(
  loc: SerializableDimensionLocation,
): DimensionLocation {
  return {
    dimension: world.getDimension(loc.d),
    x: loc.x,
    y: loc.y,
    z: loc.z,
  };
}
