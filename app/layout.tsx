import type { Metadata } from "next";
import { Inter, Uncial_Antiqua } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header"; // Impor Header

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const uncialAntiqua = Uncial_Antiqua({
  subsets: ["latin"],
  weight: "400",
  variable: '--font-uncial-antiqua',
});

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
      <body className={`${inter.variable} ${uncialAntiqua.variable} font-sans`}>
        <Header /> {/* Tambahkan Header di sini */}
        {children}
        {/* Di sini nanti kita akan menambahkan Footer */}
      </body>
    </html>
  );
}

