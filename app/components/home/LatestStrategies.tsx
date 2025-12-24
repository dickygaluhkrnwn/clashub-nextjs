'use client';

import { PostCard } from "@/app/components/cards";
import { BookOpenIcon } from "@/app/components/icons";
import { FirestoreDocument, Post } from "@/lib/types";
import { useLanguage } from "@/lib/hooks/useLanguage";

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
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4 px-1">
          <h2 className="flex items-center gap-2 text-lg md:text-xl font-clash text-white tracking-wide drop-shadow-md">
            <BookOpenIcon className="h-5 w-5 md:h-6 md:w-6 text-coc-gold drop-shadow-md" />
            {t.home?.latestStrategies || "Strategi & Tips"}
          </h2>
        </div>
        <div className="w-full p-8 rounded-2xl bg-black/20 border border-white/5 text-center backdrop-blur-sm">
          <p className="text-gray-400 text-sm">Belum ada strategi terbaru yang dipublikasikan.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-in mb-8">
      {/* Header Section - Style Konsisten dengan QuickLinks */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="flex items-center gap-2 text-lg md:text-xl font-clash text-white tracking-wide drop-shadow-md">
          <BookOpenIcon className="h-5 w-5 md:h-6 md:w-6 text-coc-gold drop-shadow-md" />
          {t.home?.latestStrategies || "Strategi & Tips"}
        </h2>
        <a href="/knowledge-hub" className="text-xs text-coc-gold hover:text-white transition-colors font-bold uppercase tracking-wider">
          {t.common?.viewAll || "Lihat Semua"}
        </a>
      </div>

      {/* [SCROLL CONTAINER]
        Menggunakan teknik negative margin (-mx-4) agar konten menyentuh tepi layar di mobile.
      */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:scrollbar-thin custom-scrollbar">
        {posts.map((post, index) => {
          const stats = formatPostStats(
            post.likes?.length || 0,
            post.createdAt
          );
          const thCategory = findThTag(post.tags);

          return (
            <div 
              key={post.id} 
              className="snap-center shrink-0 w-[280px] md:w-[320px] first:pl-0 last:pr-4"
              // Stagger effect: item muncul berurutan dengan delay
              style={{ animationDelay: `${index * 100}ms` }} 
            >
              <div className="h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-lg rounded-2xl">
                <PostCard
                  title={post.title}
                  category={thCategory}
                  tag={post.category}
                  stats={stats}
                  author={post.authorName || "ClashHub User"}
                  href={`/knowledge-hub/${post.id}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}