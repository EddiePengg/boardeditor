import * as PIXI from "pixi.js";
import { BoxSelection } from "./BoxSelection";

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
  private isPanning: boolean = false;
  private isPinching: boolean = false;
  private lastPanPosition: { x: number; y: number } | null = null;
  protected readonly boxSelection: BoxSelection;

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
    const isPinchGesture = e.ctrlKey && Math.abs(e.deltaY) < 10;

    if (e.ctrlKey) {
      this.handleZoom(e, isPinchGesture);
    } else {
      this.moveCanvas(-e.deltaX, -e.deltaY);
    }
  }

  private handleZoom(e: WheelEvent, isPinchGesture: boolean): void {
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

    if (this.touchPoints.size === 1) {
      this.startPanning(event);
    } else if (this.touchPoints.size === 2) {
      this.isPanning = false;
      this.isPinching = true;
      this.pinchDistance = 0;
      this.lastPinchDistance = 0;
    }
  }

  private handleMouseDown(event: PIXI.FederatedPointerEvent): void {
    if (event.button === 0) {
      this.boxSelection.onPointerDown(event.global);
    } else if (event.button === 2) {
      this.startPanning(event);
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
    if (this.touchPoints.has(event.pointerId)) {
      this.touchPoints.set(event.pointerId, {
        id: event.pointerId,
        pos: event.global.clone(),
      });
    }

    if (this.isPinching) {
      this.updatePinchZoom();
    } else if (this.isPanning) {
      this.updatePanning(event);
    }
  }

  private handleMouseMove(event: PIXI.FederatedPointerEvent): void {
    if (this.isPanning) {
      this.updatePanning(event);
    } else if (this.boxSelection.isActive()) {
      this.boxSelection.onPointerMove(event.global);
    }
  }

  private onPointerUp(event: PIXI.FederatedPointerEvent): void {
    if (event.pointerType === "touch") {
      this.handleTouchEnd(event);
    }

    if (this.isPanning) {
      this.stopPanning();
    } else if (this.boxSelection.isActive()) {
      this.boxSelection.onPointerUp();
    }
  }

  private handleTouchEnd(event: PIXI.FederatedPointerEvent): void {
    this.touchPoints.delete(event.pointerId);
    if (this.touchPoints.size < 2) {
      this.isPinching = false;
      this.pinchDistance = 0;
      this.lastPinchDistance = 0;
    }
  }

  private onPointerTap(event: PIXI.FederatedPointerEvent): void {
    if (event.pointerType === "touch" && !event.isPrimary) return;

    const now = Date.now();
    if (now - this.lastTapTime < this.doubleTapDelay) {
      if (this.onDoubleTap) {
        this.onDoubleTap(event);
      }
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = now;
      setTimeout(() => (this.lastTapTime = 0), this.doubleTapDelay);
    }
  }

  private startPanning(event: PIXI.FederatedPointerEvent): void {
    if (this.isPanning) return;

    this.isPanning = true;
    this.lastPanPosition = {
      x: event.globalX,
      y: event.globalY,
    };

    if (event.pointerType === "mouse") {
      this.app.stage.cursor = "grabbing";
    }
  }

  private updatePanning(event: PIXI.FederatedPointerEvent): void {
    if (
      !this.isPanning ||
      !this.lastPanPosition ||
      !event.isPrimary ||
      this.isPinching
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

  private stopPanning(): void {
    this.isPanning = false;
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

    this.container.scale.set(newScale);
    this.scale = newScale;
    this.lastPinchDistance = newDistance;
    this.pinchDistance = newDistance;
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
