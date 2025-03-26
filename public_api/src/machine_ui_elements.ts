import { UiElementDefinition } from "./machine_registry_types.js";

/**
 * Represents the UI elements of a machine.
 * @beta
 */
export class MachineUiElements {
  constructor(private readonly elements: Record<string, UiElementDefinition>) {}

  /**
   * Gets a UI element by its ID.
   * @beta
   * @param id The ID of the UI element to get.
   * @returns The UI element with the specified ID, or `undefined` if it doesn't exist.
   */
  get(id: string): UiElementDefinition | undefined {
    return this.elements[id];
  }

  /**
   * Gets the IDs of all the UI elements.
   * @beta
   * @returns An array containing the IDs of all the UI elements.
   */
  getIds(): string[] {
    return Object.keys(this.elements);
  }

  /**
   * Gets all the UI elements.
   * @beta
   * @returns An array containing all the UI elements.
   */
  getAll(): UiElementDefinition[] {
    return Object.values(this.elements);
  }

  /**
   * Get all UI elements with any of the specified types.
   * @beta
   * @param types The types to filter by.
   * @returns A record containing the UI elements with any of the specified types.
   */
  getWithTypes(...types: string[]): Record<string, UiElementDefinition> {
    const result: Record<string, UiElementDefinition> = {};

    for (const [id, element] of Object.entries(this.elements)) {
      if (types.includes(element.type)) {
        result[id] = element;
      }
    }

    return result;
  }
}
