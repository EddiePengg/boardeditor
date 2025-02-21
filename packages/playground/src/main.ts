import "./style.css";
import { Card, NapkinBoard } from "@boardeditor/core";
import { layoutCardsMasonry } from "@boardeditor/layout";
import { createDatabase } from "@boardeditor/model/src/utils";
import { addRxPlugin } from "rxdb";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";

// 初始化数据
const TEM_CARDS_DATA = [
  {
    title: "关于人生的思考",
    text: `最近在思考人生的意义和未来的方向。\n回顾过去的经历 总觉得生活像是一场长跑 每个人都在不停地奔跑着 渴望到达那个所谓的"终点"。有时候会感觉迷茫，不知道自己真正想要的是什么，也许这就是成长中的一种必经之路。读了一些哲学书，了解到每个人的追求和幸福标准都不同，或许人生的意义就是在这个过程中找到属于自己的节奏，学会接纳不完美的自己，与生活中的起伏和平共处。希望未来的自己，能少一点焦虑，多一点坚定，保持一颗热爱生活的心，继续前行，无论前路如何，都要不忘初心。`,
    tags: ["思考", "成长", "人生"],
    created_time: new Date().toISOString(),
  },
  {
    title: "清晨的思绪",
    text: "太阳升起，新的一天充满希望。",
    tags: ["思考", "希望", "清晨"],
  },

  {
    title: "午后的沉思",
    text: "工作遇到困难，需要冷静思考解决方案。",
    tags: ["工作", "挑战", "冷静"],
  },
  {
    title: "傍晚的放松",
    text: "黄昏时分，散步让心情平静。",
    tags: ["放松", "心情", "散步"],
  },
  {
    title: "夜晚的孤独",
    text: "星空下，感觉有些寂寞但也享受宁静。",
    tags: ["情绪", "孤独", "宁静"],
  },
  {
    title: "与朋友的欢乐",
    text: "与好友相聚，笑声不断，忘却烦恼。",
    tags: ["友情", "快乐", "相聚"],
  },
  {
    title: "学习的新发现",
    text: "今天学到了一些新知识，受益匪。",
    tags: ["学习", "成长", "收获"],
  },
  {
    title: "家的温暖",
    text: "回到家，家人的笑容让疲惫消散。",
    tags: ["家庭", "温暖", "幸福"],
  },

  {
    title: "运动的力量",
    text: "跑步后，大汗淋漓，感受到健康的活力。",
    tags: ["运动", "健康", "活力"],
  },
  {
    title: "阅读的乐趣",
    text: "一本好书，带我进入了另一个世界。",
    tags: ["阅读", "想象", "乐趣"],
  },
  {
    title: "音乐的治愈",
    text: "听着喜欢的音乐，心情慢慢平复。",
    tags: ["音乐", "情绪", "治愈"],
  },
];

(async () => {
  addRxPlugin(RxDBUpdatePlugin);

  // 创建应用

  const db = await createDatabase({
    dbName: "testWhiteboard",
    initialData: TEM_CARDS_DATA,
    storage: getRxStorageDexie(),
  });

  const container = document.querySelector("#app") as HTMLElement;
  if (!container) {
    throw new Error("Container element not found");
  }

  const whiteboard = new NapkinBoard(db.cards, {
    backgroundColor: "#FFF8E6",
    resizeTo: container,
    resolution: 2,
  });
  await whiteboard.initialize();

  container.appendChild(whiteboard.app.canvas);
  whiteboard.initializeUI();

  // 初始化卡片
  await whiteboard.search({ selector: { in_trash: false } });

  whiteboard.layout(layoutCardsMasonry);
})();
