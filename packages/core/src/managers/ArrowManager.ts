// ArrowManager.ts
import { Application, Container, Graphics } from "pixi.js";
import { Card } from "../Card/index.js";

export class ArrowManager {
  private static instance: ArrowManager;
  private app: Application;
  private arrows: { parent: Card; child: Card; graphic: Graphics }[] = [];

  private arrowLayer: Container;

  private constructor(app: Application) {
    this.app = app;
    this.arrowLayer = new Container();
    this.app.stage.children[0].addChild(this.arrowLayer); // 🚧应该有别的方法获取whiteBoard
    this.app.ticker.add(this.updateArrows, this);
  }

  public static getInstance(app: Application): ArrowManager {
    if (!ArrowManager.instance) {
      ArrowManager.instance = new ArrowManager(app);
    }
    return ArrowManager.instance;
  }

  public createArrow(parent: Card, child: Card): void {
    const arrow = new Graphics();
    this.arrowLayer.addChild(arrow);
    this.arrows.push({ parent, child, graphic: arrow });
  }

  public removeArrow(parent: Card, child: Card): void {
    const arrowInfo = this.arrows.find(
      (arrow) => arrow.parent === parent && arrow.child === child
    );
    if (arrowInfo) {
      this.arrowLayer.removeChild(arrowInfo.graphic);
      this.arrows = this.arrows.filter((arrow) => arrow !== arrowInfo);
    }
  }

  private updateArrows(): void {
    this.arrows.forEach((arrowInfo) => {
      const { parent, child, graphic } = arrowInfo;

      const arrow = graphic;

      arrow.clear();

      const startPos = this.arrowLayer.toLocal(parent.getGlobalPosition());
      const endPos = this.arrowLayer.toLocal(child.getGlobalPosition());

      // 父卡片的中心位置
      const startX = startPos.x + parent.background.width;
      const startY = startPos.y + parent.background.height / 2;

      // 子卡片的中心位置
      const endX = endPos.x;
      const endY = endPos.y + child.background.height / 2;

      // 绘制箭头的线条，从父卡片的中心到子卡片的中心
      arrow.moveTo(startX, startY);
      arrow.lineTo(endX, endY);

      // 设置箭头样式

      // 绘制箭头的头部（三角形）
      const angle = Math.atan2(endY - startY, endX - startX);
      const arrowHeadSize = 10; // 箭头的大小

      // 计算箭头头部的位置
      const arrowHeadX1 = endX - arrowHeadSize * Math.cos(angle - Math.PI / 6);
      const arrowHeadY1 = endY - arrowHeadSize * Math.sin(angle - Math.PI / 6);

      const arrowHeadX2 = endX - arrowHeadSize * Math.cos(angle + Math.PI / 6);
      const arrowHeadY2 = endY - arrowHeadSize * Math.sin(angle + Math.PI / 6);

      // 画箭头头部（三角形）
      arrow.lineTo(arrowHeadX1, arrowHeadY1);
      arrow.moveTo(endX, endY);
      arrow.lineTo(arrowHeadX2, arrowHeadY2);

      arrow.stroke({ width: 2, color: 0x333333 });
    });
  }
}
