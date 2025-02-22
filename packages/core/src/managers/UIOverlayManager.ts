import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Application, FederatedPointerEvent } from "pixi.js";
import { Card } from "../Card";
import "../components/overlay/Toolbar";
import "../components/overlay/ComponentsPanel";
import "../components/overlay/ContextMenu";
import "../components/overlay/TextInputTool";
import { ContextMenuService } from "../services/ContextMenuService";
import { configureContextMenu } from "../config/context-menu-config";

@customElement("ui-overlay-manager")
export class UIOverlayManager extends LitElement {
  static override styles = css`
    :host {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      user-select: none;
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      touch-action: none;
      -webkit-touch-callout: none;
      -webkit-tap-highlight-color: transparent;
    }
  `;

  @property({ attribute: false })
  declare app: Application;

  protected toolbar?: HTMLElement;
  private contextMenuService: ContextMenuService;
  protected contextMenu?: HTMLElement;
  protected componentsPanel?: HTMLElement;
  protected textInput?: HTMLElement;

  constructor(app: Application) {
    super();
    this.app = app;
    this.contextMenuService = new ContextMenuService(app);
    configureContextMenu(this.contextMenuService, app);
    console.log("UIOverlayManagerLit constructor");
  }

  override firstUpdated(): void {
    this.toolbar = this.shadowRoot?.querySelector("ui-toolbar") as HTMLElement;
    this.contextMenu = this.shadowRoot?.querySelector(
      "ui-context-menu"
    ) as HTMLElement;
    this.componentsPanel = this.shadowRoot?.querySelector(
      "ui-components-panel"
    ) as HTMLElement;
    this.textInput = this.shadowRoot?.querySelector(
      "ui-text-input"
    ) as HTMLElement;

    if (this.toolbar) {
      (this.toolbar as any).app = this.app;
    }
    if (this.textInput) {
      (this.textInput as any).app = this.app;
    }

    this.setupEventListeners();
  }

  /**
   * 设置事件监听器
   *
   */
  private setupEventListeners(): void {
    // 监听全局右键菜单事件
    this.app.stage.on(
      "contextmenu",
      (event: { event: FederatedPointerEvent; target: unknown }) => {
        event.event.preventDefault();
        this.showContextMenu(event.event, event.target);
      }
    );

    this.app.stage.on("transformed", () => {
      this.updatePosition();
    });

    this.app.stage.on(
      "text-edit",
      (event: FederatedPointerEvent, card: Card) => {
        this.showEditableText(card);
      }
    );

    this.app.stage.on(
      "toolbar-show",
      (event: FederatedPointerEvent, card: Card) => {
        this.showToolbar(event, card);
      }
    );

    this.app.stage.on("boxselection-clear", () => {
      this.hideToolbar();
    });
  }

  public showToolbar(event: FederatedPointerEvent, card: Card): void {
    if (this.toolbar) {
      (this.toolbar as any).show(card);
    }
  }

  public hideToolbar(): void {
    if (this.toolbar) {
      (this.toolbar as any).hide();
    }
  }

  private showContextMenu(event: FederatedPointerEvent, target: unknown): void {
    const items = this.contextMenuService.getMenuItems(target);
    if (items.length === 0) return;

    const rect = this.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.contextMenu) {
      (this.contextMenu as any).items = items;
      (this.contextMenu as any).show(x, y);
    }
  }

  public showEditableText(card: Card): void {
    if (this.textInput) {
      (this.textInput as any).show(card);
    }
  }

  public updatePosition(): void {
    if (this.toolbar) {
      (this.toolbar as any).updatePosition?.();
    }
    if (this.textInput) {
      (this.textInput as any).updatePosition?.();
    }
  }

  protected override render() {
    return html`
      <ui-toolbar .app=${this.app}></ui-toolbar>
      <ui-components-panel></ui-components-panel>
      <ui-context-menu></ui-context-menu>
      <ui-text-input .app=${this.app}></ui-text-input>
    `;
  }
}
