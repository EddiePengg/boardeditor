import * as PIXI from "pixi.js";

export class BoxSelection {
  private selectionBox: PIXI.Graphics;
  private selectedElements: Set<PIXI.Container> = new Set();
  private bounds: PIXI.Rectangle | null = null;

  // 框选状态
  private isDrawing: boolean = false;
  private drawStartPoint: PIXI.Point | null = null;

  // 拖拽状态
  private isDragging: boolean = false;
  private dragStartPoint: PIXI.Point | null = null;

  constructor(
    private stage: PIXI.Container,
    private mainContainer: PIXI.Container
  ) {
    this.selectionBox = new PIXI.Graphics();
    this.mainContainer.addChild(this.selectionBox);
  }

  public onPointerDown(point: PIXI.Point): void {
    // 将全局坐标转换为相对于 mainContainer 的本地坐标
    const localPoint = this.selectionBox.parent.toLocal(point);

    // 如果点击在选区内，开始拖拽
    if (this.bounds?.contains(localPoint.x, localPoint.y)) {
      this.startDrag(localPoint);
      return;
    }

    // 否则开始新的框选
    this.startDraw(localPoint);
  }

  public onPointerMove(point: PIXI.Point): void {
    // 将全局坐标转换为相对于 mainContainer 的本地坐标
    const localPoint = this.mainContainer.toLocal(point);

    if (this.isDragging) {
      this.updateDrag(localPoint);
    } else if (this.isDrawing) {
      this.updateDraw(localPoint);
    }
  }

  public onPointerUp(): void {
    if (this.isDragging) {
      this.endDrag();
    } else if (this.isDrawing) {
      this.endDraw();
    }
  }

  private startDraw(point: PIXI.Point): void {
    this.isDrawing = true;
    this.drawStartPoint = point.clone();
    this.clear();
  }

  private updateDraw(point: PIXI.Point): void {
    if (!this.drawStartPoint) return;

    const bounds = this.calculateBounds(this.drawStartPoint, point);
    this.drawBox(bounds, true);
    this.bounds = bounds;
  }

  private endDraw(): void {
    this.isDrawing = false;
    this.drawStartPoint = null;

    if (this.bounds) {
      this.findIntersectingElements();

      if (this.selectedElements.size === 0) {
        this.clear();
      } else {
        this.drawBox(this.bounds, false);
      }
    }
  }

  private startDrag(point: PIXI.Point): void {
    this.isDragging = true;
    this.dragStartPoint = point.clone();
  }

  private updateDrag(point: PIXI.Point): void {
    if (!this.dragStartPoint || !this.bounds) return;

    const offset = {
      x: point.x - this.dragStartPoint.x,
      y: point.y - this.dragStartPoint.y,
    };

    // 移动选框
    this.selectionBox.position.set(
      this.selectionBox.position.x + offset.x,
      this.selectionBox.position.y + offset.y
    );

    // 移动选中的元素
    this.selectedElements.forEach((element) => {
      element.position.set(
        element.position.x + offset.x,
        element.position.y + offset.y
      );
    });

    // 更新边界和起始点
    this.bounds.x += offset.x;
    this.bounds.y += offset.y;
    this.dragStartPoint = point.clone();
  }

  private endDrag(): void {
    this.isDragging = false;
    this.dragStartPoint = null;
  }

  private calculateBounds(start: PIXI.Point, end: PIXI.Point): PIXI.Rectangle {
    return new PIXI.Rectangle(
      Math.min(start.x, end.x),
      Math.min(start.y, end.y),
      Math.abs(end.x - start.x),
      Math.abs(end.y - start.y)
    );
  }

  private drawBox(bounds: PIXI.Rectangle, withFill: boolean): void {
    this.selectionBox.clear();

    if (withFill) {
      this.selectionBox
        .rect(bounds.x, bounds.y, bounds.width, bounds.height)
        .stroke({ width: 2, color: 0x6b46c1 })
        .fill({ color: 0x6b46c1, alpha: 0.1 });
    } else {
      this.selectionBox
        .rect(bounds.x, bounds.y, bounds.width, bounds.height)
        .stroke({ width: 2, color: 0x6b46c1 });
    }
  }

  private findIntersectingElements(): void {
    if (!this.bounds || !this.mainContainer.children[0]) return;

    // 获取白板内容
    const contents = this.mainContainer.children;
    this.selectedElements.clear();

    contents.forEach((element) => {
      if (this.isIntersecting(element)) {
        this.selectedElements.add(element);
        if (
          "setSelected" in element &&
          typeof element.setSelected === "function"
        ) {
          element.setSelected(true);
        }
      }
    });
  }

  private isIntersecting(element: PIXI.Container): boolean {
    if (!this.bounds) return false;

    // 获取元素相对于 mainContainer 的边界
    const elementBounds = element.getBounds();
    const localBounds = new PIXI.Rectangle(
      elementBounds.x,
      elementBounds.y,
      elementBounds.width,
      elementBounds.height
    );

    // 检查相交
    const isIntersecting = !(
      localBounds.right < this.bounds.left ||
      localBounds.left > this.bounds.right ||
      localBounds.bottom < this.bounds.top ||
      localBounds.top > this.bounds.bottom
    );

    return isIntersecting;
  }

  public clear(): void {
    this.selectedElements.forEach((element) => {
      if (
        "setSelected" in element &&
        typeof element.setSelected === "function"
      ) {
        element.setSelected(false);
      }
    });

    this.selectedElements.clear();
    this.selectionBox.clear();
    this.bounds = null;
  }

  public getSelectedElements(): Set<PIXI.Container> {
    return this.selectedElements;
  }

  public isActive(): boolean {
    return this.isDrawing || this.isDragging;
  }
}
