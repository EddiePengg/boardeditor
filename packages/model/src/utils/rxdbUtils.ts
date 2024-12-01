import { createRxDatabase, RxDatabase, RxCollection } from "rxdb";
import { getRxStorageMemory } from "rxdb/plugins/storage-memory";
import { CARD_SCHEMA, CardDocument } from "../schema/card.schema";

// 定义数据库类型

type WhiteboardDatabase = RxDatabase<{ cards: RxCollection<CardDocument> }>;

// 定义通用的数据库创建工具
interface DbConfig {
  dbName: string; // 数据库名称
  storage?: any; // 存储方式，默认为内存存储
  initialData: any[]; // 可选的初始数据
}

// 创建数据库并初始化数据
export async function createDatabase(
  config: DbConfig
): Promise<WhiteboardDatabase> {
  const { dbName, storage = getRxStorageMemory(), initialData } = config;

  // 创建数据库实例
  const db = await createRxDatabase<WhiteboardDatabase>({
    name: dbName,
    storage,
  });

  // 创建集合
  await db.addCollections({
    cards: {
      schema: CARD_SCHEMA,
    },
  });

  // 初始化默认数据（如果有）
  if (initialData.length > 0) {
    await insertInitialData(db, initialData);
  }

  return db;
}

// 插入初始数据
async function insertInitialData(db: WhiteboardDatabase, data: any[]) {
  const now = new Date();
  const cardsToInsert = data.map((card, index) => ({
    id: `card-${index + 1}`,
    ...card,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    in_trash: false,
  }));

  // 批量插入数据
  await db.cards.bulkInsert(cardsToInsert);

  // for (let card of cardsToInsert) {
  //   await db.cards.insert(card);
  // }
}
