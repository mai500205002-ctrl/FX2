import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#121315",
        "on-background": "#e3e2e5",
        surface: "#121315",
        "surface-dim": "#121315",
        "surface-bright": "#38393b",
        "surface-container-lowest": "#0d0e10",
        "surface-container-low": "#1b1c1e",
        "surface-container": "#1f2022",
        "surface-container-high": "#292a2c",
        "surface-container-highest": "#343537",
        "on-surface": "#e3e2e5",
        "on-surface-variant": "#d0c5af",
        primary: "#f2ca50",
        "on-primary": "#3c2f00",
        "primary-container": "#d4af37",
        "on-primary-container": "#554300",
        secondary: "#e9bf90",
        "on-secondary": "#452b08",
        "secondary-container": "#61431f",
        "on-secondary-container": "#dab183",
        outline: "#99907c",
        "outline-variant": "#4d4635",
        error: "#ffb4ab",
        "error-container": "#93000a",
      },
      fontFamily: {
        headline: ["var(--font-plex-arabic)", "sans-serif"],
        body: ["var(--font-plex-arabic)", "sans-serif"],
        mono: ["var(--font-jetbrains-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
