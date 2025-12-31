module.exports = {
  env: {
    node: true,
  },
  parser: "@typescript-eslint/parser",
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],
  plugins: ["@typescript-eslint"],
  parserOptions: {
    sourceType: "module",
    ecmaVersion: 2020,
  },
  rules: {
    "@typescript-eslint/no-non-null-assertion": "off",
    // Result型によるエラーハンドリングを推奨
    // throw文の使用を警告（外部ライブラリの例外キャッチ後の再throwは許容）
    "no-throw-literal": "error",
    // any型の使用を警告
    "@typescript-eslint/no-explicit-any": "warn",
  },
};
