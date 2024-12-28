import { Application, FederatedPointerEvent, Container } from "pixi.js";
import { Card } from "../Card";

export class UIOverlayManager {
  private overlayContainer: HTMLElement;
  private toolbarElement: HTMLElement | null = null;
  private contextMenuElement: HTMLElement | null = null; // 右键菜单元素
  private subMenuElement: HTMLElement | null = null; // 子菜单元素
  private componentsPanelElement: HTMLElement | null = null;
  private floatingButtonElement: HTMLElement | null = null;
  private bottomSheetElement: HTMLElement | null = null;
  private activeCard: Card | null = null;
  private isBottomSheetOpen: boolean = false;

  constructor(private app: Application) {
    // 创建覆盖层容器
    this.overlayContainer = document.createElement("div");
    this.overlayContainer.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;

    if (!this.app.canvas.parentElement) {
      console.error("Canvas parent element is null!");
      return;
    }

    this.app.canvas.parentElement.appendChild(this.overlayContainer);

    // 创建组件面板
    this.createResponsiveComponentsPanel();

    // 监听窗口大小变化
    window.addEventListener("resize", this.handleResize.bind(this));
  }

  /**
   * 处理窗口大小变化
   */
  private handleResize(): void {
    const isWideScreen = window.innerWidth >= 768;
    this.updateComponentsPanelVisibility(isWideScreen);
  }

  /**
   * 更新组件面板的显示状态
   */
  private updateComponentsPanelVisibility(isWideScreen: boolean): void {
    if (this.componentsPanelElement && this.floatingButtonElement) {
      if (isWideScreen) {
        // 宽屏模式：显示侧边栏，隐藏浮动按钮
        this.componentsPanelElement.style.display = "flex";
        this.floatingButtonElement.style.display = "none";
        if (this.bottomSheetElement) {
          this.bottomSheetElement.style.display = "none";
        }
        this.isBottomSheetOpen = false;
      } else {
        // 窄屏模式：隐藏侧边栏，显示浮动按钮
        this.componentsPanelElement.style.display = "none";
        this.floatingButtonElement.style.display = "flex";
      }
    }
  }

  /**
   * 创建响应式组件面板
   */
  private createResponsiveComponentsPanel(): void {
    // 创建侧边组件面板
    this.createComponentsPanel();
    // 创建浮动按钮
    this.createFloatingButton();
    // 创建底部弹出面板
    this.createBottomSheet();
    // 初始化显示状态
    this.updateComponentsPanelVisibility(window.innerWidth >= 768);
  }

  /**
   * 创建浮动按钮
   */
  private createFloatingButton(): void {
    this.floatingButtonElement = document.createElement("button");
    this.floatingButtonElement.style.cssText = `
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
      display: none;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      pointer-events: auto;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.05);
      }
    `;
    this.floatingButtonElement.innerHTML = "+";
    this.floatingButtonElement.addEventListener("click", () =>
      this.toggleBottomSheet()
    );

    this.overlayContainer.appendChild(this.floatingButtonElement);
  }

  /**
   * 创建底部弹出面板
   */
  private createBottomSheet(): void {
    this.bottomSheetElement = document.createElement("div");
    this.bottomSheetElement.style.cssText = `
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
    `;

    // 添加标题
    const title = document.createElement("div");
    title.style.cssText = `
      font-size: 16px;
      font-weight: bold;
      margin-bottom: 16px;
      color: #333;
    `;
    title.textContent = "添加组件";
    this.bottomSheetElement.appendChild(title);

    // 添加组件网格
    const grid = document.createElement("div");
    grid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    `;

    // 定义组件列表
    const components = [
      { icon: "📝", name: "便签", description: "添加便签" },
      { icon: "🗂️", name: "卡片", description: "添加卡片" },
      { icon: "📄", name: "文本", description: "添加文本" },
      { icon: "📦", name: "容器", description: "添加容器" },
    ];

    components.forEach(({ icon, name, description }) => {
      const button = document.createElement("button");
      button.style.cssText = `
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

        &:hover {
          background: #e5e5e5;
        }
      `;

      const iconSpan = document.createElement("span");
      iconSpan.style.fontSize = "24px";
      iconSpan.textContent = icon;
      button.appendChild(iconSpan);

      const nameSpan = document.createElement("span");
      nameSpan.style.fontSize = "12px";
      nameSpan.textContent = name;
      button.appendChild(nameSpan);

      button.title = description;
      button.addEventListener("click", () => {
        //console.log(`Clicked ${name} component`);
        this.toggleBottomSheet();
      });

      grid.appendChild(button);
    });

    this.bottomSheetElement.appendChild(grid);
    this.overlayContainer.appendChild(this.bottomSheetElement);
  }

  /**
   * 切换底部面板的显示状态
   */
  private toggleBottomSheet(): void {
    if (!this.bottomSheetElement) return;

    this.isBottomSheetOpen = !this.isBottomSheetOpen;
    this.bottomSheetElement.style.display = "block";

    // 使用 requestAnimationFrame 确保 display 更改生效后再添加动画
    requestAnimationFrame(() => {
      if (this.bottomSheetElement) {
        this.bottomSheetElement.style.transform = this.isBottomSheetOpen
          ? "translateY(0)"
          : "translateY(100%)";
      }
    });

    // 如果是关闭状态，等待���画结束后隐藏元素
    if (!this.isBottomSheetOpen) {
      setTimeout(() => {
        if (this.bottomSheetElement) {
          this.bottomSheetElement.style.display = "none";
        }
      }, 300); // 与 CSS transition 时间相匹配
    }
  }

  /**
   * 创建左侧组件面板
   */
  private createComponentsPanel(): void {
    this.componentsPanelElement = document.createElement("div");
    this.componentsPanelElement.className = "components-panel";
    this.componentsPanelElement.style.cssText = `
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
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      pointer-events: auto;
    `;

    // 定义组件列表
    const components = [
      { icon: "📝", name: "便签", description: "添加便签" },
      { icon: "🗂️", name: "卡片", description: "添加卡片" },
      { icon: "📄", name: "文本", description: "添加文本" },
      { icon: "📦", name: "容器", description: "添加容器" },
    ];

    // 创建组件按钮
    components.forEach(({ icon, name, description }) => {
      const button = document.createElement("button");
      button.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 8px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 6px;
        transition: background-color 0.2s;
        width: 48px;
        height: 48px;
        font-size: 12px;
        color: #666;
        position: relative;

        &:hover {
          background: #f5f5f5;
        }
      `;

      const iconSpan = document.createElement("span");
      iconSpan.style.fontSize = "20px";
      iconSpan.textContent = icon;
      button.appendChild(iconSpan);

      button.title = description;
      button.addEventListener("click", () => {
        //console.log(`Clicked ${name} component`);
      });

      this.componentsPanelElement?.appendChild(button);
    });

    this.overlayContainer.appendChild(this.componentsPanelElement);
  }

  /**
   * 显示工具栏
   * @param event PIXI的事件对象
   * @param card 当前激活的卡片
   */
  public showToolbar(event: FederatedPointerEvent, card: Card): void {
    //console.log("Showing toolbar for card:", card);
    // 如果工具栏不存在，创建它
    if (!this.toolbarElement) {
      //console.log("Creating new toolbar element");
      this.createToolbar();
    }

    this.activeCard = card;

    // 获取点击位置相对于canvas的坐标
    const canvasBounds = this.app.canvas.getBoundingClientRect();
    const scale = this.app.stage.scale.x;

    // 计算工具栏位置
    const cardBounds = card.getBounds();
    const globalPosition = {
      x: canvasBounds.left + cardBounds.x * scale,
      y: canvasBounds.top + cardBounds.y * scale,
    };

    //console.log("Toolbar position:", globalPosition);

    if (this.toolbarElement) {
      // 设置工具栏位置
      this.toolbarElement.style.transform = `translate(${globalPosition.x}px, ${
        globalPosition.y - this.toolbarElement.offsetHeight - 10
      }px)`;
      this.toolbarElement.style.display = "flex";
      //console.log("Toolbar element displayed:", this.toolbarElement);
    }
  }

  /**
   * 隐藏工具栏
   */
  public hideToolbar(): void {
    if (this.toolbarElement) {
      this.toolbarElement.style.display = "none";
    }
    this.activeCard = null;
  }

  /**
   * 创建工具栏
   */
  private createToolbar(): void {
    //console.log("Creating toolbar element");
    this.toolbarElement = document.createElement("div");
    this.toolbarElement.className = "card-toolbar";
    this.toolbarElement.style.cssText = `
      position: absolute;
      display: none;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      pointer-events: auto;
      gap: 4px;
    `;

    // 添加工具栏按钮
    const buttons = [
      { icon: "✏️", text: "编辑", action: () => this.handleEdit() },
      { icon: "🗑️", text: "删除", action: () => this.handleDelete() },
      // 可以添加更多按钮
    ];

    buttons.forEach(({ icon, text, action }) => {
      const button = document.createElement("button");
      button.style.cssText = `
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        border: none;
        background: transparent;
        cursor: pointer;
        border-radius: 4px;
        &:hover {
          background: #f7fafc;
        }
      `;
      button.innerHTML = `${icon} ${text}`;
      button.onclick = action;
      this.toolbarElement?.appendChild(button);
    });

    if (!this.overlayContainer) {
      console.error("Overlay container is missing!");
      return;
    }

    this.overlayContainer.appendChild(this.toolbarElement);

    document.addEventListener("click", (e) => {
      if (
        this.toolbarElement &&
        !this.toolbarElement.contains(e.target as Node) &&
        this.toolbarElement.style.display !== "none"
      ) {
        //console.log("Hiding toolbar due to outside click");
        // this.hideToolbar();
      }
    });
  }

  private handleEdit(): void {
    if (this.activeCard) {
      // 直接调用textField的编辑方法
      this.activeCard.textField.handleEdit.call(this.activeCard.textField);
      this.hideToolbar();
    }
  }

  private handleDelete(): void {
    if (this.activeCard) {
      // 触发卡片删除
      this.activeCard.deleteCard.call(this.activeCard);
      this.hideToolbar();
    }
  }

  /**
   * 更新UI位置（在画布缩放或移动时调用）
   */
  public updatePosition(): void {
    if (this.activeCard && this.toolbarElement) {
      const canvasBounds = this.app.canvas.getBoundingClientRect();
      const scale = this.app.stage.scale.x;
      const cardBounds = this.activeCard.getBounds();

      const globalPosition = {
        x: canvasBounds.left + cardBounds.x * scale,
        y: canvasBounds.top + cardBounds.y * scale,
      };

      this.toolbarElement.style.transform = `translate(${globalPosition.x}px, ${
        globalPosition.y - this.toolbarElement.offsetHeight - 10
      }px)`;
    }
  }

  /**
   * 销毁管理器
   */
  public destroy(): void {
    this.overlayContainer.remove();
    this.toolbarElement = null;
    this.activeCard = null;
  }

  /**
   * 显示右键菜单
   */
  public showContextMenu(event: FederatedPointerEvent, card: Card): void {
    this.activeCard = card;

    // 如果右键菜单不存在，创建它
    if (!this.contextMenuElement) {
      this.createContextMenu();
    }

    if (this.contextMenuElement) {
      // 设置菜单位置在鼠标点击处
      this.contextMenuElement.style.left = `${event.clientX}px`;
      this.contextMenuElement.style.top = `${event.clientY}px`;
      this.contextMenuElement.style.display = "block";

      // 隐藏可能显示的子菜单
      if (this.subMenuElement) {
        this.subMenuElement.style.display = "none";
      }
    }

    // 阻止默认的右键菜单
    event.preventDefault();
  }

  /**
   * 创建右键菜单
   */
  private createContextMenu(): void {
    this.contextMenuElement = document.createElement("div");
    this.contextMenuElement.style.cssText = `
      position: fixed;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      pointer-events: auto;
      display: none;
      z-index: 1000;
      min-width: 160px;
    `;

    // 创建子菜单
    this.createSubMenu();

    // 定义菜单项
    const menuItems = [
      { icon: "📋", text: "复制", action: () => this.handleCopy() },
      { icon: "📥", text: "粘贴", action: () => this.handlePaste() },
      { type: "separator" },
      {
        icon: "🎯",
        text: "排序",
        submenu: true,
        items: [
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
        ],
      },
      { type: "separator" },
      {
        icon: "📚",
        text: "层级",
        submenu: true,
        items: [
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
        ],
      },
    ];

    menuItems.forEach((item) => {
      if (item.type === "separator") {
        const separator = document.createElement("div");
        separator.style.cssText = `
          height: 1px;
          background: #e2e8f0;
          margin: 4px 0;
        `;
        this.contextMenuElement?.appendChild(separator);
      } else {
        const menuItem = document.createElement("div");
        menuItem.style.cssText = `
          display: flex;
          align-items: center;
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 4px;
          position: relative;
          &:hover {
            background: #f7fafc;
          }
        `;

        const iconSpan = document.createElement("span");
        iconSpan.style.marginRight = "8px";
        iconSpan.textContent = item.icon;
        menuItem.appendChild(iconSpan);

        const textSpan = document.createElement("span");
        textSpan.textContent = item.text;
        menuItem.appendChild(textSpan);

        if (item.submenu) {
          const arrowSpan = document.createElement("span");
          arrowSpan.style.cssText = `
            position: absolute;
            right: 8px;
            content: '>';
          `;
          arrowSpan.textContent = "›";
          menuItem.appendChild(arrowSpan);

          // 添加子菜单hover事件
          menuItem.addEventListener("mouseenter", (e) => {
            if (this.subMenuElement && this.contextMenuElement) {
              const rect = menuItem.getBoundingClientRect();
              this.subMenuElement.style.left = `${rect.right}px`;
              this.subMenuElement.style.top = `${rect.top}px`;
              this.subMenuElement.style.display = "block";

              // 更新子菜单内容
              this.updateSubMenu(item.items);
            }
          });
        } else {
          menuItem.addEventListener("click", () => {
            item.action();
            this.hideContextMenu();
          });
        }

        this.contextMenuElement?.appendChild(menuItem);
      }
    });

    // 点击其他地方时隐藏菜单
    document.addEventListener("click", (e) => {
      if (
        this.contextMenuElement &&
        !this.contextMenuElement.contains(e.target as Node) &&
        this.contextMenuElement.style.display !== "none"
      ) {
        this.hideContextMenu();
      }
    });

    this.overlayContainer.appendChild(this.contextMenuElement);
  }

  /**
   * 创建子菜单
   */
  private createSubMenu(): void {
    this.subMenuElement = document.createElement("div");
    this.subMenuElement.style.cssText = `
      position: fixed;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 4px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      pointer-events: auto;
      display: none;
      z-index: 1001;
      min-width: 160px;
    `;

    this.overlayContainer.appendChild(this.subMenuElement);
  }

  /**
   * 更新子菜单内容
   */
  private updateSubMenu(
    items: Array<{ icon: string; text: string; action: () => void }>
  ): void {
    if (!this.subMenuElement) return;

    // 清空现有内容
    this.subMenuElement.innerHTML = "";

    // 添加新的菜单项
    items.forEach((item) => {
      const menuItem = document.createElement("div");
      menuItem.style.cssText = `
        display: flex;
        align-items: center;
        padding: 8px 12px;
        cursor: pointer;
        border-radius: 4px;
        &:hover {
          background: #f7fafc;
        }
      `;

      const iconSpan = document.createElement("span");
      iconSpan.style.marginRight = "8px";
      iconSpan.textContent = item.icon;
      menuItem.appendChild(iconSpan);

      const textSpan = document.createElement("span");
      textSpan.textContent = item.text;
      menuItem.appendChild(textSpan);

      menuItem.addEventListener("click", () => {
        item.action();
        this.hideContextMenu();
      });

      this.subMenuElement?.appendChild(menuItem);
    });
  }

  /**
   * 隐藏右键菜单
   */
  private hideContextMenu(): void {
    if (this.contextMenuElement) {
      this.contextMenuElement.style.display = "none";
    }
    if (this.subMenuElement) {
      this.subMenuElement.style.display = "none";
    }
  }

  // 右键菜单操作处理方法
  private handleCopy(): void {
    if (this.activeCard) {
      //console.log("复制卡片:", this.activeCard);
      // TODO: 实现复制功能
    }
  }

  private handlePaste(): void {
    if (this.activeCard) {
      //console.log("粘贴到卡片:", this.activeCard);
      // TODO: 实现粘贴功能
    }
  }

  private handleSort(type: "rainbow" | "line" | "circle"): void {
    if (this.activeCard) {
      //console.log("排序类型:", type);
      // TODO: 实现不同类型的排序
    }
  }

  private handleZIndex(action: "top" | "bottom" | "up" | "down"): void {
    if (this.activeCard) {
      //console.log("层级操作:", action);
      // TODO: 实现层级调整
    }
  }
}
