import { ContextMenuService } from "../services/ContextMenuService";
import { Card } from "../Card/Card";
import { BoxSelection } from "../Whiteboard/managers/BoxSelection";
import { Application } from "pixi.js";
import {
  layoutCardsMasonry,
  layoutCardsInCircle,
  layoutCardsRandomly,
  layoutCardsInGrid,
} from "@boardeditor/layout";

export const configureContextMenu = (
  service: ContextMenuService,
  app: Application
) => {
  // 卡片菜单配置
  service.register({
    targetTypes: ["card"],
    getItems: (target: unknown) => {
      const card = target as Card;
      return [
        {
          id: "copy",
          label: "复制",
          icon: "📋",
          shortcut: "Ctrl+C",
          handler: () => {
            // TODO: 实现复制功能
          },
        },
        {
          id: "delete",
          label: "删除",
          icon: "🗑",
          shortcut: "Delete",
          handler: () => {
            // TODO: 实现删除功能
          },
        },
        {
          id: "layer",
          label: "层级",
          icon: "📚",
          children: [
            {
              id: "bringToFront",
              label: "置于顶层",
              icon: "⬆️",
              handler: () => {
                // TODO: 实现置顶功能
              },
            },
            {
              id: "sendToBack",
              label: "置于底层",
              icon: "⬇️",
              handler: () => {
                // TODO: 实现置底功能
              },
            },
            {
              id: "bringForward",
              label: "上移一层",
              icon: "↕️",
              handler: () => {
                // TODO: 实现上移功能
              },
            },
            {
              id: "sendBackward",
              label: "下移一层",
              icon: "↕️",
              handler: () => {
                // TODO: 实现下移功能
              },
            },
          ],
        },
      ];
    },
  });

  // 多选菜单配置
  service.register({
    targetTypes: ["selection"],
    getItems: (target: unknown) => {
      const selection = target as BoxSelection;
      const selectionBox = selection.selectionBox;
      return [
        {
          id: "group",
          label: "成组",
          icon: "📦",
          handler: () => {
            // TODO: 实现成组功能
          },
        },
        {
          id: "align",
          label: "布局方式",
          icon: "⚖️",
          children: [
            {
              id: "layoutMasonry",
              label: "瀑布流布局",
              icon: "🏊",
              handler: () => {
                const cards = Array.from(
                  selection.getSelectedElements().values()
                ).filter((element) => element instanceof Card) as Card[];

                layoutCardsMasonry(cards, {
                  columns: 3, // 默认3列瀑布流
                  startX: selectionBox.x,
                  startY: selectionBox.y,
                });

                selection.clear();
              },
            },
            {
              id: "layoutCircle",
              label: "环形布局",
              icon: "⭕",
              handler: () => {
                const cards = Array.from(
                  selection.getSelectedElements().values()
                ).filter((element) => element instanceof Card) as Card[];

                layoutCardsInCircle(cards, {
                  startX: selectionBox.x,
                  startY: selectionBox.y,
                });

                selection.clear();
              },
            },
            {
              id: "layoutRandom",
              label: "随机布局",
              icon: "🎲",
              handler: () => {
                const cards = Array.from(
                  selection.getSelectedElements().values()
                ).filter((element) => element instanceof Card) as Card[];

                layoutCardsRandomly(cards, {
                  startX: selectionBox.x,
                  startY: selectionBox.y,
                });

                selection.clear();
              },
            },
            {
              id: "layoutGrid",
              label: "网格布局",
              icon: "📏",
              handler: () => {
                const cards = Array.from(
                  selection.getSelectedElements().values()
                ).filter((element) => element instanceof Card) as Card[];

                layoutCardsInGrid(cards, {
                  startX: selectionBox.x,
                  startY: selectionBox.y,
                });

                selection.clear();
              },
            },
          ],
        },
      ];
    },
  });

  // 白板背景菜单
  service.register({
    targetTypes: ["stage"],
    getItems: () => [
      {
        id: "paste",
        label: "粘贴",
        icon: "📋",
        shortcut: "Ctrl+V",
        handler: () => {
          console.log("paste");
          // TODO: 实现粘贴功能
        },
      },
      {
        id: "selectAll",
        label: "全选",
        icon: "☑️",
        shortcut: "Ctrl+A",
        handler: () => {
          console.log("selectAll");
          // TODO: 实现全选功能
        },
      },
      {
        id: "arrange",
        label: "排列",
        icon: "🎯",
        children: [
          {
            id: "arrangeRainbow",
            label: "彩虹流排序",
            icon: "🌈",
            handler: () => {
              // TODO: 实现彩虹流排序功能
            },
          },
          {
            id: "arrangeLine",
            label: "直线排序",
            icon: "📏",
            handler: () => {
              // TODO: 实现直线排序功能
            },
          },
          {
            id: "arrangeCircle",
            label: "环形排序",
            icon: "🔄",
            handler: () => {
              // TODO: 实现环形排序功能
            },
          },
        ],
      },
    ],
  });
};
