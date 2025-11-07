// File: app/profile/components/RecentActivityCard.tsx

'use client';

import React from 'react';
import Link from 'next/link';
import { PostCard } from '@/app/components/cards';
import { UserProfile, Post, FirestoreDocument } from '@/lib/types';

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
  return (
    <div className="card-stone p-6 rounded-lg">
      <h2 className="mb-4 font-clash text-2xl text-white border-b border-coc-gold-dark/30 pb-2">
        Aktivitas Terbaru
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
                stats={`${post.replies} Balasan | ${post.likes} Likes`}
                href={`/knowledge-hub/${post.id}`}
                author={userProfile.displayName}
              />
            ))}
            <div className="text-center pt-4">
              <Link
                href="/knowledge-hub" // Nanti ini bisa difilter ke postingan user
                className="text-sm text-coc-gold hover:underline"
              >
                Lihat Semua Postingan Saya &rarr;
              </Link>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-gray-400">
              Anda belum memposting di Knowledge Hub.
            </p>
            <Link
              href="/knowledge-hub/create"
              className="text-sm text-coc-gold hover:underline mt-2 inline-block"
            >
              Buat Postingan Pertama Anda &rarr;
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};