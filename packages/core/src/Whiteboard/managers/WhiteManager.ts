import * as PIXI from "pixi.js";

// 定义手势回调类型
type GestureCallback = (event: PIXI.FederatedPointerEvent) => void;

interface TouchPointData {
  pointerId: number;
  position: PIXI.Point;
}

export default class WhiteBoardManager {
  private isDragging: boolean = false;
  private isZooming: boolean = false;
  private lastPosition: { x: number; y: number } | null = null;

  private touchPoints: Map<number, TouchPointData> = new Map(); // 双指缩放使用

  private zoomFactor: number = 1; // 当前缩放因子
  private minZoom: number = 0.25; // 最小缩放比例
  private maxZoom: number = 2.5; // 最大缩放比例
  private pinchStartDistance: number = 0; // 初始捏合时两个触摸点之间的距离
  private lastDistance: number = 0; // 上一次计算的距离
  private lastUpdateTime: number = performance.now(); // 上一次缩放的时间

  private readonly doubleTapThreshold: number;
  private lastTapTime: number = 0;
  private onDoubleTapCallback?: GestureCallback;
  private keydownsHandler!: { [key: string]: (event: KeyboardEvent) => void };

  constructor(
    private app: PIXI.Application,
    private mainContainer: PIXI.Container,
    doubleTapThreshold: number = 200
  ) {
    this.doubleTapThreshold = doubleTapThreshold;
    this.initEvents();
  }

  public setOnDoubleTapCallback(callback: GestureCallback): void {
    this.onDoubleTapCallback = callback;
  }

  public setKeyDownsHandler(keydownsHandler: {
    [key: string]: (event: KeyboardEvent) => void;
  }): void {
    this.keydownsHandler = keydownsHandler;
  }

  private initEvents(): void {
    this.app.stage.on("pointerdown", this.handlePointerDown.bind(this));
    this.app.stage.on("pointermove", this.handlePointerMove.bind(this));
    this.app.stage.on("pointerup", this.handlePointerUp.bind(this));
    // this.app.stage.on("pointerout", this.handlePointerUp.bind(this));
    // this.app.stage.on("pointercalcel", this.handlePointerUp.bind(this));
    // this.app.stage.on("pointercancel", () => {
    //   console.log("cancel");
    // });
    this.app.stage.on("pointertap", this.handlePointerTap.bind(this));
    window.addEventListener("keydown", this.handleKeyDown.bind(this));
  }

  private handlePointerDown(event: PIXI.FederatedPointerEvent): void {
    if (event.pointerType === "touch") {
      // 触摸输入
      if (!this.touchPoints.has(event.pointerId)) {
        this.touchPoints.set(event.pointerId, {
          pointerId: event.pointerId,
          position: event.global.clone(),
        });
      }
      if (this.touchPoints.size === 1) {
        // 开始拖动
        this.startDragging(event);
      } else if (this.touchPoints.size === 2) {
        // 如果正在拖动，停止拖动
        this.isDragging = false;
        this.isZooming = true;
        this.pinchStartDistance = 0; // 重置捏合起始距离
        this.lastDistance = 0;
      }
    } else if (event.pointerType === "mouse") {
      // 鼠标输入，只响应右键
      if (event.button === 2) {
        this.startDragging(event);
      }
    }
  }

  private handlePointerMove(event: PIXI.FederatedPointerEvent): void {
    if (event.pointerType === "touch") {
      if (this.touchPoints.has(event.pointerId)) {
        this.touchPoints.set(event.pointerId, {
          pointerId: event.pointerId,
          position: event.global.clone(),
        });
      }

      if (this.isZooming) {
        this.handlePinchZoom();
      } else if (this.isDragging) {
        this.onDragMove(event);
      }
    } else if (event.pointerType === "mouse") {
      if (this.isDragging) {
        this.onDragMove(event);
      }
    }
  }

  private handlePointerUp(event: PIXI.FederatedPointerEvent): void {
    if (event.pointerType === "touch") {
      if (this.touchPoints.has(event.pointerId)) {
        this.touchPoints.delete(event.pointerId);
      }
      if (this.touchPoints.size < 2) {
        this.isZooming = false;
        this.pinchStartDistance = 0;
        this.lastDistance = 0;
      }
    }

    if (this.isDragging) {
      this.onDragEnd();
    }
  }

  private handlePointerTap(event: PIXI.FederatedPointerEvent): void {
    if (event.pointerType === "touch" && event.isPrimary === false) return;

    const currentTime = Date.now();
    if (currentTime - this.lastTapTime < this.doubleTapThreshold) {
      if (this.onDoubleTapCallback) {
        // console.log(currentTime - this.lastTapTime);
        this.onDoubleTapCallback(event);
      } else {
      }
      this.lastTapTime = 0;
    } else {
      this.lastTapTime = currentTime;
      setTimeout(() => (this.lastTapTime = 0), this.doubleTapThreshold);
    }
  }

  private startDragging(event: PIXI.FederatedPointerEvent): void {
    if (this.isDragging) {
      return;
    }
    this.isDragging = true;
    this.lastPosition = {
      x: event.globalX,
      y: event.globalY,
    };

    if (event.pointerType === "mouse") {
      this.app.stage.cursor = "grabbing";
    }
  }

  private onDragMove(event: PIXI.FederatedPointerEvent): void {
    if (
      !this.isDragging ||
      !this.lastPosition ||
      !event.isPrimary ||
      this.isZooming
    ) {
      return;
    }

    const dx = event.globalX - this.lastPosition.x;
    const dy = event.globalY - this.lastPosition.y;

    this.mainContainer.x += dx;
    this.mainContainer.y += dy;

    this.lastPosition = {
      x: event.globalX,
      y: event.globalY,
    };
  }

  private onDragEnd(): void {
    this.isDragging = false;
    this.lastPosition = null;
    this.app.stage.cursor = "default";
  }

  private handlePinchZoom(): void {
    // 获取两个触摸点
    const touchPointsArray = Array.from(this.touchPoints.values());
    if (touchPointsArray.length < 2) {
      return;
    }
    const touch1 = touchPointsArray[0];
    const touch2 = touchPointsArray[1];

    // 使用时间间隔来控制更新频率
    const currentTime = performance.now();
    if (currentTime - this.lastUpdateTime < 5) {
      return; // 小于 5ms，跳过本次更新
    }
    this.lastUpdateTime = currentTime;

    // 计算当前触摸点之间的距离
    const newDistance = this.calculateDistance(touch1, touch2);

    // 如果 pinchStartDistance 还没有定义，初始化该值
    if (this.pinchStartDistance === 0) {
      this.pinchStartDistance = newDistance;
      this.lastDistance = newDistance;
      return;
    }

    const distanceChange = Math.abs(newDistance - this.lastDistance);

    // 忽略微小的距离变化，防止过度缩放
    if (distanceChange < 5) {
      return; // 如果触摸点之间的距离变化小于 5 像素，则不做处理
    }

    // 过滤掉大的噪音
    if (distanceChange > 50) {
      console.log(
        `❌过滤噪音：newDistance(${newDistance}) ，lastDistance：${this.lastDistance}`
      );
      return; // 如果差距太大，忽略这次更新
    }

    // 计算缩放因子的变化
    const zoomFactor = newDistance / this.pinchStartDistance;
    let newZoomFactor = this.zoomFactor * zoomFactor;

    // 限制缩放范围
    newZoomFactor = Math.min(
      Math.max(newZoomFactor, this.minZoom),
      this.maxZoom
    );

    // 如果计算的 zoomFactor 是 NaN，直接返回
    if (isNaN(newZoomFactor)) {
      console.error("缩放因子计算结果为 NaN，跳过更新");
      return;
    }

    // 更新目标容器的缩放
    this.mainContainer.scale.set(newZoomFactor);

    // 更新当前的缩放因子
    this.zoomFactor = newZoomFactor;

    // 更新上次计算的距离
    this.lastDistance = newDistance;
    this.pinchStartDistance = newDistance;
  }

  private calculateDistance(
    touch1: TouchPointData,
    touch2: TouchPointData
  ): number {
    const t1 = touch1.position;
    const t2 = touch2.position;

    return Math.sqrt(Math.pow(t1.x - t2.x, 2) + Math.pow(t1.y - t2.y, 2));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.keydownsHandler) return;
    const handler = this.keydownsHandler[event.key];
    if (handler) {
      handler(event);
    }
  }
}
