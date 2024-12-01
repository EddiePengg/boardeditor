import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts"; // 导入 dts 插件
import { writeFileSync } from "fs";

export default [
  // 打包 JavaScript 文件
  {
    input: "dist/index.js", // 使用 tsc 编译后的 JavaScript 文件
    output: {
      dir: "bundle", // 输出目录
      format: "es", // 输出格式 (ESM)
      sourcemap: true,
      inlineDynamicImports: true, // 合并动态导入
    },
    plugins: [
      resolve(), // 解析 Node.js 模块
      commonjs(), // 转换 CommonJS 模块为 ES 模块
    ],
    external: (id) => {
      // 排除 Node.js 核心模块，但强制内联所有 `node_modules`
      return (
        id.startsWith("node:") || id.startsWith("fs") || id.startsWith("path")
      );
    },
    onwarn(warning, warn) {
      // 忽略循环依赖警告
      if (warning.code === "CIRCULAR_DEPENDENCY") {
        console.warn(`🚧有依赖循环的警告，但是目前忽略: ${warning}`);
      } else {
        warn(warning); // 处理其他警告
      }
    },
  },
  // 打包类型定义文件
  {
    input: "dist/index.d.ts", // 类型定义文件的入口
    output: {
      file: "bundle/index.d.ts", // 输出合并后的类型定义文件
      format: "es", // 使用 ES 模块格式
    },
    plugins: [dts()], // 使用 dts 插件打包 .d.ts 文件
  },
];

// 在打包完成后，生成 package.json 文件
const packageJsonContent = {
  name: "@boardeditor/core",
  version: "1.0.0",
  main: "index.cjs.js",
  module: "index.esm.js",
  types: "index.d.ts",
  license: "MIT",
  description: "Core functionality for BoardEditor",
};

writeFileSync(
  "bundle/package.json",
  JSON.stringify(packageJsonContent, null, 2)
);
