import typescript from "rollup-plugin-typescript2";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.js",
      format: "cjs", // CommonJS 格式
    },
    {
      file: "dist/index.esm.js",
      format: "es", // ES Module 格式
    },
    {
      file: "dist/index.umd.js",
      format: "umd", // UMD 格式
      name: "YourLibraryName", // UMD 格式需要一个全局变量名
    },
  ],
  plugins: [
    typescript({
      // 显式指定 tsconfig 路径
      tsconfig: "./tsconfig.json",
      // 如果需要覆盖 tsconfig 中的某些选项
      tsconfigOverride: {
        compilerOptions: {
          // 这里可以覆盖一些编译选项
          declaration: true,
        },
      },
    }),
  ],
};
