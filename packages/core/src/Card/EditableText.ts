import { Text } from "pixi.js";
import * as PIXI from "pixi.js";
import { GestureManager } from "../managers/GestureManager";

export class EditableText extends Text {
  private app: PIXI.Application;
  private isMultiline: boolean; // 是否是多行文本，默认为否
  private maxWidth: number = this.width; // 输入框的最大宽度 默认为文本的宽度
  private getsureManager!: GestureManager;
  private scaleCompensation: number = 1; //缩放补偿
  public isEditing: boolean = false; // 是否处于编辑状态

  constructor(
    { text, style }: PIXI.TextOptions,
    app: PIXI.Application,
    isMultiline: boolean = false,
    maxWidth: number
  ) {
    const textStyle: PIXI.TextStyleOptions = {
      ...style,
      wordWrap: true,
      wordWrapWidth: maxWidth,
      breakWords: true,
    }; // 复制样式对象并设置 wordWrap 和 wordWrapWidth
    super({ text, style: textStyle });
    this.app = app;
    this.isMultiline = isMultiline;
    this.maxWidth = maxWidth;

    // this.resolution = 5;
    this.eventMode = "static";
    this.cursor = "text";

    this.initManager();
  }

  private initManager() {
    this.getsureManager = new GestureManager(this);
    this.getsureManager.setOnDoubleTapCallback(this.handleEdit.bind(this));
  }

  private setIsEditing(isEditing: boolean) {
    this.isEditing = isEditing;
  }

  private handleEdit(event: PIXI.FederatedPointerEvent) {
    event.stopPropagation();
    event.preventDefault();
    this.setIsEditing(true);
    this.scaleCompensation = this.app.stage.children[0].scale.x; // 🚧 暂时使用这种方法的方式获取

    const textarea = document.createElement(
      this.isMultiline ? "textarea" : "input"
    ) as HTMLInputElement | HTMLTextAreaElement;
    textarea.value = this.text;

    // 获取画布的位置信息
    const canvas = this.app.canvas;
    const canvasRect = canvas.getBoundingClientRect();

    // 获取文本元素的全局位置
    const globalPosition = this.getGlobalPosition();

    // 计算输入框的位置
    const x = canvasRect.left + globalPosition.x;
    const y = canvasRect.top + globalPosition.y;

    console.log(`Computed position - x: ${x}, y: ${y}`);

    // 设置输入框的样式，使其完全覆盖原始文本
    textarea.style.position = "absolute";
    textarea.style.left = `${x}px`;
    textarea.style.top = `${y}px`;
    textarea.style.width = `${this.maxWidth * this.scaleCompensation}px`;
    textarea.style.height = `${this.height * this.scaleCompensation}px`;
    textarea.style.fontSize = `${
      this.style.fontSize * this.scaleCompensation || 16
    }px`;
    // textarea.style.fontFamily = this.style.fontFamily || "Arial";
    textarea.style.border = "none";
    textarea.style.outline = "none";
    textarea.style.padding = "0";
    textarea.style.margin = "0";
    textarea.style.background = "transparent";
    textarea.style.color = "#000";
    textarea.style.resize = "none"; // 禁止用户调整大小
    textarea.style.overflow = "hidden"; // 隐藏滚动条
    textarea.style.zIndex = "1000"; // 确保输入框在最上层

    // 根据文本对齐方式调整输入框样式
    if (this.style.align) {
      textarea.style.textAlign = this.style.align;
    }

    // 隐藏原始文本，避免重叠
    this.visible = false;

    document.body.appendChild(textarea);
    textarea.focus();

    // 自动调整输入框高度（针对多行文本）
    if (this.isMultiline) {
      textarea.style.height = "auto";
      textarea.style.minHeight = `${this.height}px`;
      textarea.style.whiteSpace = "pre-wrap";
      textarea.style.wordWrap = "break-word";
      this.adjustTextareaHeight(textarea as HTMLTextAreaElement);
      textarea.addEventListener("input", () => {
        this.adjustTextareaHeight(textarea as HTMLTextAreaElement);
      });
    }

    // 延迟绑定 onblur 事件，防止输入框立即失去焦点
    setTimeout(() => {
      textarea.onblur = () => {
        this.text = textarea.value;
        this.visible = true; // 恢复文本的可见性
        document.body.removeChild(textarea);

        this.setIsEditing(false);
        // 触发自定义事件，通知文本已更改
        this.emit("textChanged");
      };
    }, 0);

    textarea.onkeydown = (e) => {
      if (e.key === "Enter") {
        textarea.blur();
      }
    };
  }

  private adjustTextareaHeight(textarea: HTMLTextAreaElement) {
    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  }
}
