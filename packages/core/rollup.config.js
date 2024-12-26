import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import dts from "rollup-plugin-dts";

export default [
  // 打包源代码
  {
    input: "src/index.ts",
    output: {
      dir: "bundle",
      format: "es", // 输出为 ES 模块
      sourcemap: true, // 生成 sourcemap
      inlineDynamicImports: true, // 处理动态导入
    },
    plugins: [
      typescript({
        tsconfig: "./tsconfig.json",
        clean: true, // 确保清理缓存
        useTsconfigDeclarationDir: true, // 确保使用 tsconfig 中的 declarationDir
      }),
      resolve({
        extensions: [".js", ".ts"], // 支持解析 .js 和 .ts 文件
        preferBuiltins: true, // 优先使用 Node.js 内置模块
      }),
      commonjs(), // 处理 CommonJS 模块
    ],
    external: (id) =>
      id.startsWith("node:") || // Node.js 内置模块
      id.startsWith("fs") ||
      id.startsWith("path") ||
      ["nanoid", "pixi.js", "rxdb"].includes(id), // 显式标记第三方依赖为 external
  },
  // 打包类型声明文件
  {
    input: "src/index.ts",
    output: {
      file: "bundle/index.d.ts",
      format: "es", // 类型声明以 ESM 格式输出
    },
    plugins: [dts()], // 使用 rollup-plugin-dts 生成类型声明
  },
];
