import { Application, Container } from "pixi.js";
import WhiteBoardManager from "./managers/WhiteManager.js";
import { Card } from "../Card/index.js";

export interface WhiteboardConfig {
  backgroundColor: string;
  resolution?: number;
}

export class Whiteboard implements Whiteboard {
  public readonly app: Application; // PIXI.Application

  public readonly mainContainer: Container; // 无限画布的主要容器，所有元素都在这个容器之下。
  protected whiteManager!: WhiteBoardManager;
  protected readonly config: WhiteboardConfig;

  protected selection: Container | null = null; // 选中元素的容器，用于显示选中元素的外框。

  constructor(
    config: WhiteboardConfig = {
      backgroundColor: "#1099bb",
    }
  ) {
    this.config = config;
    this.app = new Application();
    this.mainContainer = new Container(); // 最重要的白板容器，位于stage之下，所有渲染元素之上。
  }

  public async initialize(): Promise<void> {
    await this.initializeApplication();
    this.initializeManagers();
  }

  private async initializeApplication(): Promise<void> {
    await this.app.init({
      background: this.config.backgroundColor,
      resizeTo: window,
      resolution: this.config.resolution ?? window.devicePixelRatio ?? 1,
      autoDensity: true,
    });

    this.configureStage();
  }

  private configureStage(): void {
    this.app.stage.addChild(this.mainContainer);
    this.app.stage.eventMode = "static";
    this.app.stage.hitArea = this.app.screen;
    this.app.canvas.addEventListener("contextmenu", (e: Event) =>
      e.preventDefault()
    );
  }

  protected initializeManagers(): void {
    this.whiteManager = new WhiteBoardManager(this.app, this.mainContainer);
    this.whiteManager.setKeyDownsHandler({
      Delete: (event: KeyboardEvent) => {
        if (!this.selection) return;
        const card = this.selection as Card;

        if (card.textField.isEditing) {
          console.log("正在编辑中，不能删除");
          return;
        }

        card.deleteCard();
      },
    });
  }

  // public destroy(): void {
  //   this.app.canvas.removeEventListener('contextmenu', this.preventContextMenu);
  //   this.dragManager.destroy();
  //   this.gestureManager.destroy();
  //   this.app.destroy();
  // }

  /**
   *
   * 设置白板当前选中或框选的元素
   *
   * @param selection 选中的元素
   */
  public setSelection(selection: Container | null): void {
    if (this.selection) {
      (this.selection as Card).setSelected(false);
    }
    this.selection = selection;
    (this.selection as Card).setSelected(true);
  }
}
