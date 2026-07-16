import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#1f2933",
        brand: { DEFAULT: "#0f4c5c", accent: "#0f7c8c" },
      },
    },
  },
  plugins: [],
} satisfies Config;
