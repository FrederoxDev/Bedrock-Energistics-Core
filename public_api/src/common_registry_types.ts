/**
 * @beta
 */
export type BaseIpcCallback<TArg, TReturn> = (
  this: null,
  arg: TArg,
) => TReturn | Promise<TReturn>;

