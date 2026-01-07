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
 * Desain: Gaming Hub dengan integrasi PostCard yang seamless.
 */
export const RecentActivityCard = ({
  recentPosts,
  userProfile,
}: RecentActivityCardProps) => {
  const { t } = useLanguage();

  return (
    <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-xl relative overflow-hidden group">
      {/* Decorative Glow (Blue/Intellect theme) */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700" />

      {/* Header */}
      <div className="flex justify-between items-center mb-6 relative z-10 border-b border-white/5 pb-4">
        <h2 className="flex items-center gap-3 font-clash text-lg text-white uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          <div className="p-1.5 bg-blue-500/10 rounded-lg border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.3)]">
             <FileTextIcon className="h-5 w-5 text-blue-400" /> 
          </div>
          <span>{t.recentActivity.title}</span>
        </h2>
        
        {recentPosts.length > 0 && (
           <Link
             href="/knowledge-hub"
             className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group/link"
           >
             <span className="text-xs text-gray-400 group-hover/link:text-white font-medium">{t.recentActivity.viewAllPosts}</span>
             <ArrowRightIcon className="h-3 w-3 text-gray-500 group-hover/link:text-white transition-colors" />
           </Link>
        )}
      </div>

      <div className="space-y-4 relative z-10">
        {recentPosts.length > 0 ? (
          <div className="grid gap-4">
            {recentPosts.map((post) => (
              // Wrapper untuk memberikan efek hover translation yang gaming
              <div key={post.id} className="transform transition-transform hover:-translate-y-1 duration-300">
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
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-[#0f1115] rounded-xl border border-white/5 relative overflow-hidden">
            {/* Empty State Background */}
            <div className="absolute inset-0 bg-blue-500/5 opacity-50" />
            
            <div className="p-4 bg-[#1a1d26] rounded-full border border-white/5 shadow-inner mb-3 relative z-10">
               <FileTextIcon className="h-8 w-8 text-gray-600" />
            </div>
            
            <p className="text-gray-400 text-sm mb-5 max-w-xs mx-auto text-center relative z-10">
              {t.recentActivity.noPosts}
            </p>
            
            <Link href="/knowledge-hub/create" className="relative z-10">
              <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 rounded-xl transition-all text-sm font-bold shadow-lg shadow-blue-900/20 hover:shadow-blue-500/20 active:scale-95">
                <PlusIcon className="h-4 w-4" /> 
                {t.recentActivity.createFirstPost}
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};