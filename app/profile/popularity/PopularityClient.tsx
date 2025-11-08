// File: app/profile/popularity/PopularityClient.tsx
// Deskripsi: Komponen client-side untuk menampilkan sistem Poin Popularitas (Banana Points).

'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/app/context/AuthContext';
// [PERBAIKAN] Impor TrophyIcon dan ChevronLeftIcon dari barrel file utama
import { TrophyIcon, ChevronLeftIcon } from '@/app/components/icons';
// Impor ProfileLoading dari path relatif yang benar
import { ProfileLoading } from '../components/ProfileLoading';

// [PERUBAHAN] Impor logika TIERS dan getTierForPoints dari file utilitas baru
import {
  TIERS,
  getTierForPoints,
  PopularityTier,
} from '@/lib/popularity-utils';

// [DIHAPUS] Logika Tiers dan helper getTierForPoints dipindahkan ke lib/popularity-utils.ts
// interface PopularityTier { ... }
// const TIERS: PopularityTier[] = [ ... ];
// const getTierForPoints = (points: number): PopularityTier => { ... };

/**
 * Komponen Client-Side Utama
 */
const PopularityClient = () => {
  const { userProfile, loading } = useAuth();

  if (loading) {
    return <ProfileLoading />; // Tampilkan loading spinner
  }

  if (!userProfile) {
    return (
      <div className="card-stone text-center p-8">
        <h1 className="text-2xl font-clash text-coc-red">Error</h1>
        <p className="text-gray-300">
          Gagal memuat profil pengguna. Silakan coba login kembali.
        </p>
      </div>
    );
  }

  // Tentukan poin dan tier saat ini
  const currentPoints = userProfile.popularityPoints || 0;
  const currentTier = getTierForPoints(currentPoints);

  return (
    <div className="card-stone p-6 md:p-8 rounded-lg">
      <Link
        href="/profile"
        className="inline-flex items-center text-coc-gold hover:underline text-sm mb-4"
      >
        <ChevronLeftIcon className="h-4 w-4 mr-1" />
        Kembali ke Profil
      </Link>

      <h1 className="font-clash text-3xl md:text-4xl text-white border-b border-coc-gold-dark/30 pb-3 mb-6">
        Poin Popularitas
      </h1>

      {/* Status Saat Ini */}
      <section className="mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-coc-stone-light p-5 rounded-lg border border-coc-gold-dark/30">
            <p className="text-sm font-semibold text-gray-400 uppercase mb-1">
              Poin Anda Saat Ini
            </p>
            <p className="font-clash text-5xl text-white">{currentPoints}</p>
          </div>
          <div className="bg-coc-stone-light p-5 rounded-lg border border-coc-gold-dark/30">
            <p className="text-sm font-semibold text-gray-400 uppercase mb-1">
              Pangkat Anda
            </p>
            <div
              className={`flex items-center gap-2 font-clash text-3xl ${currentTier.colorClass}`}
            >
              <TrophyIcon className="h-8 w-8" fill="currentColor" />
              <span>{currentTier.name}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Daftar Semua Pangkat */}
      <section className="mb-8">
        <h2 className="font-clash text-2xl text-white mb-4">Semua Pangkat</h2>
        <div className="space-y-3">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`card-stone-light p-4 rounded-lg flex items-center gap-4 ${
                tier.name === currentTier.name
                  ? 'border-2 border-coc-gold' // Sorot tier saat ini
                  : 'border border-coc-gold-dark/20'
              }`}
            >
              <TrophyIcon
                className={`h-10 w-10 flex-shrink-0 ${tier.colorClass}`}
                fill="currentColor"
              />
              <div className="flex-grow">
                <h3 className={`font-clash text-lg ${tier.colorClass}`}>
                  {tier.name}
                </h3>
                <p className="text-sm text-gray-400">
                  Membutuhkan {tier.minPoints} Poin
                </p>
              </div>
              {tier.name === currentTier.name && (
                <span className="text-xs font-bold text-coc-gold bg-coc-gold/20 px-3 py-1 rounded-full">
                  PANGKAT ANDA
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Cara Mendapatkan Poin */}
      <section>
        <h2 className="font-clash text-2xl text-white mb-4">
          Cara Mendapatkan Poin
        </h2>
        <div className="prose prose-invert prose-sm text-gray-300 max-w-none">
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>+5 Poin:</strong> Membuat postingan baru di Knowledge Hub.
            </li>
            <li>
              <strong>-5 Poin:</strong> Menghapus postingan dalam waktu 24 jam
              setelah dibuat.
            </li>
            <li>
              <strong>(Segera):</strong> Menerima "Like" pada postingan Anda.
            </li>
            <li>
              <strong>(Segera):</strong> Memberikan ulasan (review) yang
              bermanfaat.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
};

export default PopularityClient;