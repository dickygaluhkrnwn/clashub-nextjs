// File: app/profile/popularity/page.tsx
// Deskripsi: Halaman server-side untuk detail Poin Popularitas.

import React from 'react';
import PopularityClient from './PopularityClient';
import { Metadata } from 'next';

// Set metadata untuk halaman
export const metadata: Metadata = {
  title: 'Poin Popularitas | Clashub',
  description: 'Lihat detail poin popularitas (Banana Points) dan badge Anda.',
};

/**
 * Halaman Server Component untuk rute /profile/popularity
 * Halaman ini merender Client Component yang akan mengambil data dari AuthContext.
 */
export default function PopularityPage() {
  return (
    <main className="container mx-auto max-w-4xl px-4 py-8">
      {/* Client Component yang berisi semua logika tampilan dan state */}
      <PopularityClient />
    </main>
  );
}