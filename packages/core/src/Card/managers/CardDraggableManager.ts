import { FederatedPointerEvent, Application, Container } from "pixi.js";
import { Card } from "../Card";
import { DraggableManager } from "../../managers/DraggableManager";

export class CardDraggableManager extends DraggableManager {
  private card: Card;
  private potentialParent: Card | null = null;
  private dragOffset = { x: 0, y: 0 };

  constructor(app: Application, card: Card) {
    super(app.stage, card); // 初始化基类 DraggableManager
    this.card = card;
  }

  /** 初始化拖拽功能 */
  public override initialize(): void {
    super.initialize(); // 调用基类的初始化方法
    this.card.on("dragStart", this.onCardDragStart.bind(this)); // 监听卡片的拖拽开始
    this.card.on("dragMove", this.onCardDragMove.bind(this)); // 监听卡片的拖拽移动
    // this.card.on("globalpointermove", this.onCardDragMove.bind(this)); // 监听全局指针移动事件，覆盖基类的方法，处理卡片的拖拽移动")
    this.card.on("dragEnd", this.onCardDragEnd.bind(this)); // 监听卡片的拖拽结束
  }

  /** 覆盖 dragStart，处理卡片特有的开始行为 */
  private onCardDragStart(event: FederatedPointerEvent): void {
    this.card.alpha = 0.5;

    // 计算鼠标按下时相对于卡片的偏移量
    const localPos = this.card.parent.toLocal(event.global);
    this.dragOffset.x = this.card.x - localPos.x;
    this.dragOffset.y = this.card.y - localPos.y;
  }

  /** 覆盖 dragMove，处理卡片特有的移动行为 */
  private onCardDragMove(event: FederatedPointerEvent): void {
    // 考虑偏移量进行位置计算
    const newPos = this.card.parent.toLocal(event.global);
    this.card.position.set(
      newPos.x + this.dragOffset.x,
      newPos.y + this.dragOffset.y
    );

    this.checkForPotentialParent(event);
  }

  /** 覆盖 dragEnd，处理卡片特有的结束行为 */
  private onCardDragEnd(): void {
    this.card.alpha = 1; // 恢复透明度

    if (this.potentialParent) {
      // 如果找到了潜在的父卡片，添加为其子卡片
      this.potentialParent.addChildCard(this.card);
    }

    // 清空潜在父卡片引用
    this.potentialParent = null;
  }

  /** 判断是否进入其他卡片的上方 */
  private checkForPotentialParent(event: FederatedPointerEvent): void {
    let foundParent: Card | null = null;

    // 获取所有卡片
    const allCards = this.card.app.stage.children[0].children; // 🚧需要更好的方式来查找所有的卡片

    allCards.forEach((child: Container) => {
      if (child instanceof Card && child !== this.card) {
        if (this.isOverlappingWithMouse(child, event)) {
          foundParent = child;
        }
      }
    });

    this.potentialParent = foundParent;
  }

  /** 判断鼠标与卡片是否重叠 */
  private isOverlappingWithMouse(
    targetCard: Card,
    event: FederatedPointerEvent
  ): boolean {
    const targetBounds = targetCard.background.getBounds(); // 获取目标卡片的边界
    const mousePosition = event.global; // 获取鼠标的全局位置

    return (
      mousePosition.x >= targetBounds.x &&
      mousePosition.x <= targetBounds.x + targetBounds.width &&
      mousePosition.y >= targetBounds.y &&
      mousePosition.y <= targetBounds.y + targetBounds.height
    );
  }
}
