import * as PIXI from "pixi.js";
import { BoxSelection } from "./BoxSelection";
import { Card } from "../..";

type GestureHandler = (event: PIXI.FederatedPointerEvent) => void;

interface ScrollState {
  velocity: { x: number; y: number };
  lastTime: number;
  animationId: number | null;
  friction: number;
  minVelocity: number;
}

interface TouchPoint {
  id: number;
  pos: PIXI.Point;
}

export class WhiteBoardManager {
  private isTouchPanning: boolean = false; // 触摸拖动
  private isMousePanning: boolean = false; // 鼠标拖动
  private isTouchPinching: boolean = false; // 触摸捏合
  private lastPanPosition: { x: number; y: number } | null = null;
  protected readonly boxSelection: BoxSelection;

  // 添加长按相关的状态
  private touchHoldTimer: number | null = null;
  private readonly touchHoldDelay: number = 250; // 0.25秒的长按判定
  private isTouchHolding: boolean = false;

  private scrollState: ScrollState = {
    velocity: { x: 0, y: 0 },
    lastTime: 0,
    animationId: null,
    friction: 0.96,
    minVelocity: 0.01,
  };

  private touchPoints: Map<number, TouchPoint> = new Map();

  private scale: number = 1;
  private readonly minScale: number = 0.25;
  private readonly maxScale: number = 2.5;
  private pinchDistance: number = 0;
  private lastPinchDistance: number = 0;
  private lastPinchTime: number = performance.now();

  private readonly doubleTapDelay: number;
  private lastTapTime: number = 0;
  private onDoubleTap?: GestureHandler;
  private keyboardHandlers!: { [key: string]: (event: KeyboardEvent) => void };

  private touchStartPosition: PIXI.Point | null = null;
  private readonly touchMoveThreshold: number = 5; // 移动阈值，超过这个值就认为是在移动而不是点击
  private hasTouchMoved: boolean = false;

  constructor(
    private app: PIXI.Application,
    private container: PIXI.Container,
    doubleTapDelay: number = 200
  ) {
    this.doubleTapDelay = doubleTapDelay;
    this.boxSelection = new BoxSelection(this.app.stage, this.container);
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    const stage = this.app.stage;
    stage.on("pointerdown", this.onPointerDown.bind(this));
    stage.on("pointermove", this.onPointerMove.bind(this));
    stage.on("pointerup", this.onPointerUp.bind(this));
    stage.on("pointerupoutside", this.onPointerUp.bind(this));
    stage.on("pointertap", this.onPointerTap.bind(this));

    window.addEventListener("keydown", this.onKeyDown.bind(this));

    this.app.canvas.addEventListener("wheel", this.onWheel.bind(this), {
      passive: false,
    });
  }

  private onWheel(e: WheelEvent): void {
    e.preventDefault();
    const isPinchGesture = e.ctrlKey && Math.abs(e.deltaY) < 10; // 区别双指捏合和双指上下移动

    if (e.ctrlKey) {
      this.handleZoom(e, isPinchGesture);
    } else {
      this.moveCanvas(-e.deltaX, -e.deltaY);
    }
  }

  private handleZoom(e: WheelEvent, isPinchGesture: boolean): void {
    this.app.stage.emit("transformed");
    const canvas = this.app.canvas;
    const zoomSpeed = isPinchGesture ? 0.028 : 0.0012;
    let newScale = this.scale * (1 - e.deltaY * zoomSpeed);
    newScale = Math.min(Math.max(newScale, this.minScale), this.maxScale);

    const mousePos = {
      x: e.clientX - canvas.getBoundingClientRect().left,
      y: e.clientY - canvas.getBoundingClientRect().top,
    };

    const beforeZoomPos = {
      x: (mousePos.x - this.container.x) / this.scale,
      y: (mousePos.y - this.container.y) / this.scale,
    };

    this.container.scale.set(newScale);

    this.container.x = mousePos.x - beforeZoomPos.x * newScale;
    this.container.y = mousePos.y - beforeZoomPos.y * newScale;

    this.scale = newScale;
  }

  private moveCanvas(dx: number, dy: number): void {
    const moveSpeed = 1;
    this.container.x += dx * moveSpeed;
    this.container.y += dy * moveSpeed;
    this.app.stage.emit("transformed");
  }

  private onPointerDown(event: PIXI.FederatedPointerEvent): void {
    if (event.pointerType === "touch") {
      this.handleTouchStart(event);
    } else if (event.pointerType === "mouse") {
      this.handleMouseDown(event);
    }
  }

  private handleTouchStart(event: PIXI.FederatedPointerEvent): void {
    if (!this.touchPoints.has(event.pointerId)) {
      this.touchPoints.set(event.pointerId, {
        id: event.pointerId,
        pos: event.global.clone(),
      });
    }

    // 记录触摸开始位置
    this.touchStartPosition = event.global.clone();
    this.hasTouchMoved = false;

    const target = event.target as PIXI.Container;
    // 检查是否点击了已选中的区域
    if (this.boxSelection.isTargetSelected(target)) {
      // 如果点击的是已选中区域，立即进入拖动状态
      this.boxSelection.onPointerDown(event);
      // 阻止画布拖动
      this.isTouchPanning = false;
      return;
    }

    // 开始长按计时
    if (this.touchPoints.size === 1) {
      this.startTouchPanning(event);
      this.startTouchHoldTimer(event);
    } else if (this.touchPoints.size === 2) {
      // 如果是双指操作，清除长按计时器
      this.clearTouchHoldTimer();
      this.isTouchPinching = true;
      this.pinchDistance = 0;
      this.lastPinchDistance = 0;
      // 不清除isTouchPanning状态，允许同时进行平移
    }
  }

  private startTouchHoldTimer(event: PIXI.FederatedPointerEvent): void {
    this.clearTouchHoldTimer();
    this.isTouchHolding = false;

    // 如果点击的是已选中区域，不启动长按计时器
    const target = event.target as PIXI.Container;
    if (this.boxSelection.isTargetSelected(target)) {
      return;
    }

    this.touchHoldTimer = window.setTimeout(() => {
      this.isTouchHolding = true;
      console.log("长按开始");
      // 如果超过0.25秒，不启动画布拖拽，而是进行选择操作
      this.isTouchPanning = false;
      this.boxSelection.onPointerDown(event);
    }, this.touchHoldDelay);

    // 立即启动画布拖拽，如果超时会被取消
    this.startTouchPanning(event);
  }

  private clearTouchHoldTimer(): void {
    if (this.touchHoldTimer !== null) {
      clearTimeout(this.touchHoldTimer);
      this.touchHoldTimer = null;
    }
  }

  private handleMouseDown(event: PIXI.FederatedPointerEvent): void {
    if (event.button === 0) {
      this.boxSelection.onPointerDown(event);
    } else if (event.button === 2) {
      this.startMousePanning(event);
    }
  }

  private onPointerMove(event: PIXI.FederatedPointerEvent): void {
    if (event.pointerType === "touch") {
      this.handleTouchMove(event);
    } else if (event.pointerType === "mouse") {
      this.handleMouseMove(event);
    }
  }

  private handleTouchMove(event: PIXI.FederatedPointerEvent): void {
    if (this.touchStartPosition && !this.hasTouchMoved) {
      const dx = event.global.x - this.touchStartPosition.x;
      const dy = event.global.y - this.touchStartPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > this.touchMoveThreshold) {
        this.hasTouchMoved = true;
      }
    }

    if (this.touchPoints.has(event.pointerId)) {
      const oldPoint = this.touchPoints.get(event.pointerId)!;
      const newPoint = event.global.clone();
      this.touchPoints.set(event.pointerId, {
        id: event.pointerId,
        pos: newPoint,
      });

      // 如果移动距离超过阈值，取消长按
      const moveDistance = Math.sqrt(
        Math.pow(newPoint.x - oldPoint.pos.x, 2) +
          Math.pow(newPoint.y - oldPoint.pos.y, 2)
      );

      if (moveDistance > 5) {
        this.clearTouchHoldTimer();
      }
    }

    // 优先处理选中元素的拖动
    const target = event.target as PIXI.Container;
    if (
      this.boxSelection.isTargetSelected(target) ||
      this.boxSelection.isActive()
    ) {
      this.boxSelection.onPointerMove(event.global);
      return;
    }

    if (this.isTouchPinching) {
      this.updatePinchZoom();
    }
    if (this.isTouchPanning && !this.isTouchHolding) {
      // 如果是双指操作，使用第一个手指的位置进行平移
      if (this.touchPoints.size === 2 && event.isPrimary) {
        this.updatePanning(event);
      } else if (this.touchPoints.size === 1) {
        this.updatePanning(event);
      }
    }
  }

  private handleMouseMove(event: PIXI.FederatedPointerEvent): void {
    if (this.isMousePanning) {
      this.updatePanning(event);
    } else if (this.boxSelection.isActive()) {
      this.boxSelection.onPointerMove(event.global);
    }
  }

  private onPointerUp(event: PIXI.FederatedPointerEvent): void {
    if (event.pointerType === "touch") {
      this.handleTouchEnd(event);
    } else if (event.pointerType === "mouse") {
      if (this.isMousePanning) {
        this.stopMousePanning();
      } else if (this.boxSelection.isActive()) {
        this.boxSelection.onPointerUp();
      }
    }
  }

  private handleTouchEnd(event: PIXI.FederatedPointerEvent): void {
    this.clearTouchHoldTimer();
    this.touchPoints.delete(event.pointerId);
    if (this.touchPoints.size < 2) {
      this.isTouchPinching = false;
      this.pinchDistance = 0;
      this.lastPinchDistance = 0;
    }
    if (this.touchPoints.size === 0) {
      this.isTouchHolding = false;
      this.stopTouchPanning();
      this.boxSelection.onPointerUp();
      this.touchStartPosition = null;
    }
  }

  private handleCardTap(event: PIXI.FederatedPointerEvent): void {
    if (!(event.target instanceof Card)) return;

    // 只有在触摸模式下且没有发生移动时才设置选中状态
    if (event.pointerType === "touch" && !this.hasTouchMoved) {
      // this.boxSelection.selectElement(event.target);
      event.target.handleTap(event);
    }

    if (event.button === 2) {
      // 处理右键点击
      event.target.handleRightClick?.(event);
    } else {
      // 处理双击
      const now = Date.now();
      if (now - this.lastTapTime < this.doubleTapDelay) {
        console.log("handleCardTap doubleTap", event.target);
        event.target.handleDoubleTap(event);
        this.lastTapTime = 0;
      } else {
        this.lastTapTime = now;
      }
    }
  }

  private handleStageTap(event: PIXI.FederatedPointerEvent): void {
    if (event.target !== this.app.stage) return;

    const now = Date.now();
    if (now - this.lastTapTime < this.doubleTapDelay) {
      if (this.onDoubleTap) {
        this.onDoubleTap(event);
      }
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = now;
    }
  }

  private onPointerTap(event: PIXI.FederatedPointerEvent): void {
    // 如果是触摸事件且发生了移动，不执行tap逻辑
    if (event.pointerType === "touch" && this.hasTouchMoved) {
      return;
    }

    if (event.target instanceof Card) {
      this.handleCardTap(event);
    } else if (event.target === this.app.stage) {
      this.handleStageTap(event);
    }

    // 重置双击计时器
    setTimeout(() => (this.lastTapTime = 0), this.doubleTapDelay);
  }

  private startTouchPanning(event: PIXI.FederatedPointerEvent): void {
    if (this.isTouchPanning) return;

    this.isTouchPanning = true;
    this.lastPanPosition = {
      x: event.globalX,
      y: event.globalY,
    };
  }

  private startMousePanning(event: PIXI.FederatedPointerEvent): void {
    if (this.isMousePanning) return;

    this.isMousePanning = true;
    this.lastPanPosition = {
      x: event.globalX,
      y: event.globalY,
    };
    this.app.stage.cursor = "grabbing";
  }

  private updatePanning(event: PIXI.FederatedPointerEvent): void {
    if (
      (!this.isTouchPanning && !this.isMousePanning) ||
      !this.lastPanPosition ||
      !event.isPrimary
    ) {
      return;
    }

    const now = performance.now();
    const deltaTime = now - this.scrollState.lastTime;

    const dx = event.globalX - this.lastPanPosition.x;
    const dy = event.globalY - this.lastPanPosition.y;

    if (deltaTime > 0) {
      this.scrollState.velocity = {
        x: dx / deltaTime,
        y: dy / deltaTime,
      };
    }

    this.moveCanvas(dx, dy);

    this.lastPanPosition = {
      x: event.globalX,
      y: event.globalY,
    };
    this.scrollState.lastTime = now;
  }

  private stopTouchPanning(): void {
    this.isTouchPanning = false;
    this.lastPanPosition = null;

    if (
      Math.abs(this.scrollState.velocity.x) > this.scrollState.minVelocity ||
      Math.abs(this.scrollState.velocity.y) > this.scrollState.minVelocity
    ) {
      this.startScrollAnimation();
    }
  }

  private stopMousePanning(): void {
    this.isMousePanning = false;
    this.lastPanPosition = null;
    this.app.stage.cursor = "default";

    if (
      Math.abs(this.scrollState.velocity.x) > this.scrollState.minVelocity ||
      Math.abs(this.scrollState.velocity.y) > this.scrollState.minVelocity
    ) {
      this.startScrollAnimation();
    }
  }

  private startScrollAnimation(): void {
    if (this.scrollState.animationId !== null) {
      cancelAnimationFrame(this.scrollState.animationId);
    }

    const animate = () => {
      this.scrollState.velocity.x *= this.scrollState.friction;
      this.scrollState.velocity.y *= this.scrollState.friction;

      this.moveCanvas(this.scrollState.velocity.x, this.scrollState.velocity.y);

      if (
        Math.abs(this.scrollState.velocity.x) < this.scrollState.minVelocity &&
        Math.abs(this.scrollState.velocity.y) < this.scrollState.minVelocity
      ) {
        if (this.scrollState.animationId !== null) {
          cancelAnimationFrame(this.scrollState.animationId);
          this.scrollState.animationId = null;
        }
        return;
      }

      this.scrollState.animationId = requestAnimationFrame(animate);
    };

    this.scrollState.animationId = requestAnimationFrame(animate);
  }

  private updatePinchZoom(): void {
    const points = Array.from(this.touchPoints.values());
    if (points.length < 2) return;

    const now = performance.now();
    if (now - this.lastPinchTime < 5) return;
    this.lastPinchTime = now;

    const newDistance = this.getDistance(points[0], points[1]);

    if (this.pinchDistance === 0) {
      this.pinchDistance = newDistance;
      this.lastPinchDistance = newDistance;
      return;
    }

    const distanceDelta = Math.abs(newDistance - this.lastPinchDistance);
    if (distanceDelta < 5 || distanceDelta > 50) return;

    const scaleFactor = newDistance / this.pinchDistance;
    let newScale = this.scale * scaleFactor;
    newScale = Math.min(Math.max(newScale, this.minScale), this.maxScale);

    if (isNaN(newScale)) return;

    // 计算缩放中心点
    const center = {
      x: (points[0].pos.x + points[1].pos.x) / 2,
      y: (points[0].pos.y + points[1].pos.y) / 2,
    };

    // 相对于缩放中心点进行缩放
    const beforeZoomPos = {
      x: (center.x - this.container.x) / this.scale,
      y: (center.y - this.container.y) / this.scale,
    };

    this.container.scale.set(newScale);

    // 调整位置以保持缩放中心点不变
    this.container.x = center.x - beforeZoomPos.x * newScale;
    this.container.y = center.y - beforeZoomPos.y * newScale;

    this.scale = newScale;
    this.lastPinchDistance = newDistance;
    this.pinchDistance = newDistance;

    this.app.stage.emit("transformed");
  }

  private getDistance(p1: TouchPoint, p2: TouchPoint): number {
    const dx = p1.pos.x - p2.pos.x;
    const dy = p1.pos.y - p2.pos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!this.keyboardHandlers) return;
    const handler = this.keyboardHandlers[event.key];
    if (handler) {
      handler(event);
    }
  }

  public setDoubleTapHandler(handler: GestureHandler): void {
    this.onDoubleTap = handler;
  }

  public setKeyboardHandlers(handlers: {
    [key: string]: (event: KeyboardEvent) => void;
  }): void {
    this.keyboardHandlers = handlers;
  }

  public getBoxSelection(): BoxSelection {
    return this.boxSelection;
  }
}
