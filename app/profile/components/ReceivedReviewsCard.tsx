'use client';

import React from 'react';
import { StarIcon, UserIcon, QuoteIcon } from '@/app/components/icons';
import { PlayerReview, FirestoreDocument } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface ReceivedReviewsCardProps {
  playerReviews: FirestoreDocument<PlayerReview>[];
}

/**
 * Komponen Card "Ulasan Diterima".
 * Desain: Glassmorphism List dengan Quote styling.
 */
export const ReceivedReviewsCard = ({
  playerReviews,
}: ReceivedReviewsCardProps) => {
  const { t } = useLanguage();

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl pointer-events-none" />

      <h2 className="mb-6 flex items-center gap-2 font-clash text-lg text-white relative z-10">
        <StarIcon className="h-5 w-5 text-coc-gold" /> {t.profileReviews.title}
      </h2>

      <div className="space-y-4 relative z-10">
        {playerReviews.length === 0 ? (
          <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5">
            <StarIcon className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">
              {t.profileReviews.empty}
            </p>
          </div>
        ) : (
          <ul className="space-y-4">
            {playerReviews.map((review) => (
              <li
                key={review.id}
                className="p-5 bg-white/5 rounded-xl border border-white/5 hover:border-coc-gold/30 hover:bg-white/10 transition-all duration-300 relative group"
              >
                {/* Quote Icon Background */}
                <div className="absolute top-4 right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <QuoteIcon className="h-8 w-8 text-white" />
                </div>

                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-coc-gold/20 flex items-center justify-center text-coc-gold">
                      <UserIcon className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-white font-clash tracking-wide">
                      {review.authorName}
                    </span>
                  </div>
                  <div className="flex items-center bg-coc-gold/10 px-2 py-1 rounded-lg border border-coc-gold/20">
                    <span className="font-bold text-coc-gold mr-1">
                      {review.rating.toFixed(1)}
                    </span>
                    <StarIcon className="h-3.5 w-3.5 text-coc-gold fill-current" />
                  </div>
                </div>

                <p className="text-sm text-gray-300 italic leading-relaxed mb-3 pl-2 border-l-2 border-coc-gold/30">
                  "{review.comment}"
                </p>

                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-500 border-t border-white/5 pt-3 mt-2">
                  <span className="bg-white/5 px-2 py-0.5 rounded">
                    {t.profileReviews.context}: {review.reviewContext}
                  </span>
                  <span>
                    {new Date(
                      (review.createdAt as any)._seconds * 1000 || 
                      review.createdAt
                    ).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};