import { Application, Container, FederatedPointerEvent } from "pixi.js";
import { WhiteBoardManager } from "./managers/WhiteManager";
import { Card } from "../Card";
import { UIOverlayManager } from "../managers/UIOverlayManager";

export interface WhiteboardConfig {
  backgroundColor: string;
  resolution?: number;
  resizeTo: HTMLElement | Window;
}

export class Whiteboard implements Whiteboard {
  public readonly app: Application;
  public readonly mainContainer: Container;
  protected whiteManager!: WhiteBoardManager;
  protected readonly config: WhiteboardConfig;
  private uiManager: UIOverlayManager | null = null;

  constructor(
    config: WhiteboardConfig = {
      backgroundColor: "#1099bb",
      resizeTo: window,
    }
  ) {
    this.config = config;
    this.app = new Application();
    this.mainContainer = new Container();
  }

  public async initialize(): Promise<void> {
    await this.initializeApplication();
    this.initializeManagers();
  }

  private async initializeApplication(): Promise<void> {
    await this.app.init({
      background: this.config.backgroundColor,
      resizeTo: this.config.resizeTo,
      resolution: this.config.resolution ?? window.devicePixelRatio ?? 1.5,
      autoDensity: true,
    });

    this.configureStage();
  }

  private configureStage(): void {
    this.app.stage.addChild(this.mainContainer);
    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;
    this.app.canvas.tabIndex = 0;
    this.app.canvas.addEventListener("contextmenu", (e: Event) =>
      e.preventDefault()
    );
    this.app.canvas.style.outline = "none"; // remove focus outline
  }

  protected initializeManagers(): void {
    this.whiteManager = new WhiteBoardManager(this.app, this.mainContainer);

    // Listen for 'transformed' event (emitted by WhiteManager) to update UI position
    this.app.stage.on("transformed", () => {
      if (this.uiManager) {
        this.uiManager.updatePosition();
      }
    });

    this.whiteManager
      .getBoxSelection()
      .selectionBox.on("rightClick", (event: FederatedPointerEvent) => {
        console.log("rightClick", event);
        this.showContextMenu(event, null);
      });
  }

  public setSelection(selection: Container | null): void {
    this.whiteManager.getBoxSelection().selectElement(selection);
  }

  public clear(): void {
    this.whiteManager.getBoxSelection().clear();

    this.mainContainer.children.forEach((child) => {
      if (child instanceof Card) {
        child.remove();
      }
    });
  }

  public showCardToolbar(event: FederatedPointerEvent, card: Card): void {
    if (!this.uiManager) return;
    this.uiManager.showToolbar(event, card);
  }

  public showEditableText(card: Card): void {
    if (!this.uiManager) return;
    this.uiManager.showEditableText(card);
  }

  public initializeUI(): void {
    if (!this.app.canvas.parentElement) {
      console.error("Cannot initialize UI: Canvas is not in DOM");
      return;
    }

    // 创建 UIOverlayManager 实例
    this.uiManager = new UIOverlayManager();
    // 设置 app 属性
    this.uiManager.app = this.app;
    // 将组件添加到 canvas 的父元素中
    this.app.canvas.parentElement.appendChild(this.uiManager);
  }

  public showContextMenu(event: FederatedPointerEvent, card: Card): void {
    if (this.uiManager) {
      this.uiManager.showContextMenu(event, card);
    }
  }
}
