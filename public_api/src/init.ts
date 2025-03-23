import * as ipc from "mcbe-addon-ipc";
import { raise } from "./log.js";
import { isBedrockEnergisticsCoreInWorld } from "./misc.js";

let ipcRouter: ipc.Router | undefined;

/**
 * Initializes this package. Some APIs require this to be called.
 * @beta
 */
export function init(namespace: string): void {
  if (ipcRouter) {
    raise("Library already initialized.");
  }

  if (!isBedrockEnergisticsCoreInWorld()) {
    raise(
      `Cannot initialize library (namespace: '${namespace}'). Bedrock Energistics Core is not in the world.`,
    );
  }

  ipcRouter = new ipc.Router(namespace);
}

/**
 * @internal
 */
export function getIpcRouter(): ipc.Router {
  if (!ipcRouter) {
    raise("Library not initialized.");
  }

  return ipcRouter;
}

/**
 * @internal
 */
export function tryGetIpcRouter(): ipc.Router | undefined {
  return ipcRouter;
}
