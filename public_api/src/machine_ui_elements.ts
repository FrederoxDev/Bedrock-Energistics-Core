import { UiElementDefinition } from "./machine_registry_types.js";

/**
 * Represents the UI elements of a machine.
 * @beta
 */
export class MachineUiElements
  implements Iterable<[string, UiElementDefinition]>
{
  constructor(private readonly elements: Record<string, UiElementDefinition>) {}

  /**
   * Gets a UI element by its ID.
   * @beta
   * @param id The ID of the UI element to get.
   * @returns A deep copy of the UI element with the specified ID, or `undefined` if it doesn't exist.
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
  ids(): string[] {
    return Object.keys(this.elements);
  }

  /**
   * Creates an iterable of the definitions of all the UI elements.
   * @beta
   * @returns An iterable of the definitions of all the UI elements.
   */
  definitions(): Iterable<UiElementDefinition> {
    return {
      [Symbol.iterator]: (): Iterator<UiElementDefinition> => {
        const ids = this.ids();
        let index = 0;
        return {
          next: (): IteratorResult<UiElementDefinition> => {
            if (index < ids.length) {
              const id = ids[index++];
              const value = this.get(id)!;
              return { value, done: false };
            }
            return { value: undefined, done: true };
          },
        };
      },
    };
  }

  /**
   * Enables iteration over the UI elements.
   * @beta
   */
  [Symbol.iterator](): Iterator<[string, UiElementDefinition]> {
    const ids = this.ids();
    let index = 0;
    return {
      next: (): IteratorResult<[string, UiElementDefinition]> => {
        if (index < ids.length) {
          const id = ids[index++];
          const value = this.get(id)!;
          return { value: [id, value], done: false };
        }
        return { value: undefined, done: true };
      },
    };
  }
}
