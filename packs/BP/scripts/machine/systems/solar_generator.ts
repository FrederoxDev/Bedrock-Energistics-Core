import { MachineSystem } from ".";
import { VECTOR3_UP, Vector3Utils } from "@minecraft/math";
import { DimensionLocation, WeatherType, world } from "@minecraft/server";
import { MACHINE_BLOCK_TICK_TIME } from "../../constants";
import { SolarGeneratorSystemOptions } from "@/core_interface/src/registry_types";

function getGeneration(
  location: DimensionLocation,
  options: SolarGeneratorSystemOptions,
): number {
  if (
    location.dimension.id !== "minecraft:overworld" ||
    location.dimension.getBlockFromRay(
      Vector3Utils.add(location, VECTOR3_UP),
      VECTOR3_UP,
      { includeLiquidBlocks: true },
    )
  ) {
    return 0;
  }

  if (world.getTimeOfDay() > 12000) {
    return 0;
  }

  return location.dimension.getWeather() === WeatherType.Clear
    ? options.baseGeneration
    : options.rainGeneration;
}

export const solarGeneratorSystem: MachineSystem<SolarGeneratorSystemOptions> =
  {
    updateUi({ location, options }) {
      return {
        storageBars: [
          {
            element: options.outputBar,
            type: "energy",
            change: getGeneration(location, options) / MACHINE_BLOCK_TICK_TIME,
          },
        ],
      };
    },
    onTick({ block, options }) {
      return [
        {
          type: "energy",
          change: getGeneration(block, options),
        },
      ];
    },
  };
