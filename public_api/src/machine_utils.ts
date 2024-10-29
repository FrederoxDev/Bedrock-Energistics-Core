import { Block, system } from "@minecraft/server";
import { MachineNetwork } from "./network.js";
import { removeBlockFromScoreboards } from "./machine_data_internal.js";

/**
 * Cleans up machine data and updates it's networks.
 * @beta
 * @remarks
 * This is automatically done by Bedrock Energistics Core when a machine is destroyed by a player.
 * If you destroy a machine from script, call this function before the block is removed.
 * @param block The machine block.
 */
export async function removeMachine(block: Block): Promise<void> {
  await MachineNetwork.updateWithBlock(block);
  system.run(() => {
    removeBlockFromScoreboards(block);
  });
}
