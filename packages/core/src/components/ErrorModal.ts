export class ErrorModal {
  private static modalContainer: HTMLDivElement | null = null;

  private static createModalContainer(): HTMLDivElement {
    const container = document.createElement("div");
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    `;
    return container;
  }

  private static createModalContent(message: string): HTMLDivElement {
    const content = document.createElement("div");
    content.style.cssText = `
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      width: 90%;
      position: relative;
    `;

    // 错误消息
    const messageElement = document.createElement("div");
    messageElement.style.cssText = `
      color: #ff0000;
      margin-bottom: 20px;
      font-size: 16px;
      word-break: break-word;
    `;
    messageElement.textContent = message;
    content.appendChild(messageElement);

    // 关闭按钮
    const closeButton = document.createElement("button");
    closeButton.style.cssText = `
      background-color: #ff0000;
      color: white;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    closeButton.textContent = "关闭";
    closeButton.onclick = () => ErrorModal.hide();
    content.appendChild(closeButton);

    return content;
  }

  public static show(message: string): void {
    // 如果已经存在模态窗口，先移除
    this.hide();

    // 创建新的模态窗口
    const container = this.createModalContainer();
    const content = this.createModalContent(message);
    container.appendChild(content);
    document.body.appendChild(container);
    this.modalContainer = container;

    // 点击背景关闭
    container.addEventListener("click", (e) => {
      if (e.target === container) {
        this.hide();
      }
    });
  }

  public static hide(): void {
    if (this.modalContainer && document.body.contains(this.modalContainer)) {
      document.body.removeChild(this.modalContainer);
    }
    this.modalContainer = null;
  }
}
