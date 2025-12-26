import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import localFont from 'next/font/local';
import "./globals.css";
import Header from "@/app/components/layout/Header";
import Footer from "@/app/components/layout/Footer";
import MobileNav from "@/app/components/layout/MobileNav";
import { AuthProvider } from "@/app/context/AuthContext";
import { LanguageProvider } from "@/app/context/LanguageContext";
import { getSessionUser, ServerUser } from "@/lib/server-auth";
import { Analytics } from "@vercel/analytics/react";

// Konfigurasi font Inter (Tetap)
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

// --- Konfigurasi Font Clash Lokal ---
// Font Bold sebagai font display utama
const clashFontBold = localFont({
  src: './fonts/Clash_Bold.otf',
  display: 'swap',
  variable: '--font-clash', // Variabel CSS utama untuk display/header
});

// Font Regular (jika diperlukan secara spesifik)
const clashFontRegular = localFont({
  src: './fonts/Clash_Regular.otf',
  display: 'swap',
  variable: '--font-clash-regular', // Variabel CSS terpisah untuk Regular
});
// --- Akhir Konfigurasi Font Clash ---

// Metadata untuk SEO & PWA
export const metadata: Metadata = {
  title: "Clashub | E-sports Community",
  description: "Pusat Strategi & Komunitas E-sports Clash of Clans",
  // [BARU] Konfigurasi PWA untuk iOS
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Clashub',
  },
};

// [MOBILE-FIRST] Viewport configuration yang ketat
// maximum-scale=1 mencegah zoom otomatis saat input di-tap pada iOS
// userScalable=false memberikan nuansa 'native app'
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a', // [BARU] Menyesuaikan warna bar browser
};

// Ubah RootLayout menjadi async Server Component (Tetap)
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialServerUser: ServerUser | null = await getSessionUser();

  return (
    // Tambahkan variabel clashFontBold dan clashFontRegular ke html
    <html lang="id" className={`${inter.variable} ${clashFontBold.variable} ${clashFontRegular.variable}`}>
      {/* [UPDATE STYLE]
        - bg-coc-stone: Menggunakan warna dasar baru (Dark Blue-Grey)
        - antialiased: Membuat font render lebih tajam/smooth
        - selection:..: Custom warna highlight teks (Gold)
      */}
      <body className={`font-sans flex flex-col min-h-screen bg-coc-stone text-white selection:bg-coc-gold/30 selection:text-coc-gold antialiased`}>
        {/* Wrap aplikasi dengan LanguageProvider agar Context Bahasa tersedia global */}
        <LanguageProvider>
          <AuthProvider initialServerUser={initialServerUser}>
            <Header />
            
            {/* [CONTAINER UTAMA]
              - flex-grow: Mengisi ruang kosong agar footer selalu di bawah
              - w-full max-w-[100vw]: Mencegah overflow horizontal yang umum terjadi di mobile
              - pb-20 md:pb-0: Memberikan padding bawah di mobile agar konten tidak tertutup MobileNav
            */}
            <main className="flex-grow w-full max-w-[100vw] overflow-x-hidden relative pb-20 md:pb-0">
              {children}
            </main>
            
            <Footer />
            
            {/* Mobile Navigation Bar (Fixed Bottom) */}
            <MobileNav />
          </AuthProvider>
        </LanguageProvider>
        
        {/* Komponen Analytics ditempatkan di sini agar mencakup seluruh aplikasi */}
        <Analytics />
      </body>
    </html>
  );
}