import { LitElement, html, css, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Card } from "../../Card";
import { ContextMenuItem } from "../../types/context-menu";

@customElement("ui-context-menu")
export class ContextMenu extends LitElement {
  @property({ type: Array })
  items: ContextMenuItem[] = [];

  @property({ type: Boolean })
  visible = false;

  @property({ type: Number })
  x = 0;

  @property({ type: Number })
  y = 0;

  static override styles = css`
    :host {
      position: fixed;
      z-index: 1000;
    }

    .context-menu,
    .submenu {
      position: absolute;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      min-width: 200px;
      display: none;
      pointer-events: auto; // 确保菜单可以响应点击事件
    }

    .context-menu.visible {
      display: block;
    }

    .context-menu-item {
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      position: relative;
    }

    .context-menu-item:hover {
      background: #f5f5f5;
    }

    .icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .shortcut {
      margin-left: auto;
      color: #666;
      font-size: 0.9em;
    }

    .arrow {
      margin-left: auto;
    }

    .context-menu-item:hover > .submenu {
      display: block;
    }

    .submenu {
      position: absolute;
      left: 100%;
      top: 0;
      display: none;
      background: white;
      border: 1px solid #ccc;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      min-width: 200px;
    }
  `;

  constructor() {
    super();
    this.handleOutsideClick = this.handleOutsideClick.bind(this);
  }

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener("click", this.handleOutsideClick);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener("click", this.handleOutsideClick);
  }

  protected handleOutsideClick(e: MouseEvent): void {
    if (!this.visible) return;

    const path = e.composedPath();
    const menuElement = this.shadowRoot?.querySelector(".context-menu");

    if (menuElement && !path.includes(menuElement)) {
      this.hide();
    }
  }

  public show(x: number, y: number): void {
    this.visible = true;
    this.x = x;
    this.y = y;

    // 确保菜单不会超出视窗
    requestAnimationFrame(() => {
      const rect = this.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        this.x = window.innerWidth - rect.width;
      }
      if (rect.bottom > window.innerHeight) {
        this.y = window.innerHeight - rect.height;
      }
    });
  }

  public hide(): void {
    this.visible = false;
  }

  override render(): TemplateResult {
    return html`
      <div
        class="context-menu ${this.visible ? "visible" : ""}"
        style="left: ${this.x}px; top: ${this.y}px"
      >
        ${this.items.map((item) => this.renderMenuItem(item))}
      </div>
    `;
  }

  private renderMenuItem(item: ContextMenuItem): TemplateResult {
    return html`
      <div
        class="context-menu-item"
        @click=${(e: MouseEvent) => this.handleItemClick(e, item)}
        @mouseenter=${(e: MouseEvent) => this.handleSubmenu(e, item)}
      >
        ${item.icon ? html`<span class="icon">${item.icon}</span>` : ""}
        <span class="label">${item.label}</span>
        ${item.shortcut
          ? html`<span class="shortcut">${item.shortcut}</span>`
          : ""}
        ${item.children
          ? html`
              <span class="arrow">›</span>
              <div class="submenu">
                ${item.children.map((child) => this.renderMenuItem(child))}
              </div>
            `
          : ""}
      </div>
    `;
  }

  private handleItemClick(e: MouseEvent, item: ContextMenuItem): void {
    e.preventDefault();
    e.stopPropagation();
    console.log("handleItemClick", item);

    if (item.children?.length) {
      return;
    }

    if (item.handler) {
      item.handler();
    }
    this.hide();
    this.dispatchEvent(new CustomEvent("menu-item-click", { detail: item }));
  }

  private handleSubmenu(e: MouseEvent, item: ContextMenuItem): void {
    console.log("handleSubmenu", item);
    if (!item.children?.length) return;

    const submenu = (e.currentTarget as HTMLElement).querySelector(".submenu");
    if (!submenu) return;

    requestAnimationFrame(() => {
      const rect = submenu.getBoundingClientRect();
      if (rect.right > window.innerWidth) {
        (submenu as HTMLElement).style.left = "auto";
        (submenu as HTMLElement).style.right = "100%";
      }
      if (rect.bottom > window.innerHeight) {
        const overflowY = rect.bottom - window.innerHeight;
        (submenu as HTMLElement).style.top = `-${overflowY}px`;
      }
    });
  }
}
