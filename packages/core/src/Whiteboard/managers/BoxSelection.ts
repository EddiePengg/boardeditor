import * as PIXI from "pixi.js";
import { FederatedEventTarget } from "pixi.js";
import { Card } from "../../Card/Card";

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
  private dragStartPositions: Map<PIXI.Container, PIXI.Point> = new Map();

  constructor(
    private stage: PIXI.Container,
    private mainContainer: PIXI.Container
  ) {
    this.selectionBox = new PIXI.Graphics();
    this.mainContainer.addChild(this.selectionBox);
  }

  public onPointerDown(point: PIXI.Point, target: FederatedEventTarget): void {
    // 将全局坐标转换为相对于 mainContainer 的本地坐标
    const localPoint = this.selectionBox.parent.toLocal(point);

    // 检查是否点击了已选中的元素
    if (this.isTargetSelected(target)) {
      this.startDrag(localPoint);
      return;
    }

    // 如果点击的是卡片元素
    if (target instanceof Card) {
      this.clear();
      this.selectedElements.add(target);
      target.onTap();
      this.startDrag(localPoint);
      return;
    }

    // 如果点击的是主容器，开始框选
    if (target === this.stage || target === this.mainContainer) {
      this.startDraw(localPoint);
      return;
    }
  }

  private isTargetSelected(target: FederatedEventTarget): boolean {
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

    if (this.isDragging) {
      this.updateDrag(localPoint);
    } else if (this.isDrawing) {
      this.updateDraw(localPoint);
    }
  }

  private startDrag(point: PIXI.Point): void {
    this.isDragging = true;
    this.dragStartPoint = point.clone();

    // 记录所有选中元素的初始位置
    this.dragStartPositions.clear();
    this.selectedElements.forEach((element) => {
      this.dragStartPositions.set(element, element.position.clone());
    });
  }

  private updateDrag(point: PIXI.Point): void {
    if (!this.dragStartPoint) return;

    const dx = point.x - this.dragStartPoint.x;
    const dy = point.y - this.dragStartPoint.y;

    // 更新所有选中元素的位置
    this.selectedElements.forEach((element) => {
      const startPos = this.dragStartPositions.get(element);
      if (startPos) {
        element.position.set(startPos.x + dx, startPos.y + dy);
      }
    });

    // 如果有选择框，也要更新它的位置
    if (this.bounds) {
      this.bounds.x += dx;
      this.bounds.y += dy;
      this.drawBox(this.bounds, false);
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

    // 获取元素在全局坐标系中的边界
    const elementBounds = element.getBounds();

    // 将选框的边界转换为全局坐标
    const selectionGlobalBounds = this.selectionBox.getBounds(); // 不使用this.bounds

    // 在全局坐标系中进行碰撞检测
    return !(
      elementBounds.x > selectionGlobalBounds.right ||
      elementBounds.right < selectionGlobalBounds.x ||
      elementBounds.y > selectionGlobalBounds.bottom ||
      elementBounds.bottom < selectionGlobalBounds.y
    );
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
    this.selectionBox.position.set(0, 0);
    this.bounds = null;
    this.isDrawing = false;
    this.isDragging = false;
  }

  public getSelectedElements(): Set<PIXI.Container> {
    return this.selectedElements;
  }

  public isActive(): boolean {
    return this.isDrawing || this.isDragging;
  }

  // 新增：获取当前选中的单个元素
  public getSelectedElement(): PIXI.Container | null {
    return this.selectedElements.size === 1
      ? Array.from(this.selectedElements)[0]
      : null;
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
}
