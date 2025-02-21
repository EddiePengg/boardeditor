export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string; // 用于后续可能的快捷键提示
}

export class KeyboardManager {
  private shortcuts: ShortcutConfig[] = [];

  constructor(private canvas: HTMLCanvasElement) {
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener("keydown", this.onKeyDown.bind(this));
  }

  private onKeyDown(event: KeyboardEvent): void {
    const matchedShortcut = this.shortcuts.find((shortcut) => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrl === (event.ctrlKey || event.metaKey) &&
        !!shortcut.shift === event.shiftKey &&
        !!shortcut.alt === event.altKey
      );
    });

    if (matchedShortcut) {
      event.preventDefault();
      matchedShortcut.handler(event);
    }
  }

  public registerShortcut(config: ShortcutConfig): void {
    this.shortcuts.push(config);
  }

  public registerShortcuts(configs: ShortcutConfig[]): void {
    configs.forEach((config) => this.registerShortcut(config));
  }

  public unregisterShortcut(key: string): void {
    this.shortcuts = this.shortcuts.filter((s) => s.key !== key);
  }

  public clearShortcuts(): void {
    this.shortcuts = [];
  }
}
