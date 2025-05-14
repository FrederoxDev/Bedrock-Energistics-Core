import { UiElementDefinition } from "./machine_registry_types.js";

/**
 * Represents the UI elements of a machine.
 * @beta
 */
export class MachineUiElements implements Iterable<UiElementDefinition> {
  constructor(private readonly elements: Record<string, UiElementDefinition>) {}

  /**
   * Gets a UI element by its ID.
   * @beta
   * @param id The ID of the UI element to get.
   * @returns The UI element with the specified ID, or `undefined` if it doesn't exist.
   */
  get(id: string): UiElementDefinition | undefined {
    const element = this.elements[id] as UiElementDefinition | undefined;
    if (!element) return;

    // deep copy the object to prevent mutation of the local cache
    return JSON.parse(JSON.stringify(element)) as UiElementDefinition;
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
   * Enables iteration over the UI elements.
   * @beta
   */
  [Symbol.iterator](): Iterator<UiElementDefinition> {
    const ids = this.getIds();
    let index = 0;
    return {
      next: (): IteratorResult<UiElementDefinition> => {
        if (index < ids.length) {
          const value = this.get(ids[index++])!;
          return { value, done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }
}
