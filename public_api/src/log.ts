import { VERSION } from "./constants.js";
import { __GET_INIT_BEC_VER__, tryGetIpcRouter } from "./init.js";

function makeLogString(logLevel: string, message: string): string {
  let namespace: string;

  const ipcRouter = tryGetIpcRouter();
  if (ipcRouter) {
    namespace = ipcRouter.uid;
  } else {
    const initBecVer = __GET_INIT_BEC_VER__();
    namespace = initBecVer ? `<internal v${initBecVer}>` : "<uninitialized>";
  }

  return `[Bedrock Energistics Core API v${VERSION}] (${namespace}) ${logLevel} ${message}`;
}

/**
 * @internal
 */
export function logInfo(message: string): void {
  console.info(makeLogString("INFO", message));
}

/**
 * @internal
 */
export function logWarn(message: string): void {
  console.warn(makeLogString("WARN", message));
}

/**
 * Note: prefer {@link raise} in most cases.
 * @internal
 */
export function makeErrorString(message: string): string {
  return makeLogString("ERROR", message);
}

/**
 * @internal
 */
export function raise(message: string): never {
  throw new Error(makeErrorString(message));
}
