import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Application } from "pixi.js";
import { Card } from "../../Card";

@customElement("ui-text-input")
export class TextInputTool extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .text-input-container {
      position: absolute;
      display: none;
      pointer-events: auto;
      white-space: pre-wrap;
      z-index: 1000;
    }

    .text-input-container.visible {
      display: flex !important;
      align-items: center;
    }

    .text-input {
      margin: 0;
      padding: 0;
      border: none;
      outline: none;
      background: transparent;
      display: block;
      word-break: break-word;
      box-sizing: border-box;
      white-space: pre-wrap;
      min-width: 1px;
      width: 100%;
      min-height: 100%;
      overflow: visible;
      resize: none;
      vertical-align: middle;
    }
  `;

  @property({ attribute: false })
  declare activeCard: Card | null;

  @property({ type: Boolean })
  declare visible: boolean;

  @property({ attribute: false })
  declare app: Application;

  constructor() {
    super();
    this.activeCard = null;
    this.visible = false;
    this.handleWheel = this.handleWheel.bind(this);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this.addEventListener("wheel", this.handleWheel, { passive: false });
    this.addEventListener("gesturestart", this.preventDefault);
    this.addEventListener("gesturechange", this.preventDefault);
    this.addEventListener("gestureend", this.preventDefault);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.removeEventListener("wheel", this.handleWheel);
    this.removeEventListener("gesturestart", this.preventDefault);
    this.removeEventListener("gesturechange", this.preventDefault);
    this.removeEventListener("gestureend", this.preventDefault);
  }

  private handleWheel(e: WheelEvent): void {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
    }
  }

  private preventDefault(e: Event): void {
    e.preventDefault();
  }

  private saveText(): void {
    const textElement = this.shadowRoot?.querySelector(
      ".text-input"
    ) as HTMLElement;
    if (textElement && this.activeCard) {
      const newText = textElement.textContent || "editor get null content";
      this.activeCard.emit("textChanged", newText);
    }
  }

  public hide(): void {
    if (this.visible) {
      this.saveText();
      console.log("hide");
      this.visible = false;
      if (this.activeCard) {
        this.activeCard.text.visible = true;
        this.activeCard.isTextEditing = false;
      }

      // 清空输入框内容
      const textElement = this.shadowRoot?.querySelector(
        ".text-input"
      ) as HTMLElement;
      if (textElement) {
        textElement.textContent = "";
      }

      // 设置容器样式为 display: none
      const container = this.shadowRoot?.querySelector(
        ".text-input-container"
      ) as HTMLElement;
      if (container) {
        container.style.display = "none";
      }

      this.activeCard = null;

      // 强制更新DOM以确保输入框被移除
      this.requestUpdate();
    }
  }

  public show(card: Card): void {
    this.activeCard = card;
    this.visible = true;
    this.updatePosition();

    requestAnimationFrame(() => {
      const textElement = this.shadowRoot?.querySelector(
        ".text-input"
      ) as HTMLElement;
      if (textElement) {
        // 设置初始文本内容
        textElement.textContent = this.activeCard?.text.text || "";
        textElement.focus();
        // 将光标移动到文本末尾
        const range = document.createRange();
        const selection = window.getSelection();
        range.selectNodeContents(textElement);
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    });
  }

  private debugMode = false;

  public updatePosition(): void {
    if (!this.activeCard || !this.app) {
      if (this.debugMode) console.log("无法更新位置: activeCard或app不存在");
      return;
    }

    const container = this.shadowRoot?.querySelector(
      ".text-input-container"
    ) as HTMLElement;
    if (!container) {
      if (this.debugMode)
        console.log("无法更新位置: 找不到text-input-container元素");
      return;
    }

    const canvasBounds = this.app.canvas.getBoundingClientRect();
    const scale = this.activeCard.getTextScaleCompensation();
    const globalPosition = this.activeCard.text.getGlobalPosition();
    const stagePosition = this.app.stage.position;

    if (this.debugMode) {
      console.log("位置计算参数:", {
        canvasBounds,
        scale,
        globalPosition,
        stagePosition,
      });
    }

    // 计算精确位置，考虑缩放补偿
    const x = canvasBounds.left + (globalPosition.x * 1 + stagePosition.x);
    const y = canvasBounds.top + (globalPosition.y * 1 + stagePosition.y);

    if (this.debugMode) {
      console.log("计算后的位置:", { x, y });
    }

    // 设置容器样式
    const containerStyle = {
      transform: `translate(${x}px, ${y}px)`,
      // top: `${y}px`,
      // left: `${x}px`,
      minWidth: `${Math.max(100, this.activeCard.text.width) * scale}px`,
      maxWidth: `${this.activeCard.getMaxWidth() * scale}px`,
      minHeight: `${this.activeCard.text.height * scale}px`,
      overflow: "visible",
      display: this.visible ? "flex" : "none",
      alignItems: "center",
    };

    if (this.debugMode) {
      console.log("容器样式:", containerStyle);
    }
    Object.assign(container.style, containerStyle);

    // 设置文本样式
    const textElement = container.querySelector(".text-input") as HTMLElement;
    if (textElement && this.activeCard) {
      const style = this.activeCard.text.style;
      if (this.debugMode) {
        console.log("文本原始样式:", style);
      }

      const textStyle = {
        margin: "0",
        padding: "0",
        width: "100%",
        minHeight: "100%",
        fontSize: `${(style.fontSize || 16) * scale}px`,
        fontFamily: Array.isArray(style.fontFamily)
          ? style.fontFamily.join(", ")
          : style.fontFamily ||
            "'Microsoft YaHei', '微软雅黑', 'SimHei', '黑体', sans-serif",
        fontWeight: style.fontWeight?.toString() || "normal",
        fontStyle: style.fontStyle || "normal",
        lineHeight: style.lineHeight
          ? `${style.lineHeight * scale}px`
          : "normal",
        letterSpacing: style.letterSpacing
          ? `${style.letterSpacing * scale}px`
          : "normal",
        whiteSpace: this.activeCard.isMultiline ? "pre-wrap" : "nowrap",
        color:
          typeof style.fill === "number"
            ? `#${style.fill.toString(16).padStart(6, "0")}`
            : style.fill?.toString() || "#000000",
        textAlign: style.align || "left",
        outline: "none",
        background: "transparent",
        display: "block",
        wordBreak: "break-word",
        boxSizing: "border-box",
        verticalAlign: "middle",
      };

      if (this.debugMode) {
        console.log("计算后的文本样式:", textStyle);
      }
      Object.assign(textElement.style, textStyle);
    } else {
      if (this.debugMode) {
        console.log("无法设置文本样式: textElement不存在或activeCard不存在");
      }
    }
  }

  protected override render() {
    return html`
      <div class="text-input-container">
        <p
          class="text-input"
          contenteditable="true"
          @blur=${this.hide}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter" && !e.shiftKey) {
              if (!this.activeCard?.isMultiline) {
                e.preventDefault();
                e.stopPropagation();
                const target = e.target as HTMLElement;
                // 使用 requestAnimationFrame 确保在下一帧处理失焦
                requestAnimationFrame(() => {
                  target.blur();
                });
              }
            }
          }}
        ></p>
      </div>
    `;
  }
}
