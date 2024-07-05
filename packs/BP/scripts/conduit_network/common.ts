import { Block, Vector3 } from "@minecraft/server";
import { StrDirection, getBlockInDirection } from "../utils/direction";
import { Vector3Utils } from "@minecraft/math";

type MachineIoType = "energy" | "gas" | "fluid";

export interface NetworkConnections {
  conduits: Block[];
  generators: Block[];
  consumers: Block[];
}

export function discoverConnections(
  origin: Block,
  ioType: MachineIoType,
): NetworkConnections {
  const connections: NetworkConnections = {
    conduits: [],
    generators: [],
    consumers: [],
  };

  if (!origin.hasTag(`fluffyalien_energisticscore:io_${ioType}`)) {
    return connections;
  }

  const stack: Block[] = [];
  const visitedLocations: Vector3[] = [];

  function handleBlock(block: Block): void {
    stack.push(block);
    visitedLocations.push(block.location);

    if (block.typeId === `fluffyalien_energisticscore:${ioType}_conduit`) {
      connections.conduits.push(block);
      return;
    }

    if (block.hasTag(`fluffyalien_energisticscore:${ioType}_consumer`)) {
      connections.consumers.push(block);
      return;
    }

    connections.generators.push(block);
  }

  function next(currentBlock: Block, direction: StrDirection): void {
    const nextBlock = getBlockInDirection(currentBlock, direction);

    if (
      !nextBlock ||
      !nextBlock.hasTag(`fluffyalien_energisticscore:io_${ioType}`) ||
      visitedLocations.some((loc) =>
        Vector3Utils.equals(loc, nextBlock.location),
      )
    ) {
      return;
    }

    handleBlock(nextBlock);
  }

  handleBlock(origin);

  while (stack.length) {
    const block = stack.pop()!;

    next(block, "north");
    next(block, "east");
    next(block, "south");
    next(block, "west");
    next(block, "up");
    next(block, "down");
  }

  return connections;
}
