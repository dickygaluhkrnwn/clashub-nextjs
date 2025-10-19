import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'coc-gold': '#FFD700',
        'coc-gold-dark': '#B8860B',
        'coc-stone': '#3a3a3a',
        'coc-stone-light': '#4f4f4f',
        'coc-elixir': '#e573e5',
        'coc-dark-elixir': '#5d3c5d',
        'coc-red': '#B22222',
        'coc-green': '#00CC7A',
      },
      fontFamily: {
        'supercell': ['"Uncial Antiqua"', 'cursive'], 
        'sans': ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'stone-pattern': "url('/stone-texture.png')",
        'stone-pattern-dark': "url('/stone-texture-dark.png')",
      },
      boxShadow: {
        '3d-gold': 'inset 0 2px 2px rgba(255, 255, 255, 0.4), 0 6px 0 0 #9e7f1a',
        '3d-gold-hover': 'inset 0 2px 2px rgba(255, 255, 255, 0.4), 0 6px 0 0 #9e7f1a, 0 0 15px rgba(255, 215, 0, 0.6)',
      }
    },
  },
  plugins: [],
};
export default config;