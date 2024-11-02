import * as ipc from "mcbe-addon-ipc";

/**
 * Initializes this package. Some APIs require this to be called.
 * @beta
 */
export function init(namespace: string): void {
  if (ipc.isInitialized()) return;
  ipc.init(namespace);
}
