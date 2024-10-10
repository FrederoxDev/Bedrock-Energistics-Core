import { makeError, makeErrorString } from "./internal.js";

/**
 * Initialization options. Used as an argument for {@link init}.
 * @beta
 */
export interface InitOptions {
  namespace: string;
}

let initOptions: InitOptions | undefined;

/**
 * Initializes this package. Some APIs require this to be called.
 * @beta
 */
export function init(options: InitOptions): void {
  if (initOptions) {
    throw new Error(makeErrorString("'init' has already been called"));
  }

  initOptions = options;
}

export function ensureInitialized(): void | never {
  if (!initOptions) {
    makeError(`Library not initialized: Ensure you call the 'init' function`);
  }
}

export function getInitNamespace(): string {
  ensureInitialized();
  return initOptions!.namespace;
}
