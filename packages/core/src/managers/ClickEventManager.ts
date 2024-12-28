import * as PIXI from "pixi.js";

// Define the click event callback type
type ClickEventCallback = (event: PIXI.FederatedPointerEvent) => void;

/**
 * 处理点击事件的管理器，包括单击、双击和右键点击事件。
 */
export class ClickEventManager {
  private readonly doubleTapThreshold: number;
  private lastTapTime = 0;
  private onDoubleTapCallback?: ClickEventCallback; // 双击回调
  private onTapCallback?: ClickEventCallback; // 单击回调
  private onRightClickCallback?: ClickEventCallback; // 右键点击回调

  constructor(
    private readonly target: PIXI.Container,
    doubleTapThreshold = 200
  ) {
    this.doubleTapThreshold = doubleTapThreshold;
    this.initClickEvents();
  }

  public setOnDoubleTapCallback(callback: ClickEventCallback): void {
    this.onDoubleTapCallback = callback;
  }

  public setOnTapCallback(callback: ClickEventCallback): void {
    this.onTapCallback = callback;
  }

  public setOnRightClickCallback(callback: ClickEventCallback): void {
    this.onRightClickCallback = callback;
  }

  private initClickEvents(): void {
    // Listen for tap events to detect single and double-tap events
    this.target.on("pointertap", this.handlePointerTap.bind(this));
    // Listen for right click events
    this.target.on("rightclick", this.handleRightClick.bind(this));
  }

  private handlePointerTap(event: PIXI.FederatedPointerEvent): void {
    const currentTime = Date.now();

    if (currentTime - this.lastTapTime < this.doubleTapThreshold) {
      if (this.onDoubleTapCallback) {
        this.onDoubleTapCallback(event);
      }
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = currentTime;
      setTimeout(() => (this.lastTapTime = 0), this.doubleTapThreshold);
      if (this.onTapCallback) {
        this.onTapCallback(event);
      }
    }
  }

  private handleRightClick(event: PIXI.FederatedPointerEvent): void {
    if (this.onRightClickCallback) {
      this.onRightClickCallback(event);
    } else {
      console.log("no right click callback");
    }
  }
}
