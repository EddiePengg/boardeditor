import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";

@customElement("ui-components-panel")
export class ComponentsPanel extends LitElement {
  static override styles = css`
    :host {
      display: block;
      touch-action: none;
      -webkit-touch-callout: none;
      -ms-touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }

    .components-panel {
      position: absolute;
      left: 20px;
      top: 50%;
      transform: translateY(-50%);
      background: white;
      border-radius: 8px;
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      pointer-events: auto;
      touch-action: none;
      -webkit-touch-callout: none;
      -ms-touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }

    .component-button {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 12px;
      border: none;
      background: #f5f5f5;
      cursor: pointer;
      border-radius: 8px;
      transition: background-color 0.2s;
    }

    .component-button:hover {
      background: #e5e5e5;
    }

    .bottom-sheet {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      background: white;
      border-radius: 16px 16px 0 0;
      padding: 20px;
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
      transform: translateY(100%);
      transition: transform 0.3s ease-out;
      pointer-events: auto;
      display: none;
      touch-action: none;
      -webkit-touch-callout: none;
      -ms-touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }

    .bottom-sheet.open {
      transform: translateY(0);
      display: block;
    }

    .bottom-sheet-title {
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 16px;
      color: #333;
    }

    .bottom-sheet-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .floating-button {
      position: absolute;
      right: 20px;
      bottom: 20px;
      width: 56px;
      height: 56px;
      border-radius: 28px;
      background: #6b46c1;
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      pointer-events: auto;
      transition: transform 0.2s;
      touch-action: none;
      -webkit-touch-callout: none;
      -ms-touch-action: none;
      user-select: none;
      -webkit-user-select: none;
    }

    .floating-button:hover {
      transform: scale(1.05);
    }
  `;

  @property({ type: Boolean })
  declare isWideScreen: boolean;

  @property({ type: Boolean })
  declare isBottomSheetOpen: boolean;

  constructor() {
    super();
    this.isWideScreen = window.innerWidth >= 768;
    this.isBottomSheetOpen = false;
    this.handleResize = this.handleResize.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    window.addEventListener("resize", this.handleResize);
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
    window.removeEventListener("resize", this.handleResize);
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

  protected handleResize(): void {
    this.isWideScreen = window.innerWidth >= 768;
  }

  protected toggleBottomSheet(): void {
    this.isBottomSheetOpen = !this.isBottomSheetOpen;
  }

  protected renderComponentButtons() {
    const components = [
      { icon: "📝", name: "便签", description: "添加便签" },
      { icon: "🗂️", name: "卡片", description: "添加卡片" },
      { icon: "📄", name: "文本", description: "添加文本" },
      { icon: "📦", name: "容器", description: "添加容器" },
    ];

    return components.map(
      (comp) => html`
        <button class="component-button" title=${comp.description}>
          <span style="font-size: 24px">${comp.icon}</span>
          <span style="font-size: 12px">${comp.name}</span>
        </button>
      `
    );
  }

  protected override render() {
    return html`
      ${this.isWideScreen
        ? html`
            <div class="components-panel">${this.renderComponentButtons()}</div>
          `
        : html`
            <button class="floating-button" @click=${this.toggleBottomSheet}>
              +
            </button>
            <div class="bottom-sheet ${this.isBottomSheetOpen ? "open" : ""}">
              <div class="bottom-sheet-title">添加组件</div>
              <div class="bottom-sheet-grid">
                ${this.renderComponentButtons()}
              </div>
            </div>
          `}
    `;
  }
}
