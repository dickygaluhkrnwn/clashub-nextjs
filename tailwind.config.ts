import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  // --- PERBAIKAN UTAMA: PATH KONTEN ---
  // Kita akan secara eksplisit memberi tahu Tailwind untuk memindai SEMUA file
  // di dalam direktori 'app'.
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // --- AKHIR PERBAIKAN ---
  theme: {
    extend: {
      colors: {
        // Warna Inti dari Desain Baru
        'coc-gold': '#FFD700',
        'coc-gold-dark': '#B8860B',
        'coc-stone': '#0F111A', // Base Background (Darkest Blue-Grey)
        'coc-stone-light': '#1A1C30', // Surface / Card Background
        'coc-red': '#B22222',
        'coc-green': '#00CC7A',
        // Warna tambahan
        'coc-elixir': '#e573e5',
        'coc-dark-elixir': '#5d3c5d',
      },
      fontFamily: {
        // Font Sans-serif default (Inter)
        sans: ['var(--font-inter)', 'sans-serif'],
        // Font Clash Bold (untuk header/display)
        clash: ['var(--font-clash)', 'sans-serif'], // Menggunakan fallback sans-serif biasa
        // Font Clash Regular (opsional)
        'clash-regular': ['var(--font-clash-regular)', 'sans-serif'],
      },
      backgroundImage: {
        // Menghapus 'stone-pattern' sesuai permintaan
        'hero-banner': "url('/images/clash-hero-art.png')",
        // [PERBAIKAN HEADER] Menambahkan banner baru untuk Team Hub
        'teamhub-banner': "url('/images/banner-teamhub.png')",
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