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
        canvas: "#ffffff",
        surface: "#ffffff",
        ink: "#111111",
        muted: "#5e5a67",
        line: "#e6dcf2",
        brand: {
          50: "#faf3d8",
          100: "#f4e29a",
          300: "#e1ba3f",
          500: "#c99712",
          700: "#9b6c08",
          900: "#5f3f05"
        },
        pine: "#4b1f6f",
        sky: "#f5effc",
        claret: "#7f2d2d"
      },
      boxShadow: {
        soft: "0 18px 60px rgba(20, 20, 20, 0.10)",
        card: "0 14px 34px rgba(20, 20, 20, 0.09)"
      },
      backgroundImage: {
        aura:
          "radial-gradient(circle at top left, rgba(75,31,111,0.10), transparent 24rem), radial-gradient(circle at 88% 0%, rgba(201,151,18,0.14), transparent 20rem), linear-gradient(180deg, rgba(255,255,255,1), rgba(250,247,255,1))",
        hero:
          "linear-gradient(135deg, rgba(75,31,111,0.98), rgba(28,10,54,0.95))"
      }
    }
  },
  plugins: []
};

export default config;
