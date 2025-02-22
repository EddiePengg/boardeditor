export interface ContextMenuItem {
  id: string;
  icon?: string;
  label: string;
  shortcut?: string;
  handler?: () => void;
  children?: ContextMenuItem[];
  visible?: (target: unknown) => boolean;
}

export interface ContextMenuConfig {
  targetTypes: string[];
  getItems: (target: unknown) => ContextMenuItem[];
}

export type TargetType = "card" | "selection" | "stage" | "image" | "unknown";
