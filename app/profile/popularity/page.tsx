// File: app/profile/popularity/page.tsx
import React from 'react';
import PopularityClient from './PopularityClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Poin Popularitas | Clashub',
  description: 'Lihat detail poin popularitas (Banana Points) dan badge Anda.',
};

export default function PopularityPage() {
  return (
    <main className="container mx-auto max-w-5xl px-4 py-8 md:py-12">
      <PopularityClient />
    </main>
  );
}