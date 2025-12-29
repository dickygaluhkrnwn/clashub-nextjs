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

// [BARU] Import Firestore Admin & Komponen Overlay
import { adminFirestore } from "@/lib/firebase-admin";
import MaintenanceOverlay from "@/app/components/layout/MaintenanceOverlay";

// Konfigurasi font Inter (Tetap)
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });

// --- Konfigurasi Font Clash Lokal ---
const clashFontBold = localFont({
  src: './fonts/Clash_Bold.otf',
  display: 'swap',
  variable: '--font-clash',
});

const clashFontRegular = localFont({
  src: './fonts/Clash_Regular.otf',
  display: 'swap',
  variable: '--font-clash-regular',
});
// --- Akhir Konfigurasi Font Clash ---

export const metadata: Metadata = {
  title: "Clashub | E-sports Community",
  description: "Pusat Strategi & Komunitas E-sports Clash of Clans",
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Clashub',
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a0a',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialServerUser: ServerUser | null = await getSessionUser();

  // --- [BARU] LOGIKA MAINTENANCE SERVER-SIDE ---
  // Kita cek status maintenance langsung dari Firestore saat layout dirender di server.
  // Ini lebih aman dan cepat daripada client-side fetching.
  
  let isMaintenance = false;
  let isAdmin = false;

  try {
    // 1. Cek Status Global
    const settingsDoc = await adminFirestore.collection('settings').doc('general').get();
    if (settingsDoc.exists && settingsDoc.data()?.maintenanceMode) {
      isMaintenance = true;
    }

    // 2. Cek Status Admin User (Bypass)
    if (initialServerUser?.uid) {
      const userDoc = await adminFirestore.collection('users').doc(initialServerUser.uid).get();
      // Pastikan field isGlobalAdmin benar-benar true
      if (userDoc.exists && userDoc.data()?.isGlobalAdmin === true) {
        isAdmin = true;
      }
    }
  } catch (error) {
    console.error("Layout Error (Maintenance Check):", error);
    // Jika error (misal database down), default ke normal agar tidak memblokir akses
    isMaintenance = false;
  }
  // --- [AKHIR LOGIKA] ---

  return (
    <html lang="id" className={`${inter.variable} ${clashFontBold.variable} ${clashFontRegular.variable}`}>
      <body className={`font-sans flex flex-col min-h-screen bg-coc-stone text-white selection:bg-coc-gold/30 selection:text-coc-gold antialiased`}>
        
        {/* [BARU] Overlay Maintenance Guard */}
        {/* Komponen ini akan menutupi seluruh layar jika maintenance aktif & user bukan admin */}
        <MaintenanceOverlay isMaintenance={isMaintenance} isAdmin={isAdmin} />

        <LanguageProvider>
          <AuthProvider initialServerUser={initialServerUser}>
            {/* Header tetap di-render di balik overlay (untuk SEO/Structure), tapi tidak bisa diklik */}
            <Header />
            
            <main className="flex-grow w-full max-w-[100vw] overflow-x-hidden relative pb-20 md:pb-0">
              {children}
            </main>
            
            <Footer />
            <MobileNav />
          </AuthProvider>
        </LanguageProvider>
        
        <Analytics />
      </body>
    </html>
  );
}