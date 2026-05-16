import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17211f",
        paper: "#f7f8f5",
        line: "#dfe5df",
        moss: "#64796b",
        pine: "#20483c",
        rust: "#a45a3f",
        gold: "#c99b43"
      }
    }
  },
  plugins: []
};

export default config;
