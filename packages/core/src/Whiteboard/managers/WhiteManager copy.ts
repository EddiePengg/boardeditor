import * as PIXI from "pixi.js";
import { BoxSelection } from "./BoxSelection";

// 定义手势回调类型
type GestureCallback = (event: PIXI.FederatedPointerEvent) => void;

/**
 * 惯性滑动状态接口
 * 用于管理画布拖动时的物理模拟相关状态
 */
interface InertiaState {
  /** 当前移动速度，用于计算惯性滑动的方向和距离 */
  velocity: { x: number; y: number };
  /** 上一次移动的时间戳，用于计算deltaTime */
  lastTimestamp: number;
  /** requestAnimationFrame的ID，用于控制动画的开始和结束 */
  animationFrameId: number | null;
  /** 摩擦系数，值越大惯性滑动距离越短 (0-1) */
  friction: number;
  /** 速度阈值，当速度小于此值时停止动画 */
  velocityThreshold: number;
}

interface TouchPointData {
  pointerId: number;
  position: PIXI.Point;
}

export class WhiteBoardManager {
  private isDragging: boolean = false;
  private isZooming: boolean = false;
  private lastPosition: { x: number; y: number } | null = null;
  private boxSelection: BoxSelection;

  /** 惯性滑动状态管理对象 */
  private inertiaState: InertiaState = {
    velocity: { x: 0, y: 0 },
    lastTimestamp: 0,
    animationFrameId: null,
    friction: 0.96,
    velocityThreshold: 0.01,
  };

  private touchPoints: Map<number, TouchPointData> = new Map();

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
    this.boxSelection = new BoxSelection(this.app.stage, this.mainContainer);
    this.initEvents();
  }

  private initEvents(): void {
    this.app.stage.on("pointerdown", this.handlePointerDown.bind(this));
    this.app.stage.on("pointermove", this.handlePointerMove.bind(this));
    this.app.stage.on("pointerup", this.handlePointerUp.bind(this));

    this.app.stage.on("pointerupoutside", this.handlePointerUp.bind(this)); // 确保移出窗口时也能够清理触摸点

    this.app.stage.on("pointertap", this.handlePointerTap.bind(this));
    window.addEventListener("keydown", this.handleKeyDown.bind(this));

    this.app.canvas.addEventListener("wheel", this.handleWheel.bind(this), {
      passive: false,
    });
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();

    // 打印 wheel 事件的关键属性
    console.log({
      deltaX: e.deltaX,
      deltaY: e.deltaY,
      deltaMode: e.deltaMode, // 0: 像素, 1: 行, 2: 页
    });

    // 检查是否为触控板捏合手势
    const isPinchGesture = e.ctrlKey && Math.abs(e.deltaY) < 10;

    if (e.ctrlKey) {
      this.handleWheelZoom(e, isPinchGesture);
    } else {
      this.moveContainer(-e.deltaX, -e.deltaY);
    }
  }

  private handleWheelZoom(e: WheelEvent, isPinchGesture: boolean): void {
    const canvas = this.app.canvas;
    // 根据不同的输入源使用不同的缩放灵敏度
    const zoomIntensity = isPinchGesture ? 0.028 : 0.0012;
    const deltaNumber = -e.deltaY;
    let zoomFactor = this.zoomFactor * (1 + deltaNumber * zoomIntensity);

    zoomFactor = Math.min(Math.max(zoomFactor, this.minZoom), this.maxZoom);

    const mouseX = e.clientX - canvas.getBoundingClientRect().left;
    const mouseY = e.clientY - canvas.getBoundingClientRect().top;

    const localPos = {
      x: (mouseX - this.mainContainer.x) / this.zoomFactor,
      y: (mouseY - this.mainContainer.y) / this.zoomFactor,
    };

    this.mainContainer.scale.set(zoomFactor);

    // 调整容器位置，使缩放以鼠标位置为中心点
    this.mainContainer.x = mouseX - localPos.x * zoomFactor;
    this.mainContainer.y = mouseY - localPos.y * zoomFactor;

    this.zoomFactor = zoomFactor;
  }

  private moveContainer(dx: number, dy: number): void {
    const panSpeed = 1;
    this.mainContainer.x += dx * panSpeed;
    this.mainContainer.y += dy * panSpeed;
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
      if (event.button === 0) {
        // 左键
        this.boxSelection.onPointerDown(event.global);
      } else if (event.button === 2) {
        // 右键
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
      } else if (this.boxSelection.isActive()) {
        this.boxSelection.onPointerMove(event.global);
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
    } else if (this.boxSelection.isActive()) {
      this.boxSelection.onPointerUp();
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

    const currentTime = performance.now();
    const deltaTime = currentTime - this.inertiaState.lastTimestamp;

    const dx = event.globalX - this.lastPosition.x;
    const dy = event.globalY - this.lastPosition.y;

    // 计算瞬时速度
    if (deltaTime > 0) {
      this.inertiaState.velocity = {
        x: dx / deltaTime,
        y: dy / deltaTime,
      };
    }

    this.moveContainer(dx, dy);

    this.lastPosition = {
      x: event.globalX,
      y: event.globalY,
    };
    this.inertiaState.lastTimestamp = currentTime;
  }

  private onDragEnd(): void {
    this.isDragging = false;
    this.lastPosition = null;
    this.app.stage.cursor = "default";

    // 开始惯性动画
    if (
      Math.abs(this.inertiaState.velocity.x) >
        this.inertiaState.velocityThreshold ||
      Math.abs(this.inertiaState.velocity.y) >
        this.inertiaState.velocityThreshold
    ) {
      this.startInertiaAnimation();
    }
  }

  private startInertiaAnimation(): void {
    if (this.inertiaState.animationFrameId !== null) {
      cancelAnimationFrame(this.inertiaState.animationFrameId);
    }

    const animate = () => {
      // 应用摩擦力
      this.inertiaState.velocity.x *= this.inertiaState.friction;
      this.inertiaState.velocity.y *= this.inertiaState.friction;

      // 移动容器
      this.moveContainer(
        this.inertiaState.velocity.x,
        this.inertiaState.velocity.y
      );

      // 当速度足够小时停止动画
      if (
        Math.abs(this.inertiaState.velocity.x) <
          this.inertiaState.velocityThreshold &&
        Math.abs(this.inertiaState.velocity.y) <
          this.inertiaState.velocityThreshold
      ) {
        if (this.inertiaState.animationFrameId !== null) {
          cancelAnimationFrame(this.inertiaState.animationFrameId);
          this.inertiaState.animationFrameId = null;
        }
        return;
      }

      this.inertiaState.animationFrameId = requestAnimationFrame(animate);
    };

    this.inertiaState.animationFrameId = requestAnimationFrame(animate);
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

    // 更新上次计算��距离
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

  public setOnDoubleTapCallback(callback: GestureCallback): void {
    this.onDoubleTapCallback = callback;
  }

  public setKeyDownsHandler(keydownsHandler: {
    [key: string]: (event: KeyboardEvent) => void;
  }): void {
    this.keydownsHandler = keydownsHandler;
  }
}
