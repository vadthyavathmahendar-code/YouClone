import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        yt: {
          black: "#0f0f0f",
          red: "#ff0000",
          light: "#f1f1f1",
          border: "#303030"
        }
      }
    },
  },
  plugins: [],
};
export default config;