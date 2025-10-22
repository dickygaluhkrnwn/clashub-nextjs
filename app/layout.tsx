import type { Metadata } from "next";
import { Inter } from "next/font/google";
import localFont from 'next/font/local'; // Import localFont
import "./globals.css";
import Header from "@/app/components/layout/Header";
import Footer from "@/app/components/layout/Footer";
import { AuthProvider } from "@/app/context/AuthContext";
import { getSessionUser, ServerUser } from "@/lib/server-auth";

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

// Metadata untuk SEO (Tetap)
export const metadata: Metadata = {
  title: "Clashub | E-sports Community",
  description: "Pusat Strategi & Komunitas E-sports Clash of Clans",
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
      {/* Pastikan body default menggunakan font-sans (Inter) */}
      <body className={`font-sans flex flex-col min-h-screen`}>
        <AuthProvider initialServerUser={initialServerUser}>
          <Header />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
