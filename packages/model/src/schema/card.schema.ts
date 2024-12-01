import {
  toTypedRxJsonSchema,
  ExtractDocumentTypeFromTypedRxJsonSchema,
} from "rxdb";

// 定义 Schema
const cardSchemaLiteral = {
  title: "card schema",
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: {
      type: "string",
      maxLength: 100,
    },
    text: {
      type: "string",
    },
    parent: {
      type: "object",
    },
    tags: {
      type: "array",
      items: {
        type: "string",
      },
    },
    created_time: {
      type: "string",
    },
    last_edited_time: {
      type: "string",
    },
    in_trash: {
      type: "boolean",
    },
  },
  required: ["id", "text", "created_time", "last_edited_time"],
} as const;

// 转换成 TypedRxJsonSchema
export const CARD_SCHEMA = toTypedRxJsonSchema(cardSchemaLiteral);

// 导出类型
export type CardDocument = ExtractDocumentTypeFromTypedRxJsonSchema<
  typeof CARD_SCHEMA
>;

// 导出 schema
