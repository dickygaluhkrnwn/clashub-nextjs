// File: app/clan/internal/components/ClanReviewsCard.tsx
// Deskripsi: [BARU - Fase 4.3] Komponen (Client) untuk menampilkan
//            daftar ulasan yang diterima oleh sebuah klan.

'use client';

import React from 'react';
import Link from 'next/link';
import { StarIcon } from '@/app/components/icons';
import { ClanReview, FirestoreDocument } from '@/lib/types';

interface ClanReviewsCardProps {
  clanReviews: FirestoreDocument<ClanReview>[];
}

/**
 * @component ClanReviewsCard
 * Komponen Card untuk menampilkan "Ulasan Diterima" di halaman profil klan.
 */
export const ClanReviewsCard = ({ clanReviews }: ClanReviewsCardProps) => {
  /**
   * Helper untuk memformat timestamp Firestore atau objek Date.
   */
  const formatReviewDate = (date: any): string => {
    try {
      // Cek jika ini format Timestamp Firestore (dari server-side props)
      if (date && typeof date._seconds === 'number') {
        return new Date(date._seconds * 1000).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
      // Fallback jika sudah berupa objek Date atau ISO string (dari client-side)
      return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Tanggal tidak valid';
    }
  };

  return (
    <div className="card-stone p-6 rounded-lg">
      {/* Judul Card */}
      <h2 className="mb-4 flex items-center gap-2 font-clash text-2xl text-white border-b border-coc-gold-dark/30 pb-2">
        <StarIcon className="h-6 w-6 text-coc-gold" /> Ulasan Klan
      </h2>

      {/* Konten Card */}
      <div className="space-y-4">
        {clanReviews.length === 0 ? (
          // Pesan jika tidak ada ulasan
          <p className="text-gray-400 text-sm">
            Klan ini belum menerima ulasan dari mantan anggota.
          </p>
        ) : (
          // Daftar Ulasan
          <ul className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {clanReviews.map((review) => (
              <li
                key={review.id}
                className="p-4 bg-coc-stone/50 rounded-md border border-coc-gold-dark/30"
              >
                {/* Header Ulasan (Nama Author & Rating) */}
                <div className="flex justify-between items-center mb-2">
                  <Link
                    href={`/player/${review.authorUid}`}
                    className="font-semibold text-white hover:text-coc-gold hover:underline"
                  >
                    {review.authorName}
                  </Link>
                  <span className="flex items-center text-coc-gold font-bold">
                    {review.rating.toFixed(1)}{' '}
                    <StarIcon className="h-4 w-4 ml-1 fill-coc-gold" />
                  </span>
                </div>

                {/* Isi Komentar */}
                <p className="text-sm text-gray-300 italic">
                  "{review.comment}"
                </p>

                {/* Tanggal Ulasan */}
                <p className="text-xs text-gray-500 mt-2">
                  {formatReviewDate(review.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};