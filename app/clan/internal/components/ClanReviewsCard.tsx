'use client';

import React from 'react';
import Link from 'next/link';
import { StarIcon } from '@/app/components/icons';
import { ClanReview, FirestoreDocument } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]

interface ClanReviewsCardProps {
  clanReviews: FirestoreDocument<ClanReview>[];
}

/**
 * @component ClanReviewsCard
 * Komponen Card untuk menampilkan "Ulasan Diterima" di halaman profil klan.
 */
export const ClanReviewsCard = ({ clanReviews }: ClanReviewsCardProps) => {
  const { t } = useLanguage(); // [BARU]

  const formatReviewDate = (date: any): string => {
    try {
      if (date && typeof date._seconds === 'number') {
        return new Date(date._seconds * 1000).toLocaleDateString('id-ID', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
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
      <h2 className="mb-4 flex items-center gap-2 font-clash text-2xl text-white border-b border-coc-gold-dark/30 pb-2">
        {/* [TERJEMAHAN] */}
        <StarIcon className="h-6 w-6 text-coc-gold" /> {t.clanReviewsCard.title}
      </h2>

      <div className="space-y-4">
        {clanReviews.length === 0 ? (
          <p className="text-gray-400 text-sm">
            {/* [TERJEMAHAN] */}
            {t.clanReviewsCard.empty}
          </p>
        ) : (
          <ul className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
            {clanReviews.map((review) => (
              <li
                key={review.id}
                className="p-4 bg-coc-stone/50 rounded-md border border-coc-gold-dark/30"
              >
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
                <p className="text-sm text-gray-300 italic">
                  "{review.comment}"
                </p>
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