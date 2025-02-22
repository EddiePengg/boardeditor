import { Application } from "pixi.js";
import { Card } from "../Card/Card";
import { BoxSelection } from "../Whiteboard/managers/BoxSelection";
import {
  ContextMenuConfig,
  ContextMenuItem,
  TargetType,
} from "../types/context-menu";

export class ContextMenuService {
  private registry = new Map<string, ContextMenuConfig>();
  private app: Application;

  constructor(app: Application) {
    console.log("ContextMenuService constructor", app);
    this.app = app;
  }

  public register(config: ContextMenuConfig) {
    config.targetTypes.forEach((type) => {
      this.registry.set(type, config);
    });
  }

  /**
   * 获取菜单项
   * @param target 目标对象
   * @returns 菜单项
   */
  public getMenuItems(target: unknown): ContextMenuItem[] {
    const targetType = this.getTargetType(target);
    const config = this.registry.get(targetType);
    const items = config?.getItems(target) || [];

    // 过滤掉不可见的菜单项
    return items.filter((item) => {
      if (item.visible) {
        return item.visible(target);
      }
      return true;
    });
  }

  private getTargetType(target: unknown): TargetType {
    if (target instanceof Card) return "card";
    if (target instanceof BoxSelection) return "selection";
    if (target === this.app.stage) return "stage";
    // TODO: 添加其他类型判断
    return "unknown";
  }
}
