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

// Import Firestore Admin & Komponen Overlay
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
  manifest: '/manifest.json', // Pastikan manifest ada untuk PWA
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
  themeColor: '#0a0a0b', // Update theme color to match new dark background
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialServerUser: ServerUser | null = await getSessionUser();

  // --- LOGIKA MAINTENANCE SERVER-SIDE ---
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
    <html lang="id" className={`${inter.variable} ${clashFontBold.variable} ${clashFontRegular.variable} dark`}>
      <body className={`font-sans flex flex-col min-h-screen bg-[#0a0a0b] text-white selection:bg-coc-gold/30 selection:text-coc-gold antialiased overflow-x-hidden`}>
        
        {/* Global Ambient Texture (Optional - adds subtle noise/grain) */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-[0.03] z-0 mix-blend-overlay"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}
        />

        {/* Global Background Glow (Very subtle at bottom) */}
        <div className="fixed bottom-0 left-0 w-full h-[500px] bg-gradient-to-t from-coc-blue/5 via-transparent to-transparent pointer-events-none z-0" />

        {/* Overlay Maintenance Guard */}
        <MaintenanceOverlay isMaintenance={isMaintenance} isAdmin={isAdmin} />

        <LanguageProvider>
          <AuthProvider initialServerUser={initialServerUser}>
            <Header />
            
            <main className="flex-grow w-full max-w-[100vw] relative pb-20 md:pb-0 z-10">
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