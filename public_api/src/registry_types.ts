import { DimensionLocation } from "@minecraft/server";

// ui

/**
 * @beta
 */
export type UiProgressIndicatorElementType = "arrow" | "flame";

/**
 * Options for defining a storage bar UI element.
 * @remarks
 * A storage bar element takes up 4 slots in an inventory,
 * so ensure that the machine entity's inventory is properly sized.
 * @beta
 */
export interface UiStorageBarElement {
  type: "storageBar";
  startIndex: number;
}

/**
 * Options for defining an item slot UI element.
 * @remarks
 * This is used to store items without persistent entities.
 * If your machine uses a persistent entity, we recommend
 * accessing the entity's inventory directly rather than using this.
 * @beta
 */
export interface UiItemSlotElement {
  type: "itemSlot";
  index: number;
  slotId: number;
  allowedItems: string[];
}

/**
 * Options for defining a progress indicator UI element.
 * @beta
 */
export interface UiProgressIndicatorElement {
  type: "progressIndicator";
  indicator: UiProgressIndicatorElementType;
  index: number;
}

/**
 * See each element type for more information.
 * @beta
 */
export type UiElement =
  | UiStorageBarElement
  | UiItemSlotElement
  | UiProgressIndicatorElement;

/**
 * @beta
 */
export interface UiOptions {
  elements: Record<string, UiElement>;
}

/**
 * @beta
 */
export interface MachineDefinitionDescription {
  id: string;
  /**
   * The ID of the machine entity. Defaults to the value of `id`.
   */
  entityId?: string;
  /**
   * Is the machine entity persistent?
   * See [Persistent Entities](https://fluffyalien1422.github.io/bedrock-energistics-core/documents/Guides.Persistent_Entities.html).
   */
  persistentEntity?: boolean;
  /**
   * UI options for your machine.
   * If this is undefined, then Bedrock Energistics Core will skip UI handling for this machine entity.
   */
  ui?: UiOptions;
}

// handlers

/**
 * @beta
 */
export interface UiElementUpdateOptions {
  element: string;
}

/**
 * @beta
 */
export interface UiStorageBarUpdateOptions extends UiElementUpdateOptions {
  /**
   * The type of this storage bar. Set to "_disabled" to disable the storage bar.
   */
  type: string;
  change: number;
}

/**
 * @beta
 */
export interface MachineHandlerArg {
  blockLocation: DimensionLocation;
}

/**
 * @beta
 */
export interface MachineRecieveHandlerArg extends MachineHandlerArg {
  receiveType: string;
  receiveAmount: number;
}

/**
 * @beta
 */
export interface UpdateUiHandlerResponse {
  storageBars?: UiStorageBarUpdateOptions[];
  progressIndicators?: Record<string, number>;
}

/**
 * @beta
 */
export interface MachineDefinitionHandlers {
  updateUi?(arg: MachineHandlerArg): UpdateUiHandlerResponse;
  /**
   * Called before a machine recieves a storage type.
   * @returns a number that overrides the amount that was received
   * (must be a non-negative integer),
   * or `undefined` to not change anything.
   */
  receive?(arg: MachineRecieveHandlerArg): number | undefined;
}

// registered machine

/**
 * @beta
 */
export interface MachineDefinition {
  description: MachineDefinitionDescription;
  handlers?: MachineDefinitionHandlers;
}

// storage type options

/**
 * @beta
 */
export type StorageTypeColor =
  | "black"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "yellow";

/**
 * @beta
 */
export interface StorageTypeDefinition {
  id: string;
  category: string;
  color: StorageTypeColor;
  name: string;
}
