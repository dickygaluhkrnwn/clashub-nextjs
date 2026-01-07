'use client';

import { PostCard } from "@/app/components/cards";
import { BookOpenIcon } from "@/app/components/icons";
import { FirestoreDocument, Post } from "@/lib/types";
import { useLanguage } from "@/lib/hooks/useLanguage";
import Link from 'next/link';

interface LatestStrategiesProps {
  posts: FirestoreDocument<Post>[];
}

/**
 * Helper function untuk format statistik
 * Menangani Date, Timestamp, atau String
 */
function formatPostStats(likes: number, createdAt: any): string {
  const now = new Date();
  
  // Handle Firestore Timestamp (.toDate()) atau Date biasa
  const createdDate = 
    createdAt && typeof createdAt.toDate === 'function' 
      ? createdAt.toDate() 
      : new Date(createdAt || now);

  const diffInMs = now.getTime() - createdDate.getTime();
  const diffInDays = Math.max(0, Math.floor(diffInMs / (1000 * 60 * 60 * 24)));

  let timeAgo = "";
  if (diffInDays === 0) {
    timeAgo = "Hari Ini";
  } else if (diffInDays === 1) {
    timeAgo = "Kemarin";
  } else if (diffInDays < 7) {
    timeAgo = `${diffInDays} Hari Lalu`;
  } else if (diffInDays < 30) {
    timeAgo = `${Math.floor(diffInDays / 7)} Minggu Lalu`;
  } else {
    timeAgo = `${Math.floor(diffInDays / 30)} Bulan Lalu`;
  }

  const formattedLikes =
    likes > 999 ? `${(likes / 1000).toFixed(1)}K Likes` : `${likes} Likes`;

  return `${formattedLikes} • ${timeAgo}`;
}

/**
 * Helper function untuk mencari tag TH dari array tags
 */
function findThTag(tags: string[]): string {
  if (!tags || !Array.isArray(tags)) return "#Strategies";
  const thTag = tags.find((tag) => tag.startsWith("TH"));
  return thTag ? `#${thTag}` : "#Strategies";
}

export default function LatestStrategies({ posts }: LatestStrategiesProps) {
  const { t } = useLanguage();

  // Jika tidak ada postingan
  if (!posts || posts.length === 0) {
    return (
      <section className="mb-12 relative w-full">
        <div className="relative z-10 flex items-center gap-3 mb-6 px-1 pl-4 md:pl-0">
           <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <div className="text-purple-400 drop-shadow-md">
                <BookOpenIcon className="h-6 w-6" />
              </div>
           </div>
           <h2 className="text-xl md:text-2xl font-clash font-bold text-white tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {t.home?.latestStrategies || "Strategi & Tips"}
           </h2>
        </div>

        <div className="w-full p-8 rounded-2xl bg-[#15171e]/80 border border-white/5 text-center backdrop-blur-sm flex flex-col items-center justify-center gap-4">
          <BookOpenIcon className="h-12 w-12 text-gray-600 opacity-50" />
          <p className="text-gray-400 text-sm">Belum ada strategi terbaru yang dipublikasikan.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12 relative w-full group">
      {/* Header Section */}
      <div className="relative z-10 flex items-center justify-between gap-3 mb-6 px-1 pl-4 md:pl-0">
         <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <BookOpenIcon className="h-6 w-6 text-purple-400 drop-shadow-md" />
             </div>
             <h2 className="text-xl md:text-2xl font-clash font-bold text-white tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {t.home?.latestStrategies || "Strategi & Tips"}
             </h2>
         </div>
         
         <Link 
            href="/knowledge-hub" 
            className="text-xs text-coc-gold hover:text-white transition-colors font-bold uppercase tracking-wider flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
         >
            {t.common?.viewAll || "Lihat Semua"} <span className="text-[10px] ml-1">▶</span>
         </Link>
      </div>

      {/* Scroll Container */}
      <div className="relative">
        {/* [REVISI] Shadow/Fade Edges dihapus agar tampilan mobile lebih bersih */}
        
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 pt-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin scrollbar-thumb-coc-gold/20 scrollbar-track-transparent hover:scrollbar-thumb-coc-gold/50">
          {posts.map((post, index) => {
            const stats = formatPostStats(
              post.likes?.length || 0,
              post.createdAt
            );
            const thCategory = findThTag(post.tags);

            return (
              <div 
                key={post.id} 
                className="snap-center shrink-0 w-[280px] md:w-[320px] h-[240px]"
                style={{ animationDelay: `${index * 100}ms` }} 
              >
                 <PostCard
                    title={post.title}
                    category={thCategory}
                    tag={post.category}
                    stats={stats}
                    author={post.authorName || "ClashHub User"}
                    href={`/knowledge-hub/${post.id}`}
                  />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}