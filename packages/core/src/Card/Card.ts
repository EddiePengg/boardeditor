import { Container, Graphics, Application, TextStyleOptions } from "pixi.js";

import { CardDraggableManager } from "./managers/CardDraggableManager.js";
import { RxDocument } from "rxdb";
import { CardDocument } from "@boardeditor/model";
import { EditableText } from "./EditableText.js";
import { ArrowManager } from "../managers/ArrowManager.js";
import { Whiteboard } from "../Whiteboard/index.js";
import { GestureManager } from "../managers/index.js";

export class Card extends Container {
  public background!: Graphics; // 卡片的背景图形，也是用于判定的判定点

  public textField!: EditableText; // 卡片的文本内容

  public whiteboard: Whiteboard;

  public app: Application;

  private DraggableManager!: CardDraggableManager;

  private GestureManager!: GestureManager;

  private rxDocument?: RxDocument<CardDocument>;

  private parentCardRef?: Card | null = null; // 一个卡片只能有一个父卡片

  public childrenCardRef: Card[] = []; // 一个卡片可以有多个子卡片

  private selected: boolean = false; // 卡片是否被选中

  // 常量配置
  private readonly padding: number = 20;

  private readonly minHeight: number;

  private readonly cardWidth: number = 300;

  constructor(
    whiteboard: Whiteboard,
    text: string,
    options?: {
      minHeight?: number;
      rxDocument?: RxDocument<CardDocument>;
    }
  ) {
    super();

    this.whiteboard = whiteboard;
    this.app = whiteboard.app;
    this.minHeight = options?.minHeight ?? 200;
    this.rxDocument = options?.rxDocument;

    this.initializeComponents(text);
    this.initializeEvents();
    this.initializeDragManager();
  }

  /** 初始化组件 */
  private initializeComponents(text: string): void {
    this.createBackground();
    this.createText(text);
    this.updateLayout();
  }

  /** 初始化事件监听 */
  private initializeEvents(): void {
    this.textField.on("textChanged", this.onTextChanged.bind(this));
  }

  /** 初始化拖拽管理器 */
  private initializeDragManager(): void {
    this.DraggableManager = new CardDraggableManager(this.app, this);
    this.DraggableManager.initialize();
    this.GestureManager = new GestureManager(this);
    this.GestureManager.setOnTapCallback(this.onTap.bind(this));
  }

  /** 创建背景 */
  private createBackground(): void {
    this.background = new Graphics();
    this.addChild(this.background);
  }

  /** 创建文本 */
  private createText(text: string): void {
    const style: Partial<TextStyleOptions> = {
      fontSize: 16,
      fill: 0x666666,
    };
    this.textField = this.createEditableText(text, style, true);
    this.textField.position.set(this.padding, this.padding);
    this.addChild(this.textField);
  }

  /** 创建可编辑文本 */
  private createEditableText(
    text: string,
    style: Partial<TextStyleOptions>,
    isMultiline: boolean
  ): EditableText {
    const editableText = new EditableText(
      { text, style },
      this.app,
      isMultiline,
      this.cardWidth - this.padding * 2
    );

    editableText.on("textChanged", () => {
      this.updateLayout();
    });

    return editableText;
  }

  /** 更新布局 */
  private updateLayout(): void {
    this.drawBackground();
    this.layoutChildren();
  }

  /** 绘制背景 */
  private drawBackground(): void {
    const totalHeight = Math.max(
      this.minHeight,
      this.textField.height + this.padding * 2
    );

    this.background.clear();
    this.background.rect(0, 0, this.cardWidth, totalHeight).fill(0xffffff);

    if (this.selected) {
      this.background.stroke({
        color: 0x66b0f7,
        width: 0.7,
      });
    }
  }

  /** 文本变化处理 */
  private async onTextChanged(): Promise<void> {
    if (this.rxDocument) {
      const newestDocument = await this.rxDocument.update({
        $set: {
          text: this.textField.text,
          last_edited_time: new Date().toISOString(),
        },
      });

      this.rxDocument = newestDocument;
    }
  }

  /** 添加子卡片 */
  public addChildCard(childCard: Card): void {
    console.log("❌v0.0.1版本暂时不允许添加子卡片");
    return;

    // // 如果子卡片已经是当前卡片的子元素，直接返回
    // if (this.childrenCardRef.includes(childCard)) return;

    // // 先检查自己是否是要添加卡片的后代（避免递归循环）
    // if (this.isDescendantOf(childCard)) {
    //   console.warn("无法将当前卡片添加为子卡片，因为它是自身或其后代的后代。");
    //   return;
    // }

    // // 先从之前的父卡片中移除（如果存在的话）
    // if (childCard.parentCardRef) {
    //   childCard.parentCardRef.removeChildCard(childCard);
    // }

    // // 将子卡片添加到当前卡片
    // this.childrenCardRef.push(childCard);
    // childCard.parentCardRef = this; // 设置父卡片

    // // 通过箭头管理器创建箭头
    // ArrowManager.getInstance(this.app).createArrow(this, childCard);

    // // 调整布局，确保子卡片按照新父卡片的位置进行布局
    // this.layoutChildren();
  }

  // 辅助函数：检查一个卡片是否是当前卡片的后代
  private isDescendantOf(card: Card): boolean {
    // 遍历当前卡片的所有子卡片，检查其后代
    for (const child of card.childrenCardRef) {
      if (child === this || this.isDescendantOf(child)) {
        return true; // 如果找到了，表示是后代
      }
    }
    return false; // 如果没有找到，返回false
  }

  /** 从父卡片中移除子卡片 */
  private removeChildCard(childCard: Card): void {
    const index = this.childrenCardRef.indexOf(childCard);
    if (index !== -1) {
      // 从当前卡片的子卡片列表中移除
      this.childrenCardRef.splice(index, 1);
      // 清空子卡片的父卡片引用
      childCard.parentCardRef = null;

      // 通过箭头管理器移除箭头
      ArrowManager.getInstance(this.app).removeArrow(this, childCard);

      // 重新调整布局
      this.layoutChildren();
    }
  }

  /** 对子卡片进行布局，排列在父卡片的右侧 */
  private layoutChildren(): void {
    // 子卡片相对父卡片右侧的位置
    const rightOffset = this.cardWidth + this.padding * 3;
    let yOffset = this.padding;

    this.childrenCardRef.forEach((child) => {
      // 计算子卡片相对于父卡片的位置
      // 注意：子卡片的位置是相对于父卡片的坐标系
      child.position.set(rightOffset + this.x, yOffset + this.y);

      // 更新yOffset，确保子卡片按顺序排列
      yOffset += child.height + this.padding;
    });
  }

  public setSelected(selected: boolean): void {
    this.selected = selected;
    this.drawBackground();
  }

  private onTap(): void {
    this.whiteboard.setSelection(this);
  }

  public async deleteCard() {
    this.whiteboard.mainContainer.removeChild(this);
    const newestDocumen = await this.rxDocument?.update({
      $set: { in_trash: true },
    });
    this.rxDocument = newestDocumen;
  }
}
