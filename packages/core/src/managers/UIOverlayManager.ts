import { LitElement, html, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Application, FederatedPointerEvent } from "pixi.js";
import { Card } from "../Card";
import "../components/overlay/Toolbar";
import "../components/overlay/ComponentsPanel";
import "../components/overlay/ContextMenu";
import "../components/overlay/TextInputTool";

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
  protected contextMenu?: HTMLElement;
  protected componentsPanel?: HTMLElement;
  protected textInput?: HTMLElement;

  constructor() {
    super();
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

  public showContextMenu(event: FederatedPointerEvent, card: Card): void {
    event.preventDefault();
    if (this.contextMenu) {
      (this.contextMenu as any).show(event.clientX, event.clientY, card);
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
