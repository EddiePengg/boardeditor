import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Card } from "../../Card";
import { Application } from "pixi.js";

@customElement("ui-toolbar")
export class Toolbar extends LitElement {
  static override styles = css`
    :host {
      display: block;
    }

    .toolbar {
      position: absolute;
      display: none;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      pointer-events: auto;
      gap: 4px;
    }

    .toolbar.visible {
      display: flex;
    }

    .toolbar-button {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
    }

    .toolbar-button:hover {
      background: #f7fafc;
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

  protected handleEdit(): void {
    if (this.activeCard) {
      this.activeCard.textField.handleEdit();
      this.hide();
    }
  }

  protected handleDelete(): void {
    if (this.activeCard) {
      this.activeCard.delete();
      this.hide();
    }
  }

  public hide(): void {
    this.visible = false;
  }

  public show(card: Card): void {
    this.activeCard = card;
    this.visible = true;
    this.updatePosition();
  }

  public updatePosition(): void {
    if (!this.activeCard || !this.app) return;

    const toolbar = this.shadowRoot?.querySelector(".toolbar") as HTMLElement;
    if (!toolbar) return;

    const canvasBounds = this.app.canvas.getBoundingClientRect();
    const scale = this.app.stage.scale.x;
    const cardBounds = this.activeCard.getBounds();
    const stagePosition = this.app.stage.position;

    // 计算卡片在画布上的实际位置
    const x = canvasBounds.left + (cardBounds.x * scale + stagePosition.x);
    const y =
      canvasBounds.top +
      (cardBounds.y * scale + stagePosition.y) -
      toolbar.offsetHeight -
      10;

    toolbar.style.transform = `translate(${x}px, ${y}px)`;
  }

  protected override render() {
    return html`
      <div class="toolbar ${this.visible ? "visible" : ""}">
        <button class="toolbar-button" @click=${this.handleEdit}>
          ✏️ 编辑
        </button>
        <button class="toolbar-button" @click=${this.handleDelete}>
          🗑️ 删除
        </button>
      </div>
    `;
  }
}
