/**
 * 共有ESLint設定（Flat Config形式）
 *
 * ESLint 9対応のFlat Config形式
 * defineConfigを使用（tseslint.configは非推奨）
 */
import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import functional from "eslint-plugin-functional";
import prettier from "eslint-plugin-prettier/recommended";

/**
 * 基本設定
 */
export const baseConfig = defineConfig([
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      functional,
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      // Result型によるエラーハンドリングを推奨（neverthrow）
      // throw文を禁止し、Result型の使用を強制
      // async関数内のthrowも検出するためallowToRejectPromises: false
      // 外部ライブラリ連携で必要な場合はeslint-disableで明示的に回避
      "no-throw-literal": "error",
      "functional/no-throw-statements": "error",
      // any型の使用を警告
      "@typescript-eslint/no-explicit-any": "warn",
      // console.log禁止（本番コードでの使用を防ぐ）
      "no-console": "error",
    },
  },
  // CLIスクリプトではconsole出力を許可
  {
    files: ["**/scripts/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
  // loggerモジュールではconsole出力を許可
  {
    files: ["**/logger/**/*.ts", "**/lib/logger.ts"],
    rules: {
      "no-console": "off",
    },
  },
  // tRPC routerではTRPCErrorのthrowが必要
  {
    files: ["**/router.ts", "**/trpc/**/*.ts"],
    rules: {
      "functional/no-throw-statements": "off",
    },
  },
  // E2Eテスト・テストファイルではthrowを許可
  {
    files: ["**/e2e/**/*.ts", "**/*.spec.ts", "**/*.test.ts"],
    rules: {
      "functional/no-throw-statements": "off",
    },
  },
  // Prettier統合（最後に配置）
  prettier,
]);

/**
 * Node.js環境用設定
 */
export const nodeConfig = defineConfig([
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        module: "readonly",
        require: "readonly",
      },
    },
  },
]);

/**
 * ブラウザ環境用設定
 */
export const browserConfig = defineConfig([
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        console: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        fetch: "readonly",
        URL: "readonly",
        URLSearchParams: "readonly",
      },
    },
  },
]);

export default baseConfig;
