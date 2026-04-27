module.exports = {
  root: true,
  extends: ["taro/react", "plugin:@typescript-eslint/recommended"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname
  },
  rules: {
    "react/react-in-jsx-scope": "off"
  },
  ignorePatterns: ["dist", "node_modules"]
}
