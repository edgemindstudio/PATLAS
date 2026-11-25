import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      ".venv/**",
      "playwright-report/**",
      "test-results/**",
      "evidence/**",
      "next-env.d.ts",
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // The project deliberately separates server-only modules by directory.
      // Importing them from client components is caught by the build; keep the
      // default Next.js rules otherwise.
      "@next/next/no-html-link-for-pages": "off",
    },
  },
];

export default config;
