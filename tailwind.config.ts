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
        canvas: "#f4efe4",
        surface: "#fffaf1",
        ink: "#141414",
        muted: "#6c6457",
        line: "#dcc9a5",
        brand: {
          50: "#f7ecd3",
          100: "#edd7a5",
          300: "#d6ad58",
          500: "#b8871d",
          700: "#8e6510",
          900: "#4d3408"
        },
        pine: "#1f1c17",
        sky: "#efe6d7",
        claret: "#7f2d2d"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(20, 20, 20, 0.10)",
        card: "0 14px 34px rgba(20, 20, 20, 0.09)"
      },
      backgroundImage: {
        aura:
          "radial-gradient(circle at top left, rgba(214,173,88,0.20), transparent 24rem), radial-gradient(circle at 88% 0%, rgba(20,20,20,0.08), transparent 22rem), linear-gradient(180deg, rgba(255,250,241,1), rgba(244,239,228,1))",
        hero:
          "linear-gradient(135deg, rgba(20,20,20,0.98), rgba(34,26,10,0.95))"
      }
    }
  },
  plugins: []
};

export default config;
