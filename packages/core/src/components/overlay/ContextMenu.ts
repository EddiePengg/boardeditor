import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Card } from "../../Card";

@customElement("ui-context-menu")
export class ContextMenu extends LitElement {
  static override styles = css`
    :host {
      display: block;
      touch-action: none;
      -webkit-touch-callout: none;
      -ms-touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }

    .context-menu {
      position: fixed;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      pointer-events: auto;
      display: none;
      z-index: 1000;
      min-width: 160px;
      touch-action: none;
      -webkit-touch-callout: none;
      -ms-touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }

    .context-menu.visible {
      display: block;
    }

    .context-menu-item {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 4px;
      position: relative;
    }

    .context-menu-item:hover {
      background: #f7fafc;
    }

    .context-menu-separator {
      height: 1px;
      background: #e2e8f0;
      margin: 4px 0;
    }

    .submenu {
      position: fixed;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      pointer-events: auto;
      display: none;
      z-index: 1001;
      min-width: 160px;
      touch-action: none;
      -webkit-touch-callout: none;
      -ms-touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }

    .submenu.visible {
      display: block;
    }
  `;

  @property({ attribute: false })
  declare activeCard: Card | null;

  @property({ type: Boolean })
  declare visible: boolean;

  constructor() {
    super();
    this.activeCard = null;
    this.visible = false;
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("click", this.handleOutsideClick);
    this.addEventListener("wheel", this.handleWheel, { passive: false });
    this.addEventListener("gesturestart", this.preventDefault);
    this.addEventListener("gesturechange", this.preventDefault);
    this.addEventListener("gestureend", this.preventDefault);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("click", this.handleOutsideClick);
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

  protected handleOutsideClick(e: MouseEvent): void {
    const path = e.composedPath();
    if (!path.includes(this)) {
      this.hide();
    }
  }

  public show(x: number, y: number, card: Card): void {
    this.activeCard = card;
    this.visible = true;
    const menu = this.shadowRoot?.querySelector(".context-menu") as HTMLElement;
    if (menu) {
      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    }
  }

  public hide(): void {
    this.visible = false;
    const submenu = this.shadowRoot?.querySelector(".submenu");
    if (submenu) {
      submenu.classList.remove("visible");
    }
  }

  protected handleCopy(): void {
    if (this.activeCard) {
      // TODO: 实现复制功能
      this.hide();
    }
  }

  protected handlePaste(): void {
    if (this.activeCard) {
      // TODO: 实现粘贴功能
      this.hide();
    }
  }

  protected handleSort(type: "rainbow" | "line" | "circle"): void {
    if (this.activeCard) {
      // TODO: 实现排序功能
      this.hide();
    }
  }

  protected handleZIndex(action: "top" | "bottom" | "up" | "down"): void {
    if (this.activeCard) {
      // TODO: 实现层级调整功能
      this.hide();
    }
  }

  protected showSubmenu(
    e: MouseEvent,
    items: Array<{ icon: string; text: string; action: () => void }>
  ): void {
    const submenu = this.shadowRoot?.querySelector(".submenu");
    const target = e.currentTarget as HTMLElement;
    if (submenu && target) {
      const rect = target.getBoundingClientRect();
      (submenu as HTMLElement).style.left = `${rect.right}px`;
      (submenu as HTMLElement).style.top = `${rect.top}px`;
      submenu.classList.add("visible");

      // 更新子菜单内容
      submenu.innerHTML = "";
      items.forEach((item) => {
        const menuItem = document.createElement("div");
        menuItem.className = "context-menu-item";
        menuItem.innerHTML = `
          <span style="margin-right: 8px">${item.icon}</span>
          <span>${item.text}</span>
        `;
        menuItem.addEventListener("click", () => {
          item.action();
          this.hide();
        });
        submenu.appendChild(menuItem);
      });
    }
  }

  protected override render() {
    return html`
      <div class="context-menu ${this.visible ? "visible" : ""}">
        <div class="context-menu-item" @click=${this.handleCopy}>
          <span style="margin-right: 8px">📋</span>
          <span>复制</span>
        </div>
        <div class="context-menu-item" @click=${this.handlePaste}>
          <span style="margin-right: 8px">📥</span>
          <span>粘贴</span>
        </div>
        <div class="context-menu-separator"></div>
        <div
          class="context-menu-item"
          @mouseenter=${(e: MouseEvent) =>
            this.showSubmenu(e, [
              {
                icon: "🌈",
                text: "彩虹流排序",
                action: () => this.handleSort("rainbow"),
              },
              {
                icon: "📏",
                text: "直线排序",
                action: () => this.handleSort("line"),
              },
              {
                icon: "🔄",
                text: "环形排序",
                action: () => this.handleSort("circle"),
              },
            ])}
        >
          <span style="margin-right: 8px">🎯</span>
          <span>排序</span>
          <span style="position: absolute; right: 8px">›</span>
        </div>
        <div class="context-menu-separator"></div>
        <div
          class="context-menu-item"
          @mouseenter=${(e: MouseEvent) =>
            this.showSubmenu(e, [
              {
                icon: "⬆️",
                text: "置于顶层",
                action: () => this.handleZIndex("top"),
              },
              {
                icon: "⬇️",
                text: "置于底层",
                action: () => this.handleZIndex("bottom"),
              },
              {
                icon: "↕️",
                text: "上移一层",
                action: () => this.handleZIndex("up"),
              },
              {
                icon: "↕️",
                text: "下移一层",
                action: () => this.handleZIndex("down"),
              },
            ])}
        >
          <span style="margin-right: 8px">📚</span>
          <span>层级</span>
          <span style="position: absolute; right: 8px">›</span>
        </div>
      </div>
      <div class="submenu"></div>
    `;
  }
}
