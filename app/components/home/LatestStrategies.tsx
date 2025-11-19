import { PostCard } from "@/app/components/cards";
import { BookOpenIcon } from "@/app/components/icons";
import CarouselSection from "@/app/components/layout/CarouselSection";
import { FirestoreDocument, Post } from "@/lib/types";

// Tipe untuk props yang diterima dari app/page.tsx
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
    timeAgo = "1 Hari Lalu";
  } else if (diffInDays < 7) {
    timeAgo = `${diffInDays} Hari Lalu`;
  } else if (diffInDays < 30) {
    timeAgo = `${Math.floor(diffInDays / 7)} Minggu Lalu`;
  } else {
    timeAgo = `${Math.floor(diffInDays / 30)} Bulan Lalu`;
  }

  const formattedLikes =
    likes > 999 ? `${(likes / 1000).toFixed(1)}K Likes` : `${likes} Likes`;

  return `${formattedLikes} | ${timeAgo}`;
}

/**
 * Helper function untuk mencari tag TH dari array tags
 */
function findThTag(tags: string[]): string {
  if (!tags || !Array.isArray(tags)) return "#?";
  const thTag = tags.find((tag) => tag.startsWith("TH"));
  return thTag ? `#${thTag}` : "#Strategies";
}

/**
 * Komponen LatestStrategies
 */
export default function LatestStrategies({ posts }: LatestStrategiesProps) {
  // Tampilkan pesan jika tidak ada postingan
  if (!posts || posts.length === 0) {
    return (
      <CarouselSection
        title="Strategi & Tips"
        icon={<BookOpenIcon className="inline-block h-6 w-6 text-coc-gold" />}
      >
        <div className="p-6 bg-coc-stone-light/50 text-gray-400 rounded-lg border border-white/5 text-center w-[280px] sm:w-[320px]">
          Belum ada strategi terbaru yang dipublikasikan.
        </div>
      </CarouselSection>
    );
  }

  return (
    <CarouselSection
      title="Strategi & Tips"
      icon={<BookOpenIcon className="inline-block h-6 w-6 text-coc-gold" />}
    >
      {posts.map((post) => {
        const stats = formatPostStats(
          post.likes?.length || 0,
          post.createdAt
        );

        const thCategory = findThTag(post.tags);

        return (
          <div key={post.id} className="snap-center h-full">
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
    </CarouselSection>
  );
}