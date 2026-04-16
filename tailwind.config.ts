import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f7f2e8",
        surface: "#fffdf8",
        ink: "#1d2430",
        muted: "#6a7380",
        line: "#ddd2bd",
        brand: {
          50: "#efe4d4",
          100: "#e2cfb0",
          300: "#c89d58",
          500: "#9e6b21",
          700: "#704710",
          900: "#341c08"
        },
        pine: "#254441",
        sky: "#dbe9f4",
        claret: "#7f2d2d"
      },
      boxShadow: {
        soft: "0 16px 50px rgba(52, 28, 8, 0.10)",
        card: "0 12px 28px rgba(52, 28, 8, 0.08)"
      },
      backgroundImage: {
        aura:
          "radial-gradient(circle at top left, rgba(200,157,88,0.18), transparent 24rem), radial-gradient(circle at 82% 0%, rgba(37,68,65,0.14), transparent 22rem), linear-gradient(180deg, rgba(255,253,248,1), rgba(247,242,232,1))"
      }
    }
  },
  plugins: []
};

export default config;
