// File: app/profile/components/ReceivedReviewsCard.tsx

'use client';

import React from 'react';
import { StarIcon } from '@/app/components/icons';
import { PlayerReview, FirestoreDocument } from '@/lib/types';

interface ReceivedReviewsCardProps {
  playerReviews: FirestoreDocument<PlayerReview>[];
}

/**
 * Komponen Card untuk menampilkan "Ulasan Diterima" di halaman profil.
 */
export const ReceivedReviewsCard = ({
  playerReviews,
}: ReceivedReviewsCardProps) => {
  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-4 flex items-center gap-2 font-clash text-2xl text-white">
        <StarIcon className="h-6 w-6 text-coc-gold" /> Ulasan Diterima
      </h2>
      <div className="space-y-4">
        {playerReviews.length === 0 ? (
          <p className="text-gray-400 text-sm">
            Anda belum menerima ulasan dari pemain lain.
          </p>
        ) : (
          <ul className="space-y-4">
            {playerReviews.map((review) => (
              <li
                key={review.id}
                className="p-4 bg-coc-stone/50 rounded-md border border-coc-gold-dark/30"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-white">
                    {review.authorName}
                  </span>
                  <span className="flex items-center text-coc-gold">
                    {review.rating.toFixed(1)}{' '}
                    <StarIcon className="h-4 w-4 ml-1" />
                  </span>
                </div>
                <p className="text-sm text-gray-300 italic">
                  "{review.comment}"
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Konteks: {review.reviewContext} |{' '}
                  {new Date(
                    (review.createdAt as any)._seconds * 1000 || // Handle Timestamp
                      review.createdAt, // Handle ISO String
                  ).toLocaleDateString('id-ID')}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};