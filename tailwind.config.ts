import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warna Inti dari Desain Baru
        'coc-gold': '#FFD700',
        'coc-gold-dark': '#B8860B',
        'coc-stone': '#0F111A', // Menggunakan warna dasar yang lebih gelap untuk kontras
        'coc-stone-light': '#1A1C30', // Sedikit lebih gelap untuk latar kartu
        'coc-red': '#B22222',
        'coc-green': '#00CC7A',
        // Warna tambahan dari file Anda (disimpan untuk penggunaan di masa depan)
        'coc-elixir': '#e573e5',
        'coc-dark-elixir': '#5d3c5d',
      },
      fontFamily: {
        // Menggunakan variabel CSS untuk font dari layout.tsx
        'supercell': ['var(--font-uncial-antiqua)', 'cursive'], 
        'sans': ['var(--font-inter)', 'sans-serif'],
      },
      backgroundImage: {
        // Menambahkan semua variasi gambar latar
        'stone-pattern': "url('/images/stone-texture.png')",
        'hero-banner': "url('/images/clash-hero-art.png')",
      },
      boxShadow: {
        // Bayangan untuk tombol 3D dan kartu
        '3d-gold': 'inset 0 2px 2px rgba(255, 255, 255, 0.4), 0 4px 0 0 #9e7f1a',
        '3d-gold-hover': 'inset 0 2px 2px rgba(255, 255, 255, 0.4), 0 4px 0 0 #9e7f1a, 0 0 15px rgba(255, 215, 0, 0.6)',
        'stone': 'inset 0 0 10px rgba(0, 0, 0, 0.6), 0 5px 15px rgba(0, 0, 0, 0.6)',
      },
      // Menambahkan animasi untuk header
      keyframes: {
        'header-glow': {
          '0%, 100%': {
            boxShadow: 'inset 0 -3px 8px rgba(255, 215, 0, 0.2), 0 8px 15px rgba(0, 0, 0, 0.7)',
          },
          '50%': {
            boxShadow: 'inset 0 -4px 12px rgba(255, 215, 0, 0.4), 0 8px 20px rgba(0, 0, 0, 0.7)',
          }
        }
      },
      animation: {
        'header-glow': 'header-glow 5s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};
export default config;

