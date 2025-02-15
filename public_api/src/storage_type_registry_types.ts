/**
 * @beta
 */
export type StorageTypeColor =
  | "black"
  | "orange"
  | "pink"
  | "purple"
  | "red"
  | "yellow"
  | "blue"
  | "white"
  | "green";

/**
 * @beta
 */
export interface StorageTypeDefinition {
  id: string;
  category: string;
  color: StorageTypeColor;
  name: string;
}
