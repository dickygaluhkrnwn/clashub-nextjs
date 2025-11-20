'use client';

import React from 'react';
import Link from 'next/link';
import { PostCard } from '@/app/components/cards';
import { UserProfile, Post, FirestoreDocument } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]

interface RecentActivityCardProps {
  recentPosts: FirestoreDocument<Post>[];
  userProfile: UserProfile;
}

/**
 * Komponen Card untuk menampilkan "Aktivitas Terbaru" (postingan) di halaman profil.
 */
export const RecentActivityCard = ({
  recentPosts,
  userProfile,
}: RecentActivityCardProps) => {
  const { t } = useLanguage(); // [BARU]

  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-4 font-clash text-2xl text-white border-b border-coc-gold-dark/30 pb-2">
        {/* [TERJEMAHAN] */}
        {t.recentActivity.title}
      </h2>
      <div className="space-y-4">
        {recentPosts.length > 0 ? (
          <>
            {recentPosts.map((post) => (
              <PostCard
                key={post.id}
                title={post.title}
                category={post.category}
                tag={post.tags[0] || 'Diskusi'}
                // [PERBAIKAN BUG & TERJEMAHAN]
                stats={`${post.replies} ${t.recentActivity.replies} | ${
                  Array.isArray(post.likes) ? post.likes.length : 0
                } ${t.recentActivity.likes}`}
                href={`/knowledge-hub/${post.id}`}
                author={userProfile.displayName}
              />
            ))}
            <div className="text-center pt-4">
              <Link
                href="/knowledge-hub" // Nanti ini bisa difilter ke postingan user
                className="text-sm text-coc-gold hover:underline"
              >
                {/* [TERJEMAHAN] */}
                {t.recentActivity.viewAllPosts} &rarr;
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400">
              {/* [TERJEMAHAN] */}
              {t.recentActivity.noPosts}
            </p>
            <Link
              href="/knowledge-hub/create"
              className="text-sm text-coc-gold hover:underline mt-2 inline-block"
            >
              {/* [TERJEMAHAN] */}
              {t.recentActivity.createFirstPost} &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};