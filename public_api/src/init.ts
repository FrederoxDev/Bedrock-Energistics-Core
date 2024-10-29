import { raise } from "./log.js";

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
    raise("'init' has already been called");
  }

  initOptions = options;
}

/**
 * @internal
 */
export function ensureInitialized(): void | never {
  if (!initOptions) {
    raise(`Library not initialized: Ensure you call the 'init' function`);
  }
}

/**
 * @internal
 */
export function getInitNamespace(): string {
  ensureInitialized();
  return initOptions!.namespace;
}
