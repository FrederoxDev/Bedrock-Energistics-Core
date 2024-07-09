import { system, world } from "@minecraft/server";

const overworld = world.getDimension("overworld");

export type ScriptEventListener<TPayload> = (payload: TPayload) => void;
export type ScriptEventHandler<TPayload, TResponse> = (
  payload: TPayload,
) => TResponse;

interface HandlerPayload {
  responseEvent: string;
  payload: unknown;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const listeners = new Map<string, ScriptEventListener<any>>();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handlers = new Map<string, ScriptEventHandler<any, any>>();

export function registerScriptEventListener<TPayload>(
  event: string,
  callback: ScriptEventListener<TPayload>,
): void {
  listeners.set(event, callback);
}

export function removeScriptEventListener(event: string): void {
  listeners.delete(event);
}

export function registerScriptEventHandler<TPayload, TResponse>(
  event: string,
  callback: ScriptEventHandler<TPayload, TResponse>,
): void {
  handlers.set(event, callback);
}

export function removeScriptEventHandler(event: string): void {
  handlers.delete(event);
}

export function dispatchScriptEvent(event: string, payload: unknown): void {
  overworld.runCommand(`scriptevent ${event} ${JSON.stringify(payload)}`);
}

export async function invokeScriptEvent<TPayload, TResponse>(
  event: string,
  payload: TPayload,
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    const responseListenerId = `${event}__responselistener`;

    const timeoutId = system.runTimeout(() => {
      removeScriptEventListener(responseListenerId);
      reject(
        new Error(
          `invoke script event '${event}' timed out: did not recieve a response`,
        ),
      );
    }, 20);

    registerScriptEventListener<TResponse>(responseListenerId, (payload) => {
      removeScriptEventListener(responseListenerId);
      system.clearRun(timeoutId);
      resolve(payload);
    });

    dispatchScriptEvent(event, {
      responseEvent: responseListenerId,
      payload,
    });
  });
}

system.afterEvents.scriptEventReceive.subscribe((e) => {
  const listener = listeners.get(e.id);
  if (listener) {
    listener(JSON.parse(e.message));
    return;
  }

  const handler = handlers.get(e.id);
  if (handler) {
    const payload = JSON.parse(e.message) as HandlerPayload;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response = handler(payload.payload);
    dispatchScriptEvent(payload.responseEvent, response);
  }
});
