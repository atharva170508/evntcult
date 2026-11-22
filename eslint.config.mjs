import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
  // Third-party component sources, kept as-is until a component is moved into src/ and adapted.
  { ignores: ["vendor-ui/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
