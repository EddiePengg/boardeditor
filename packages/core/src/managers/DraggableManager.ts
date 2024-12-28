import { Container, FederatedPointerEvent } from "pixi.js";

/**
 * - 让元素在stage中可以被拖动
 */
export class DraggableManager {
  private stage: Container;
  private target: Container;
  public isDragging: boolean = false;

  /**
   *
   * @param stage 舞台对象
   * @param target 要拖拽的对象
   */
  constructor(stage: Container, target: Container) {
    this.stage = stage;
    this.target = target;
  }

  /** 初始化拖拽功能 */
  public initialize(): void {
    this.target.eventMode = "static";
    this.target.cursor = "pointer";

    this.target.on("pointerdown", this.onDragStart.bind(this));
  }

  private setIsDragging(isDragging: boolean): void {
    this.isDragging = isDragging;
  }

  /** 拖拽开始 */
  private onDragStart(event: FederatedPointerEvent): void {
    event.stopPropagation();

    // 激活拖拽开始事件
    this.target.emit("dragStart", event);

    this.stage.on("pointermove", this.onDragMove, this);

    this.stage.once("pointerup", this.onDragEnd, this);

    this.stage.on("pointercancel", this.onDragEnd, this);

    this.setIsDragging(true);
  }

  /** 拖拽移动 */
  private onDragMove(event: FederatedPointerEvent): void {
    // 激活拖拽移动事件

    this.target.emit("dragMove", event);
  }

  /** 拖拽结束 */
  private onDragEnd(): void {
    console.log("🔍 DraggableManager - onDragEnd");
    // 激活拖拽结束事件
    this.target.emit("dragEnd");
    this.stage.off("pointermove", this.onDragMove, this);
    this.setIsDragging(false);
  }
}
