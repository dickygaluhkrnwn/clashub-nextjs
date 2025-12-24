'use client';

import React from 'react';
import Link from 'next/link';
import { StarIcon, UserIcon } from '@/app/components/icons';
import { ClanReview, FirestoreDocument } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface ClanReviewsCardProps {
  clanReviews: FirestoreDocument<ClanReview>[];
}

/**
 * @component ClanReviewsCard
 * Menampilkan ulasan klan dengan gaya testimonial card modern.
 */
export const ClanReviewsCard = ({ clanReviews }: ClanReviewsCardProps) => {
  const { t } = useLanguage();

  const formatReviewDate = (date: any): string => {
    try {
      const d = (date && typeof date._seconds === 'number') 
        ? new Date(date._seconds * 1000) 
        : new Date(date);
        
      return d.toLocaleDateString('id-ID', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h2 className="text-xl md:text-2xl font-clash text-white flex items-center gap-2">
            <StarIcon className="h-6 w-6 text-coc-gold" /> 
            {t.clanReviewsCard.title}
        </h2>
        {/* Indikator jumlah ulasan */}
        <span className="text-sm font-bold text-gray-500 bg-white/5 px-2 py-1 rounded">
            {clanReviews.length}
        </span>
      </div>

      {clanReviews.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/5 border-dashed">
            <StarIcon className="h-12 w-12 text-gray-600 mx-auto mb-3 opacity-30" />
            <p className="text-gray-400 text-sm">Belum ada ulasan untuk klan ini.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clanReviews.map((review) => (
            <div
              key={review.id}
              className="p-5 rounded-2xl bg-gradient-to-br from-[#252525] to-[#1a1a1a] border border-white/5 hover:border-coc-gold/20 transition-all hover:-translate-y-1 shadow-lg"
            >
              {/* Header Ulasan: Author & Rating */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-coc-gold/10 flex items-center justify-center border border-coc-gold/20 text-coc-gold">
                        <UserIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <Link
                            href={`/player/${review.authorUid}`}
                            className="font-bold text-white text-sm hover:text-coc-gold transition-colors block"
                        >
                            {review.authorName}
                        </Link>
                        <p className="text-[10px] text-gray-500 font-mono">
                            {formatReviewDate(review.createdAt)}
                        </p>
                    </div>
                </div>
                
                {/* Star Rating Badge */}
                <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-lg border border-white/5">
                    <span className="text-coc-gold font-bold text-sm">{review.rating.toFixed(1)}</span>
                    <StarIcon className="h-3 w-3 fill-coc-gold text-coc-gold" />
                </div>
              </div>

              {/* Isi Komentar */}
              <div className="relative">
                <span className="absolute -top-2 -left-1 text-4xl text-white/5 font-serif leading-none">“</span>
                <p className="text-sm text-gray-300 leading-relaxed pl-2 relative z-10 line-clamp-3">
                    {review.comment}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};