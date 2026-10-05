import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0c1117",
        canvas: "#f1f4f2",
        signal: "#ff6b4a",
        mint: "#56c6a9",
        caution: "#f4b942",
      },
      boxShadow: {
        panel: "0 20px 60px rgba(14, 23, 32, 0.07)",
      },
    },
  },
  plugins: [],
};

export default config;
