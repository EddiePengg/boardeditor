import {
  Container,
  Graphics,
  Application,
  TextStyle,
  Text,
  FederatedPointerEvent,
} from "pixi.js";
import dayjs from "dayjs";

import { CardDraggableManager } from "./managers/CardDraggableManager";
import { RxDocument } from "rxdb";
import { CardDocument } from "@boardeditor/model";
import { EditableText } from "./EditableText";
import { ArrowManager } from "../managers/ArrowManager";
import { Whiteboard } from "../Whiteboard/index";
import { ClickEventManager } from "../managers/index";

export class Card extends Container {
  public background!: Graphics; // 卡片的背景图形，也是用于判定的判定点

  public textField!: EditableText; // 卡片的文本内容

  private tagsContainer!: Container; // 标签容器

  private timeText!: Text; // 时间显示组件

  public whiteboard: Whiteboard;

  public app: Application;

  private DraggableManager!: CardDraggableManager;

  private clickEventManager!: ClickEventManager;

  private rxDocument?: RxDocument<CardDocument>;

  private parentCardRef?: Card | null = null;

  public childrenCardRef: Card[] = [];

  private selected: boolean = false; // 卡片是否被选中

  // 常量配置
  private readonly padding: number = 20;

  private readonly minHeight: number;

  private readonly cardWidth: number = 300;

  // 标签相关配置
  private readonly tagPadding: number = 8; // 标签内部的padding
  private readonly tagGap: number = 8; // 标签之间的间距
  private readonly tagHeight: number = 24; // 标签的高度
  private readonly tagBorderRadius: number = 4; // 标签的圆角半径，改小一点
  private readonly tagBottomGap: number = 8; // 标签与卡片底部的间距

  // 标签颜色配置
  private readonly tagColors: number[] = [
    0xffcdd2, // 浅红
    0xf8bbd0, // 浅粉
    0xe1bee7, // 浅紫
    0xd1c4e9, // 浅靛
    0xbbdefb, // 浅蓝
    0xb2ebf2, // 浅青
    0xb2dfdb, // 浅绿
    0xdcedc8, // 浅黄绿
    0xf0f4c3, // 浅黄
    0xffecb3, // 浅橙
  ];

  // 标签文字颜色
  private readonly tagTextColors: number[] = [
    0x333333, // 深灰色文字
  ];

  // 时间显示相关配置
  private readonly timeTextStyle: Partial<TextStyle> = {
    fontSize: 12,
    fill: 0x999999,
  };

  constructor(
    whiteboard: Whiteboard,
    rxDocument?: RxDocument<CardDocument>,
    options?: {
      minHeight?: number;
    }
  ) {
    super();

    this.whiteboard = whiteboard;
    this.app = whiteboard.app;
    this.minHeight = options?.minHeight ?? 200;
    this.rxDocument = rxDocument;

    this.eventMode = "static";

    this.initializeComponents(this.rxDocument?.text ?? "Untitled");
    this.initializeEvents();
    this.initializeDragManager();
  }

  /** 初始化组件 */
  private initializeComponents(text: string): void {
    this.createTags(); // 先创建标签，确保它在背景层下方
    this.createBackground();
    this.createTimeText();
    this.createText(text);
    this.updateLayout();
  }

  /** 初始化事件监听 */
  private initializeEvents(): void {
    this.textField.on("textChanged", this.handleTextChange.bind(this));
  }

  /** 初始化拖拽管理器 */
  private initializeDragManager(): void {
    // this.DraggableManager = new CardDraggableManager(this.app, this);
    // this.DraggableManager.initialize();
    // this.clickEventManager = new ClickEventManager(this);
    // this.clickEventManager.setOnTapCallback(this.handleTap.bind(this));
    // this.clickEventManager.setOnDoubleTapCallback((e) => {
    //   this.textField.handleEdit(e);
    // });
    // this.clickEventManager.setOnRightClickCallback((e) => {
    //   this.handleRightClick(e);
    // });
  }

  /** 创建背景 */
  private createBackground(): void {
    this.background = new Graphics();
    this.addChild(this.background);
  }

  /** 创建时间显示 */
  private createTimeText(): void {
    const timeString = this.formatCreatedTime();
    this.timeText = new Text({
      text: timeString,
      style: this.timeTextStyle,
    });
    this.timeText.position.set(this.padding, this.padding / 2);
    this.addChild(this.timeText);
  }

  /** 格式化创建时间 */
  private formatCreatedTime(): string {
    const createdTime = this.rxDocument?.created_time;
    if (!createdTime) {
      return "创建时间未知";
    }

    try {
      return dayjs(createdTime).format("YYYY/MM/DD HH:mm");
    } catch (error) {
      return "时间格式错误";
    }
  }

  /** 创建文本 */
  private createText(text: string): void {
    const style: Partial<TextStyle> = {
      fontSize: 16,
      fill: 0x666666,
    };
    this.textField = this.createEditableText(text, style, true);
    this.textField.position.set(this.padding, this.padding * 2);
    this.addChild(this.textField);
  }

  /** 创建可编辑文本 */
  private createEditableText(
    text: string,
    style: Partial<TextStyle>,
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
    if (this.tagsContainer) {
      this.tagsContainer.position.set(
        this.padding,
        Math.max(this.minHeight, this.textField.height + this.padding * 3) +
          this.tagBottomGap
      );
    }
    this.drawBackground();
    this.layoutChildren();
  }

  /** 绘制背景 */
  private drawBackground(): void {
    const totalHeight = Math.max(
      this.minHeight,
      this.textField.height + this.padding * 3
    );

    this.background.clear();
    this.background
      .rect(0, 0, this.cardWidth, totalHeight)
      .fill({ color: 0xffffff });

    if (this.selected) {
      this.background.stroke({
        color: 0x66b0f7,
        width: 0.7,
      });
    }
  }

  /** 创建标签 */
  private createTags(): void {
    // 如果已存在标签容器，先移除它
    if (this.tagsContainer) {
      this.removeChild(this.tagsContainer);
    }

    // 创建新的标签容器
    this.tagsContainer = new Container();
    this.addChild(this.tagsContainer);

    const tags = this.rxDocument?.tags;
    if (!tags || tags.length === 0) return;

    let currentX = 0;
    let currentY = 0;
    const maxWidth = this.cardWidth - this.padding * 2;

    tags.forEach((tag, index) => {
      const tagContainer = this.createTagElement(tag, index);

      // 如果当前行放不下这个标签，换到下一行
      if (currentX + tagContainer.width > maxWidth && index > 0) {
        currentX = 0;
        currentY += this.tagHeight + this.tagGap;
      }

      tagContainer.position.set(currentX, currentY);
      this.tagsContainer.addChild(tagContainer);

      currentX += tagContainer.width + this.tagGap;
    });

    this.tagsContainer.position.set(0, 0);
  }

  /** 创建单个标签元素 */
  private createTagElement(tagText: string, index: number): Container {
    const tagContainer = new Container();

    // 获取标签颜色 - 循环使用颜色数组
    const backgroundColor = this.tagColors[index % this.tagColors.length];
    const textColor = this.tagTextColors[0]; // 使用统一的文字颜色

    // 创建标签文本
    const tagTextStyle: Partial<TextStyle> = {
      fontSize: 12,
      fill: textColor,
    };
    const text = new Text({
      text: tagText,
      style: tagTextStyle,
    });
    text.position.set(this.tagPadding, (this.tagHeight - text.height) / 2);

    // 创建标签背景
    const background = new Graphics()
      .roundRect(
        0,
        0,
        text.width + this.tagPadding * 2,
        this.tagHeight,
        this.tagBorderRadius
      )
      .fill({ color: backgroundColor });

    tagContainer.addChild(background);
    tagContainer.addChild(text);

    return tagContainer;
  }

  /** 文本变化处理 */
  private async handleTextChange(): Promise<void> {
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
    console.log("❌v0.0.1版本暂时不许添加子卡片");
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
      // 计算卡片相对于父卡片的位置
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

  public handleTap(event?: FederatedPointerEvent): void {
    this.whiteboard.setSelection(this);
    // 显示工具栏
    if (event) {
      this.whiteboard.showCardToolbar(event, this);
    }
  }

  public handleDoubleTap(event: FederatedPointerEvent): void {
    this.textField.handleEdit(event);
  }

  public remove() {
    this.whiteboard.mainContainer.removeChild(this);
  }

  public async delete() {
    this.whiteboard.mainContainer.removeChild(this);
    const newestDocumen = await this.rxDocument?.update({
      $set: { in_trash: true },
    });
    this.rxDocument = newestDocumen;
  }

  public handleRightClick(event: FederatedPointerEvent): void {
    this.setSelected(true);

    // 显示右键菜单
    this.whiteboard.showContextMenu(event, this);
  }
}
