import {
  dispatchScriptEvent,
  invokeScriptEvent,
  registerScriptEventHandler,
  registerScriptEventListener,
  streamScriptEvent,
} from "mcbe-addon-ipc";
import { ensureInitialized, getInitNamespace } from "./init.js";
import {
  MachineDefinition,
  UiElement,
  UpdateUiHandlerResponse,
} from "./registry_types.js";
import {
  MangledOnButtonPressedPayload,
  MangledRecieveHandlerPayload,
  MangledRegisteredMachine,
} from "./machine_registry_internal.js";
import { system } from "@minecraft/server";
import {
  deserializeDimensionLocation,
  SerializableDimensionLocation,
} from "./serialize_utils.js";
import { logInfo, makeErrorString } from "./log.js";

const UPDATE_UI_HANDLER_SUFFIX = "__h0";
const RECIEVE_HANDLER_SUFFIX = "__h1";
const ON_BUTTON_PRESSED_EVENT_SUFFIX = "__e0";

/**
 * Registers a machine. This function should be called in the `worldInitialize` after event.
 * @param shortId If a handler event cannot be created because the block ID is too long, pass a string here to use it as the prefix instead of the block ID.
 * @param fallbackToStream If the {@link MachineDefinition} cannot be sent, fall back to streaming.
 * @throws If the block ID is too long and a handler is defined, this function will throw an error. Pass `shortId` to use that as the prefix for handler event IDs instead of the block ID.
 * @beta
 */
export function registerMachine(
  definition: MachineDefinition,
  shortId?: string,
  fallbackToStream = true,
): void {
  ensureInitialized();

  const eventIdPrefix = shortId ?? definition.description.id;

  let updateUiEvent: string | undefined;
  if (definition.handlers?.updateUi) {
    updateUiEvent = eventIdPrefix + UPDATE_UI_HANDLER_SUFFIX;

    const callback = definition.handlers.updateUi.bind(null);

    registerScriptEventHandler<
      SerializableDimensionLocation,
      UpdateUiHandlerResponse
    >(updateUiEvent, (payload) =>
      callback({
        blockLocation: deserializeDimensionLocation(payload),
      }),
    );
  }

  let receiveHandlerEvent: string | undefined;
  if (definition.handlers?.receive) {
    receiveHandlerEvent = eventIdPrefix + RECIEVE_HANDLER_SUFFIX;

    const callback = definition.handlers.receive.bind(null);

    registerScriptEventHandler<MangledRecieveHandlerPayload, number>(
      receiveHandlerEvent,
      (payload) =>
        callback({
          blockLocation: deserializeDimensionLocation(payload.a),
          receiveType: payload.b,
          receiveAmount: payload.c,
        }) ?? payload.c,
    );
  }

  let onButtonPressedEvent: string | undefined;
  if (definition.events?.onButtonPressed) {
    onButtonPressedEvent = eventIdPrefix + ON_BUTTON_PRESSED_EVENT_SUFFIX;

    const callback = definition.events.onButtonPressed.bind(null);

    registerScriptEventListener<MangledOnButtonPressedPayload>(
      onButtonPressedEvent,
      (payload) => {
        callback({
          blockLocation: deserializeDimensionLocation(payload.a),
          playerId: payload.b,
          entityId: payload.c,
          elementId: payload.d,
        });
      },
    );
  }

  const payload: MangledRegisteredMachine = {
    a: definition.description.id,
    b: definition.description.persistentEntity,
    c: definition.description.ui?.elements,
    d: updateUiEvent,
    e: definition.description.entityId,
    f: receiveHandlerEvent,
    g: definition.description.maxStorage,
    h: onButtonPressedEvent,
  };

  try {
    dispatchScriptEvent(
      "fluffyalien_energisticscore:ipc.registerMachine",
      payload,
    );
  } catch (err) {
    const caughtErrMessage = `caught error when trying to register machine '${definition.description.id}': ${err instanceof Error || typeof err === "string" ? err.toString() : "unknown error"}`;

    if (!fallbackToStream) {
      throw new Error(
        makeErrorString(
          `${caughtErrMessage}. falling back to streaming is disabled`,
        ),
      );
    }

    logInfo(`${caughtErrMessage}. falling back to streaming`);

    system.runJob(
      streamScriptEvent(
        "fluffyalien_energisticscore:ipc.stream.registerMachine",
        getInitNamespace(),
        payload,
      ),
    );

    return;
  }
}

/**
 * Representation of a machine definition that has been registered.
 * @beta
 * @see {@link MachineDefinition}, {@link registerMachine}
 */
export class RegisteredMachine {
  /**
   * @internal
   * @privateRemarks
   * This is not marked as private because it is extended by `InternalRegisteredMachine`.
   */
  constructor(
    /**
     * @internal
     */
    protected readonly internal: MangledRegisteredMachine,
  ) {}

  /**
   * @returns The ID of this machine.
   * @beta
   */
  get id(): string {
    return this.internal.a;
  }

  /**
   * @returns The ID for this machine's entity.
   * @beta
   */
  get entityId(): string {
    return this.internal.e ?? this.internal.a;
  }

  /**
   * @returns Whether this machine has a persistent entity or not
   * @beta
   */
  get persistentEntity(): boolean {
    return this.internal.b ?? false;
  }

  /**
   * @returns The max amount of each storage type in this machine.
   */
  get maxStorage(): number {
    return this.internal.g ?? 6400;
  }

  /**
   * @returns The UI elements defined for this machine, or `undefined` if the machine has no UI.
   * @beta
   */
  get uiElements(): Record<string, UiElement> | undefined {
    return this.internal.c;
  }

  /**
   * Gets a registered machine.
   * @beta
   * @param id The ID of the machine.
   * @returns The {@link RegisteredMachine} with the specified `id` or `null` if it doesn't exist.
   * @throws if Bedrock Energistics Core takes too long to respond.
   */
  static async get(id: string): Promise<RegisteredMachine | null> {
    ensureInitialized();

    const mangled = (await invokeScriptEvent(
      "fluffyalien_energisticscore:ipc.getRegisteredMachine",
      getInitNamespace(),
      id,
    )) as MangledRegisteredMachine;

    return new RegisteredMachine(mangled);
  }
}
