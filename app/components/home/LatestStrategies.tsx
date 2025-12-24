import { PostCard } from "@/app/components/cards";
import { BookOpenIcon } from "@/app/components/icons";
import { FirestoreDocument, Post } from "@/lib/types";

interface LatestStrategiesProps {
  posts: FirestoreDocument<Post>[];
}

/**
 * Helper function untuk format statistik
 */
function formatPostStats(likes: number, createdAt: Date): string {
  const now = new Date();
  const createdDate = createdAt instanceof Date ? createdAt : new Date(createdAt);
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
  // Jika tidak ada postingan
  if (!posts || posts.length === 0) {
    return (
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4 px-1">
          <BookOpenIcon className="h-5 w-5 text-coc-gold" />
          <h2 className="text-lg md:text-xl font-clash text-white tracking-wide">Strategi & Tips</h2>
        </div>
        <div className="w-full p-8 rounded-2xl bg-coc-stone-light/30 border border-white/5 text-center backdrop-blur-sm">
          <p className="text-gray-400 text-sm">Belum ada strategi terbaru yang dipublikasikan.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="animate-fade-in mb-8">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-4 px-1">
        <h2 className="flex items-center gap-2 text-lg md:text-xl font-clash text-white tracking-wide">
          <BookOpenIcon className="h-5 w-5 text-coc-gold" />
          Strategi & Tips
        </h2>
        <a href="/knowledge-hub" className="text-xs text-coc-gold hover:text-white transition-colors font-bold uppercase tracking-wider">
          Lihat Semua
        </a>
      </div>

      {/* [SCROLL CONTAINER]
        Sama dengan RecommendedTeams, menggunakan teknik negative margin (-mx-4)
        agar konten menyentuh tepi layar di mobile.
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
              style={{ animationDelay: `${index * 100 + 200}ms` }} // Sedikit delay agar muncul setelah RecommendedTeams
            >
              <div className="h-full transition-transform hover:-translate-y-1 duration-300">
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