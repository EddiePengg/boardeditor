import * as PIXI from "pixi.js";

// Define the gesture callback type
type GestureCallback = (event: PIXI.FederatedPointerEvent) => void;

/**
 * 处理手势事件，如双击手势的管理器。
 *
 */
export class GestureManager {
  private readonly doubleTapThreshold: number;
  private lastTapTime = 0;
  private onDoubleTapCallback?: GestureCallback; // 双击回调
  private onTapCallback?: GestureCallback; // 单机回调

  constructor(
    private readonly target: PIXI.Container,
    doubleTapThreshold = 200
  ) {
    this.doubleTapThreshold = doubleTapThreshold;
    this.initGestureEvents();
  }

  public setOnDoubleTapCallback(callback: GestureCallback): void {
    this.onDoubleTapCallback = callback;
  }

  public setOnTapCallback(callback: GestureCallback): void {
    this.onTapCallback = callback;
  }

  private initGestureEvents(): void {
    // Listen for tap events to detect double-tap gestures
    this.target.on("pointerdown", this.handlePointerTap.bind(this));
  }

  private handlePointerTap(event: PIXI.FederatedPointerEvent): void {
    const currentTime = Date.now();

    // 双击 Or 单机 事件判断与执行
    if (currentTime - this.lastTapTime < this.doubleTapThreshold) {
      if (this.onDoubleTapCallback) {
        this.onDoubleTapCallback(event);
      } else {
        console.log("No double tap callback set.");
      }

      // Reset double-tap time
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = currentTime;
      setTimeout(() => (this.lastTapTime = 0), this.doubleTapThreshold);
      if (this.onTapCallback) {
        this.onTapCallback(event);
      }
    }
  }
}
