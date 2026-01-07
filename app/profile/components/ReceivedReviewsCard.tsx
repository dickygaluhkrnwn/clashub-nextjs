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
 * Desain: Gaming Testimonial Cards dengan gaya chat log elit.
 */
export const ReceivedReviewsCard = ({
  playerReviews,
}: ReceivedReviewsCardProps) => {
  const { t } = useLanguage();

  return (
    <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-coc-gold/5 rounded-full blur-[80px] pointer-events-none group-hover:bg-coc-gold/10 transition-all duration-700" />

      {/* Header - White Text + Shadow */}
      <h2 className="mb-6 flex items-center gap-3 font-clash text-lg text-white relative z-10 uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
        <div className="p-1.5 bg-coc-gold/10 rounded-lg border border-coc-gold/20 shadow-[0_0_10px_rgba(255,215,0,0.3)]">
            <StarIcon className="h-5 w-5 text-coc-gold" /> 
        </div>
        <span>
            {t.profileReviews.title}
        </span>
      </h2>

      <div className="space-y-4 relative z-10">
        {playerReviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center justify-center gap-3">
            <StarIcon className="w-10 h-10 opacity-20" />
            <p className="text-sm font-medium">{t.profileReviews.empty}</p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4">
            {playerReviews.map((review) => (
              <li
                key={review.id}
                className="relative bg-[#0f1115] border border-white/5 hover:border-coc-gold/30 hover:bg-white/5 rounded-xl p-5 transition-all duration-300 group/item overflow-hidden shadow-sm hover:shadow-md"
              >
                {/* Quote Icon Background */}
                <div className="absolute top-2 right-4 opacity-5 group-hover/item:opacity-10 transition-opacity">
                  <QuoteIcon className="h-12 w-12 text-white transform rotate-180" />
                </div>

                {/* Header: User & Rating */}
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1d26] to-[#0a0a0b] border border-white/10 flex items-center justify-center shadow-inner">
                      <UserIcon className="h-5 w-5 text-gray-400 group-hover/item:text-coc-gold transition-colors" />
                    </div>
                    <div>
                        <span className="font-bold text-white font-clash tracking-wide block leading-tight group-hover/item:text-coc-gold transition-colors">
                          {review.authorName}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                            Verified Reviewer
                        </span>
                    </div>
                  </div>
                  
                  {/* Rating Badge */}
                  <div className="flex items-center gap-1 bg-coc-gold/10 px-2.5 py-1 rounded-lg border border-coc-gold/20 shadow-[0_0_10px_rgba(255,215,0,0.1)]">
                    <span className="font-bold text-coc-gold text-sm font-clash">
                      {review.rating.toFixed(1)}
                    </span>
                    <StarIcon className="h-3.5 w-3.5 text-coc-gold fill-current drop-shadow-sm" />
                  </div>
                </div>

                {/* Comment */}
                <p className="text-sm text-gray-300 italic leading-relaxed mb-4 pl-3 border-l-2 border-white/10 group-hover/item:border-coc-gold/50 transition-colors relative z-10">
                  "{review.comment}"
                </p>

                {/* Footer: Context & Date */}
                <div className="flex items-center justify-between text-[10px] uppercase font-bold text-gray-500 border-t border-white/5 pt-3 mt-1 relative z-10">
                  <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/5 border border-white/5 text-gray-400 group-hover/item:text-gray-300 transition-colors">
                        {t.profileReviews.context}: <span className="text-coc-blue">{review.reviewContext}</span>
                      </span>
                  </div>
                  <span className="font-mono tracking-tight opacity-70">
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