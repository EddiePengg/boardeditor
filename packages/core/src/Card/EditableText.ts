import { Text } from "pixi.js";
import * as PIXI from "pixi.js";

export class EditableText extends Text {
  private app: PIXI.Application;
  private isMultiline: boolean; // 是否是多行文本，默认为否
  private maxWidth: number = this.width; // 输入框的最大宽度 默认为文本的宽度
  private scaleCompensation: number = 1; //缩放补偿
  public isEditing: boolean = false; // 是否处于编辑状态

  constructor(
    { text, style = {} }: PIXI.TextOptions,
    app: PIXI.Application,
    isMultiline: boolean = false,
    maxWidth: number
  ) {
    const defaultFontFamily =
      "'Microsoft YaHei', '微软雅黑', 'SimHei', '黑体', sans-serif";
    const textStyle: PIXI.TextStyleOptions = {
      ...style,
      wordWrap: true,
      wordWrapWidth: maxWidth,
      breakWords: true,
      fontFamily: style.fontFamily || defaultFontFamily,
    };
    super({ text, style: textStyle });

    // 强制设置文本宽度为maxWidth，确保与textarea宽度一致
    this.width = maxWidth;

    this.app = app;
    this.isMultiline = isMultiline;
    this.maxWidth = maxWidth;

    this.resolution = 5;
    this.eventMode = "none";
    // this.cursor = "text";
  }

  private setIsEditing(isEditing: boolean) {
    this.isEditing = isEditing;
  }

  public handleEdit(event?: PIXI.FederatedPointerEvent) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }
    this.setIsEditing(true);
    this.scaleCompensation = this.app.stage.children[0].scale.x;

    // 创建外层容器和内层文本元素
    const container = document.createElement("div");
    const textElement = document.createElement("p");
    container.appendChild(textElement);

    // 设置文本内容
    textElement.textContent = this.text;

    // 设置可编辑属性
    textElement.contentEditable = "true";
    textElement.spellcheck = false;

    // 获取画布和位置信息
    const canvas = this.app.canvas;
    const canvasRect = canvas.getBoundingClientRect();
    const globalPosition = this.getGlobalPosition();
    const x = canvasRect.left + globalPosition.x;
    const y = canvasRect.top + globalPosition.y;

    // 设置容器样式
    container.style.position = "absolute";
    container.style.left = `${x}px`;
    container.style.top = `${y}px`;
    container.style.width = `${this.maxWidth * this.scaleCompensation}px`;
    container.style.minHeight = `${this.height * this.scaleCompensation}px`;
    container.style.overflow = "visible";
    container.style.zIndex = "1000";
    container.style.display = "flex";
    container.style.alignItems = "center";

    // 设置文本元素样式，确保与 PixiJS Text 完全一致
    textElement.style.margin = "0";
    textElement.style.padding = "0";
    textElement.style.width = "100%";
    textElement.style.minHeight = "100%";
    textElement.style.fontSize = `${
      this.style.fontSize * this.scaleCompensation || 16
    }px`;
    textElement.style.fontFamily = Array.isArray(this.style.fontFamily)
      ? this.style.fontFamily.join(", ")
      : this.style.fontFamily ||
        "'Microsoft YaHei', '微软雅黑', 'SimHei', '黑体', sans-serif";
    textElement.style.fontWeight =
      this.style.fontWeight?.toString() || "normal";
    textElement.style.fontStyle = this.style.fontStyle || "normal";
    textElement.style.lineHeight = this.style.lineHeight
      ? `${this.style.lineHeight * this.scaleCompensation}px`
      : "normal";
    textElement.style.letterSpacing = this.style.letterSpacing
      ? `${this.style.letterSpacing * this.scaleCompensation}px`
      : "normal";
    textElement.style.whiteSpace = this.isMultiline ? "pre-wrap" : "nowrap";
    textElement.style.outline = "none";
    textElement.style.background = "transparent";
    textElement.style.display = "block";
    textElement.style.wordBreak = "break-word";
    textElement.style.boxSizing = "border-box";
    textElement.style.verticalAlign = "middle";

    // 设置文本颜色
    const fillColor =
      typeof this.style.fill === "number"
        ? "#" + this.style.fill.toString(16).padStart(6, "0")
        : this.style.fill?.toString() || "#000000";
    textElement.style.color = fillColor;

    // 设置文本对齐
    if (this.style.align) {
      textElement.style.textAlign = this.style.align;
    }

    // 隐藏原始文本
    this.visible = false;

    // 添加到文档
    document.body.appendChild(container);
    textElement.focus();

    // 处理文本编辑完成事件
    const handleBlur = () => {
      this.text = textElement.textContent || "";
      this.visible = true;
      document.body.removeChild(container);
      this.setIsEditing(false);
      this.emit("textChanged");
    };

    // 处理按键事件
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !this.isMultiline) {
        e.preventDefault();
        textElement.blur();
      }
    };

    // 绑定事件
    textElement.addEventListener("blur", handleBlur);
    textElement.addEventListener("keydown", handleKeyDown);
  }

  private adjustTextareaHeight(textarea: HTMLTextAreaElement) {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
}
