import type { Metadata } from "next";
import { Inter, Uncial_Antiqua } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/layout/Header";
import Footer from "@/app/components/layout/Footer";
import { AuthProvider } from "@/app/context/AuthContext";
// Import getSessionUser dan tipe ServerUser
import { getSessionUser, ServerUser } from "@/lib/server-auth";

// Konfigurasi font
const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const uncialAntiqua = Uncial_Antiqua({
  subsets: ["latin"],
  weight: "400",
  variable: '--font-uncial-antiqua',
});

// Metadata untuk SEO
export const metadata: Metadata = {
  title: "Clashub | E-sports Community",
  description: "Pusat Strategi & Komunitas E-sports Clash of Clans",
};

// Ubah RootLayout menjadi async Server Component
export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Panggil getSessionUser di server untuk mendapatkan status sesi awal
  const initialServerUser: ServerUser | null = await getSessionUser();

  return (
    <html lang="id">
      <body className={`${inter.variable} ${uncialAntiqua.variable} font-sans flex flex-col min-h-screen`}>
        {/* Berikan initialServerUser sebagai prop ke AuthProvider */}
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

