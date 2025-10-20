import type { Metadata } from "next";
import { Inter, Uncial_Antiqua } from "next/font/google";
import "./globals.css";
import Header from "@/app/components/layout/Header"; // Impor Header
import Footer from "@/app/components/layout/Footer"; // Impor Footer

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={`${inter.variable} ${uncialAntiqua.variable} font-sans flex flex-col min-h-screen`}>
        <Header />
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}

