import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans:     ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      headline: ["var(--font-instrument-serif)", "Georgia", "serif"],
      serif:    ["var(--font-instrument-serif)", "Georgia", "serif"],
      mono:     ["Fira Code", "monospace"],
    },
    borderRadius: {
      DEFAULT: "2px",
      xs: "4px",
      sm: "4px",
      md: "8px",
      lg: "12px",
      xl: "16px",
      "2xl": "24px",
      full: "9999px",
    },
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--primary-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        "outline-variant": "rgb(198 198 198 / <alpha-value>)",
        "on-surface-variant": "rgb(71 71 71 / <alpha-value>)",
        "on-surface": "var(--on-surface)",
        "outline": "var(--outline)",
        "surface-container-lowest": "var(--surface-container-lowest)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container": "var(--surface-container)",
        "surface": "var(--surface)",
        "plans-accent":      "#3D3D8F",
        "plans-accent-deep": "#262477",
        "plans-text":        "#1C1B1B",
        "plans-text-2":      "#5E5E5E",
        "plans-surface":     "#F0EDEC",
        "plans-surface-lo":  "#F6F3F2",
        "plans-divider":     "#C7C5D3",
        "plans-bg":          "#FCF9F8",
      },
    },
  },
  plugins: [],
};
export default config;
