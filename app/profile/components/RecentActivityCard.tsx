'use client';

import React from 'react';
import Link from 'next/link';
import { PostCard } from '@/app/components/cards';
import { UserProfile, Post, FirestoreDocument } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { FileTextIcon, ArrowRightIcon, PlusIcon } from '@/app/components/icons';

interface RecentActivityCardProps {
  recentPosts: FirestoreDocument<Post>[];
  userProfile: UserProfile;
}

/**
 * Komponen Card "Aktivitas Terbaru".
 * Desain: Glassmorphism dengan integrasi PostCard.
 */
export const RecentActivityCard = ({
  recentPosts,
  userProfile,
}: RecentActivityCardProps) => {
  const { t } = useLanguage();

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex justify-between items-center mb-6 relative z-10 border-b border-white/5 pb-4">
        <h2 className="flex items-center gap-2 font-clash text-lg text-white">
          <FileTextIcon className="h-5 w-5 text-coc-blue" /> {t.recentActivity.title}
        </h2>
        {recentPosts.length > 0 && (
           <Link
             href="/knowledge-hub"
             className="text-xs text-coc-blue hover:text-white flex items-center gap-1 transition-colors"
           >
             {t.recentActivity.viewAllPosts} <ArrowRightIcon className="h-3 w-3" />
           </Link>
        )}
      </div>

      <div className="space-y-4 relative z-10">
        {recentPosts.length > 0 ? (
          <div className="grid gap-4">
            {recentPosts.map((post) => (
              <PostCard
                key={post.id}
                title={post.title}
                category={post.category}
                tag={post.tags[0] || 'Diskusi'}
                stats={`${post.replies} ${t.recentActivity.replies} • ${
                  Array.isArray(post.likes) ? post.likes.length : 0
                } ${t.recentActivity.likes}`}
                href={`/knowledge-hub/${post.id}`}
                author={userProfile.displayName}
                // Pastikan PostCard Anda mendukung className tambahan atau wrapper style
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 flex flex-col items-center">
            <FileTextIcon className="h-10 w-10 text-gray-600 mb-3" />
            <p className="text-gray-400 text-sm mb-4 max-w-xs mx-auto">
              {t.recentActivity.noPosts}
            </p>
            <Link href="/knowledge-hub/create">
              <button className="flex items-center gap-2 px-4 py-2 bg-coc-blue/10 hover:bg-coc-blue/20 text-coc-blue border border-coc-blue/30 rounded-lg transition-all text-sm font-bold">
                <PlusIcon className="h-4 w-4" /> {t.recentActivity.createFirstPost}
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};