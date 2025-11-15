import { PostCard } from "@/app/components/cards";
import { BookOpenIcon } from "@/app/components/icons";
import CarouselSection from "@/app/components/layout/CarouselSection";
// [BARU] Impor tipe data Post
import { FirestoreDocument, Post } from "@/lib/types";

// [DIHAPUS] Data statis sementara

// [BARU] Tipe untuk props yang diterima dari app/page.tsx
interface LatestStrategiesProps {
  posts: FirestoreDocument<Post>[];
}

/**
 * [PERBAIKAN] Helper function diubah untuk menerima 'likes' (bukan 'views')
 * Mengubah data (misal: 1200, DateObject) menjadi string (misal: "1.2K Likes | 2 Hari Lalu")
 */
function formatPostStats(likes: number, createdAt: Date): string {
  const now = new Date();
  // Pastikan createdAt adalah objek Date yang valid
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

  // [PERBAIKAN] Mengganti "Views" menjadi "Likes"
  const formattedLikes =
    likes > 999 ? `${(likes / 1000).toFixed(1)}K Likes` : `${likes} Likes`;

  return `${formattedLikes} | ${timeAgo}`;
}

/**
 * [BARU] Helper function untuk mencari tag TH dari array tags
 */
function findThTag(tags: string[]): string {
  if (!tags) return "#?";
  const thTag = tags.find((tag) => tag.startsWith("TH"));
  // Menambahkan prefix # untuk konsistensi tampilan
  return thTag ? `#${thTag}` : "#?";
}

/**
 * [PERBAIKAN] Komponen sekarang menerima 'posts' sebagai props
 */
export default function LatestStrategies({ posts }: LatestStrategiesProps) {
  // [BARU] Tampilkan pesan jika tidak ada postingan
  if (!posts || posts.length === 0) {
    return (
      <CarouselSection
        // [PERBAIKAN JUDUL] Diubah sesuai permintaan
        title="Strategi & Tips"
        icon={<BookOpenIcon className="inline-block h-6 w-6" />}
      >
        <div className="p-4 bg-coc-stone-light/50 text-gray-400 rounded-lg col-span-full">
          Belum ada strategi terbaru yang dipublikasikan.
        </div>
      </CarouselSection>
    );
  }

  return (
    <CarouselSection
      // [PERBAIKAN JUDUL] Diubah sesuai permintaan
      title="Strategi & Tips"
      icon={<BookOpenIcon className="inline-block h-6 w-6" />}
    >
      {/* [PERBAIKAN] Me-render 'posts' dari props, bukan data statis */}
      {posts.map((post) => {
        // [PERBAIKAN] Buat stats dari post.likes.length, bukan post.viewCount
        const stats = formatPostStats(
          post.likes?.length || 0, // Fallback jika likes undefined
          post.createdAt, // createdAt sudah dikonversi oleh docToDataAdmin
        );

        // [PERBAIKAN] Cari tag TH dari post.tags
        const thCategory = findThTag(post.tags);

        return (
          <PostCard
            key={post.id}
            title={post.title}
            // [PERBAIKAN] 'category' (kartu) diisi dari tag TH
            category={thCategory}
            // [PERBAIKAN] 'tag' (kartu) diisi dari kategori postingan
            tag={post.category}
            stats={stats}
            author={post.authorName || "ClashHub User"} // Fallback jika authorName tdk ada
            href={`/knowledge-hub/${post.id}`}
          />
        );
      })}
    </CarouselSection>
  );
}