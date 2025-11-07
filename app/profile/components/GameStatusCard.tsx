// File: app/profile/components/GameStatusCard.tsx

'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { TrophyIcon, InfoIcon } from '@/app/components/icons';
import { UserProfile } from '@/lib/types';
import { getThImage } from '@/lib/th-utils'; // [FIX] Impor getThImage

interface GameStatusCardProps {
  userProfile: UserProfile;
  isVerified: boolean;
  isClanManager: boolean;
  inGameRole: string;
  // [FIX] Hapus thImage dan validThLevel dari props
  // thImage: string;
  // validThLevel: number;
}

/**
 * Komponen Card untuk menampilkan "Status Permainan" di halaman profil.
 * Menampilkan TH, Trofi, Bintang War, Role, dan Info Klan.
 */
export const GameStatusCard = ({
  userProfile,
  isVerified,
  isClanManager,
  inGameRole,
}: GameStatusCardProps) => {
  // [FIX] Pindahkan logika kalkulasi thImage dan validThLevel ke dalam komponen
  const validThLevel =
    userProfile.thLevel &&
    !isNaN(userProfile.thLevel) &&
    userProfile.thLevel > 0
      ? userProfile.thLevel
      : 9;
  const thImage = getThImage(validThLevel);

  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-6 flex items-center gap-2 font-clash text-2xl text-white">
        <TrophyIcon className="h-6 w-6 text-coc-gold" /> Status Permainan{' '}
        {isVerified ? '(LIVE dari CoC)' : '(Data Tersimpan)'}
      </h2>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative w-36 h-36 flex items-center justify-center">
          <Image
            src={thImage}
            alt={`Town Hall ${validThLevel}`}
            width={120}
            height={120}
            sizes="(max-width: 768px) 100px, 120px"
            priority
            className="flex-shrink-0"
          />
        </div>
        <div className="flex-grow grid grid-cols-2 gap-4 text-center w-full">
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-3xl text-coc-gold font-clash">
              {validThLevel}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Level Town Hall
            </p>
          </div>
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-3xl text-coc-gold font-clash">
              {/* [FIX] Gunakan 'id-ID' locale untuk konsistensi */}
              {userProfile.trophies?.toLocaleString('id-ID') ||
                (isVerified ? 'N/A' : '0')}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Trofi Saat Ini
            </p>
          </div>
          {/* Placeholder Bintang War */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-3xl text-coc-gold font-clash">
              {/* Placeholder */} N/A
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Bintang War
            </p>
          </div>
          {/* Role CoC */}
          <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30">
            <h4 className="text-lg text-coc-gold font-clash capitalize">
              {isVerified ? inGameRole.replace('_', ' ') || 'N/A' : 'N/A'}
            </h4>
            <p className="text-xs uppercase text-gray-400 font-sans">
              Role di Klan CoC
            </p>
          </div>
          {/* Clan Tag (jika ada & terverifikasi) */}
          {isVerified && userProfile.clanTag && (
            <div className="bg-coc-stone/50 p-4 rounded-lg border border-coc-gold-dark/30 col-span-2">
              <Link
                href={
                  userProfile.clanId
                    ? `/clan/internal/${userProfile.clanId}`
                    : `/clan/${encodeURIComponent(userProfile.clanTag)}`
                }
                className="hover:opacity-80 transition-opacity block" // Jadikan block
              >
                <h4 className="text-lg text-coc-gold font-mono">
                  {userProfile.clanTag}
                </h4>
                <p className="text-xs uppercase text-gray-400 font-sans">
                  Klan CoC Saat Ini (
                  {userProfile.clanName || 'Nama Tidak Tersedia'})
                </p>
              </Link>
            </div>
          )}
        </div>
      </div>
      {/* Info Sinkronisasi (jika manager & terverifikasi) */}
      {isClanManager && isVerified && (
        <div className="mt-6 p-4 bg-coc-stone/30 rounded-lg border border-coc-gold/20">
          <p className="text-sm font-sans text-gray-300 flex items-center gap-2">
            <InfoIcon className="h-4 w-4 text-coc-gold" />
            {/* Placeholder */}
            Data Clan Terakhir Disinkronisasi:
            <span className="font-bold text-coc-gold">
              {userProfile.lastVerified
                ? new Date(userProfile.lastVerified).toLocaleString('id-ID')
                : 'Belum Pernah'}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Data ini digunakan untuk statistik dan manajemen klan Anda.
          </p>
        </div>
      )}
    </div>
  );
};