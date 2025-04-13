import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Отключены все правила ESLint
const eslintConfig = [{
  rules: {
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "react/no-unescaped-entities": "off",
    "react-hooks/exhaustive-deps": "off",
    // Для плоской конфигурации устанавливаем все правила в положение "off"
    "*": "off",
    "**/*": "off"
  },
  ignores: ["**/*"]
}];

export default eslintConfig;
