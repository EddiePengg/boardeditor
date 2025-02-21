import * as PIXI from "pixi.js";
import { Card } from "../../Card/Card";
import { FederatedPointerEvent } from "pixi.js";

export class BoxSelection {
  public selectionBox: PIXI.Graphics;
  private selectedElements: Set<PIXI.Container> = new Set();

  // 框选状态
  private isDrawing: boolean = false;
  private drawStartPoint: PIXI.Point | null = null;

  // 拖拽状态
  private isDragging: boolean = false;
  private dragStartPoint: PIXI.Point | null = null;
  private dragStartPositions: Map<PIXI.Container, PIXI.Point> = new Map();

  constructor(
    private stage: PIXI.Container,
    private mainContainer: PIXI.Container
  ) {
    this.selectionBox = new PIXI.Graphics();
    this.selectionBox.eventMode = "static";
    this.mainContainer.addChild(this.selectionBox);
  }

  public onPointerDown(event: PIXI.FederatedPointerEvent): void {
    const point = event.global;
    const target = event.target as PIXI.Container;

    // 将全局坐标转换为相对于 mainContainer 的本地坐标
    const localPoint = this.selectionBox.parent.toLocal(point);

    // 检查是否点击了已选中的元素
    if (this.isTargetSelected(target)) {
      console.log("isTargetSelected", target);
      this.startDrag(localPoint);
      return;
    }

    // 如果点击的是卡片元素
    if (target instanceof Card) {
      this.clear();
      this.selectedElements.add(target);
      target.handleTap(event);
      this.startDrag(localPoint);
      return;
    }

    // 如果点击的是主容器，开始框选
    if (target === this.stage || target === this.mainContainer) {
      this.startDraw(localPoint);
      return;
    }
  }

  public isTargetSelected(target: PIXI.Container): boolean {
    // 检查目标是否是选中框
    if (target === this.selectionBox) {
      return true;
    }

    // 检查目标是否在已选中的元素中
    return Array.from(this.selectedElements).some((element) => {
      return target === element || (target as any).parent === element;
    });
  }

  public onPointerMove(point: PIXI.Point): void {
    // 将全局坐标转换为相对于 mainContainer 的本地坐标
    const localPoint = this.mainContainer.toLocal(point);

    // 如果正在拖动或者有选中的元素，就更新拖动
    if (this.isDragging) {
      this.updateDrag(localPoint);
    } else if (this.isDrawing) {
      this.updateDraw(localPoint);
    }
  }

  private startDrag(point: PIXI.Point): void {
    console.log("Starting drag operation");
    this.isDragging = true;
    this.dragStartPoint = point.clone();

    // 记录所有选中元素的初始位置
    this.dragStartPositions.clear();
    this.selectedElements.forEach((element) => {
      this.dragStartPositions.set(element, element.position.clone());
    });

    // 只有在有选中元素时才更新选择框位置
    if (this.selectedElements.size > 0) {
      this.dragStartPositions.set(
        this.selectionBox,
        this.selectionBox.position.clone()
      );
    }
  }

  private updateDrag(point: PIXI.Point): void {
    if (!this.dragStartPoint) return;

    const dx = point.x - this.dragStartPoint.x;
    const dy = point.y - this.dragStartPoint.y;

    // 更新所有选中元素的位置
    this.selectedElements.forEach((element) => {
      const startPos = this.dragStartPositions.get(element);
      if (startPos) {
        if (element instanceof Card) {
          element.updatePosition(startPos.x + dx, startPos.y + dy);
        } else {
          element.position.set(startPos.x + dx, startPos.y + dy);
        }
      }
    });

    // 只有在有选中元素时才更新选择框位置
    if (this.selectedElements.size > 0) {
      const startPos = this.dragStartPositions.get(this.selectionBox);
      if (startPos) {
        this.selectionBox.position.set(startPos.x + dx, startPos.y + dy);
      }
    }
  }

  private endDrag(): void {
    this.isDragging = false;
    this.dragStartPoint = null;
    this.dragStartPositions.clear();
  }

  private startDraw(point: PIXI.Point): void {
    this.clear();
    this.isDrawing = true;
    this.drawStartPoint = point.clone();
  }

  private updateDraw(point: PIXI.Point): void {
    if (!this.drawStartPoint) return;

    this.findIntersectingElements();

    const bounds = this.calculateBounds(this.drawStartPoint, point);
    this.drawBox(bounds, true);
  }

  private endDraw(): void {
    this.isDrawing = false;
    this.drawStartPoint = null;

    this.findIntersectingElements();

    if (this.selectedElements.size === 0) {
      this.clear();
    } else {
      this.drawSelectionBoxForElements();
    }
  }

  /**
   * draw the selection box for the selected elements,after endDraw
   */
  private drawSelectionBoxForElements(): void {
    // 计算所有选中元素的边界
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    this.selectedElements.forEach((element) => {
      const bounds = element.getBounds();
      minX = Math.min(minX, bounds.x);
      minY = Math.min(minY, bounds.y);
      maxX = Math.max(maxX, bounds.right);
      maxY = Math.max(maxY, bounds.bottom);
    });

    // 将全局坐标转换为相对于mainContainer的本地坐标
    const topLeft = this.mainContainer.toLocal(new PIXI.Point(minX, minY));
    const bottomRight = this.mainContainer.toLocal(new PIXI.Point(maxX, maxY));

    // 使用计算出的边界绘制选择框
    this.drawBox(
      new PIXI.Rectangle(
        topLeft.x - 10,
        topLeft.y - 10,
        bottomRight.x - topLeft.x + 20,
        bottomRight.y - topLeft.y + 20
      ),
      false
    );
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
        .stroke({ width: 2, color: 0x6b46c1 })
        .fill({ color: 0x6b46c1, alpha: 0.01 });
    }
  }

  /**
   * - traversal all elements in the mainContainer
   * - findIntersectingElements，then add to this.selectedElements and run element.setSelected(true)，
   * - if not intersecting,then remove from this.selectedElements and run element.setSelected(false)
   */
  private findIntersectingElements(): void {
    if (!this.selectionBox || !this.mainContainer.children[0]) return;

    // 获取白板内容
    const contents = this.mainContainer.children;
    this.selectedElements.clear();

    contents.forEach((element) => {
      if (this.isIntersecting(element)) {
        // 相交则添加到选中集合并设置选中状态
        this.selectedElements.add(element);
        if (
          "setSelected" in element &&
          typeof element.setSelected === "function"
        ) {
          element.setSelected(true);
        }
      } else {
        // 不相交则从选中集合移除并取消选中状态
        this.selectedElements.delete(element);
        if (
          "setSelected" in element &&
          typeof element.setSelected === "function"
        ) {
          element.setSelected(false);
        }
      }
    });
  }

  private isIntersecting(element: PIXI.Container): boolean {
    if (element === this.selectionBox) return false;

    // 获取元素在全局坐标系中的边界
    const elementBounds = element.getBounds();
    // 获取选框在全局坐标系中的边界
    const selectionGlobalBounds = this.selectionBox.getBounds();

    // 在全局坐标系中进行碰撞检测
    return !(
      elementBounds.x > selectionGlobalBounds.right ||
      elementBounds.right < selectionGlobalBounds.x ||
      elementBounds.y > selectionGlobalBounds.bottom ||
      elementBounds.bottom < selectionGlobalBounds.y
    );
  }

  /**
   * clear the selected elements and the selection box
   */
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
    this.selectionBox.position.set(0, 0);
    this.isDrawing = false;
    this.isDragging = false;
  }

  /**
   * get the selected elements
   */
  public getSelectedElements(): Set<PIXI.Container> {
    return this.selectedElements;
  }

  public isActive(): boolean {
    return this.isDrawing || this.isDragging;
  }

  // 新增：设置单个元素的选中状态
  public selectElement(element: PIXI.Container | null): void {
    this.clear();
    if (element) {
      this.selectedElements.add(element);
      if (
        "setSelected" in element &&
        typeof element.setSelected === "function"
      ) {
        element.setSelected(true);
      }
    }
  }

  public onPointerUp(): void {
    if (this.isDragging) {
      this.endDrag();
    } else if (this.isDrawing) {
      this.endDraw();
    }
  }

  public selectElements(elements: PIXI.Container[]): void {
    this.clear();
    elements.forEach((element) => {
      this.selectedElements.add(element);
      if (
        "setSelected" in element &&
        typeof element.setSelected === "function"
      ) {
        element.setSelected(true);
      }
    });

    // 如果有选中的元素，计算并绘制包围框
    if (this.selectedElements.size > 0) {
      this.drawSelectionBoxForElements();
    }
  }

  public handleRightClick(event: FederatedPointerEvent): void {
    console.log("handleRightClick");
    this.selectionBox.emit("rightClick", event);
  }
}
