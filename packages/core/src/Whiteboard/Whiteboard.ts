import { Application, Container } from "pixi.js";
import { WhiteBoardManager } from "./managers/WhiteManager";
import { Card } from "../Card/index";

export interface WhiteboardConfig {
  backgroundColor: string;
  resolution?: number;
  resizeTo: HTMLElement | Window;
}

export class Whiteboard implements Whiteboard {
  public readonly app: Application; // PIXI.Application

  public readonly mainContainer: Container; // 无限画布的主要容器，所有元素都在这个容器之下。
  protected whiteManager!: WhiteBoardManager;
  protected readonly config: WhiteboardConfig;

  constructor(
    config: WhiteboardConfig = {
      backgroundColor: "#1099bb",
      resizeTo: window, // 画布大小默认和window一样大
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
    this.app.canvas.addEventListener("contextmenu", (e: Event) =>
      e.preventDefault()
    );
  }

  protected initializeManagers(): void {
    this.whiteManager = new WhiteBoardManager(this.app, this.mainContainer);
    this.whiteManager.setKeyboardHandlers({
      Delete: (event: KeyboardEvent) => {
        const selection = this.whiteManager
          .getBoxSelection()
          .getSelectedElement();
        if (!selection) return;

        const card = selection as Card;
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
   * 设置单选
   *
   * @param selection 选中的元素
   */
  public setSelection(selection: Container | null): void {
    this.whiteManager.getBoxSelection().selectElement(selection);
  }

  /**
   * 清空画布上的所有元素
   */
  public clear(): void {
    // 清空选中元素
    this.whiteManager.getBoxSelection().clear();

    this.mainContainer.children.forEach((child) => {
      if (child instanceof Card) {
        child.removeCard();
      }
    });
  }
}
