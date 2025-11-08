// File: app/knowledge-hub/[postId]/page.tsx

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPostById, getUserProfile } from '@/lib/firestore';
import { Post, UserProfile } from '@/lib/clashub.types';
import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { getSessionUser, ServerUser } from '@/lib/server-auth';
// Import komponen Client Component yang baru
import PostActionButtons from './components/PostActionButtons';
// [BARU] Impor komponen ReplySection dinamis
import ReplySection from './components/ReplySection';

import {
  ArrowLeftIcon,
  StarIcon,
  EditIcon,
  BookOpenIcon,
  // UserCircleIcon, // Dihapus, karena CommentCard statis dihapus
  ClockIcon,
  // PaperPlaneIcon, // Dihapus, karena form statis dihapus
  LinkIcon,
  TrashIcon,
  CogsIcon,
  HomeIcon,
  // AlertTriangleIcon, // Tidak terpakai
  // RefreshCwIcon, // Tidak terpakai
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

// Definisikan tipe untuk parameter rute dinamis
interface PostDetailPageProps {
  params: {
    postId: string;
  };
}

// --- Komponen Renderer Konten Sederhana (tetap di sini) ---
const ContentRenderer = ({ post }: { post: Post }) => {
  const contentParts = useMemo(() => {
    return post.content.split('\n').map((line, index) => {
      // Regex untuk menemukan link base CoC
      const baseLinkRegex =
        /(https?:\/\/(link\.clashofclans\.com)\/(\S+)\/base\/(\S+))/i;
      const linkMatch = line.match(baseLinkRegex);

      if (linkMatch) {
        const fullLink = linkMatch[0];
        return (
          <a
            key={index}
            href={fullLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold hover:underline text-coc-gold"
          >
            {fullLink}
          </a>
        );
      }

      return line;
    }).map((line, index, arr) => (
      <React.Fragment key={index}>
        {line}
        {index < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  }, [post.content]);

  return (
    <div className="prose prose-invert prose-lg max-w-none text-gray-300 font-sans">
      {contentParts}
    </div>
  );
};

// --- [HAPUS] Komponen Kartu Komentar (Statis) ---
// Fungsi ini sekarang ditangani oleh ReplyItem.tsx dan ReplySection.tsx
// const CommentCard = (...) => { ... };
// --- [AKHIR HAPUS] ---

/**
 * @function generateMetadata
 * Membuat metadata dinamis untuk SEO di sisi Server.
 */
export async function generateMetadata({
  params,
}: PostDetailPageProps): Promise<Metadata> {
  const postId = params.postId;
  const post = await getPostById(postId);

  if (!post) {
    return { title: 'Postingan Tidak Ditemukan | Clashub' };
  }

  // Ambil 150 karakter pertama untuk deskripsi
  const description =
    post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '');

  return {
    title: `Clashub | ${post.title}`,
    description: description,
  };
}

/**
 * @component PostDetailPage (Server Component)
 * Menampilkan detail lengkap sebuah postingan.
 */
const PostDetailPage = async ({ params }: PostDetailPageProps) => {
  const postId = params.postId;

  // Ambil data Postingan dan sesi pengguna secara paralel
  const [post, sessionUser]: [
    Post | null,
    ServerUser | null,
  ] = await Promise.all([getPostById(postId), getSessionUser()]);

  if (!post) {
    notFound();
  }

  // Ambil data profil penulis
  const authorProfile: UserProfile | null = await getUserProfile(post.authorId);

  // Cek apakah pengguna saat ini adalah penulis postingan
  const isAuthor = !!(sessionUser && sessionUser.uid === post.authorId);

  // --- LOGIKA UNTUK STRATEGI SERANGAN ---
  const isStrategyPost = post.category === 'Strategi Serangan';

  // Mendapatkan Video ID YouTube dari videoUrl field baru
  const youtubeRegex =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)(\w+)/i;
  // Cek field videoUrl yang baru
  const videoId = post.videoUrl
    ? post.videoUrl.match(youtubeRegex)?.[1]
    : null;
  // --- AKHIR LOGIKA BARU ---

  // --- LOGIKA KHUSUS BASE BUILDING ---
  const isBaseBuildingPost = post.category === 'Base Building';
  // --- AKHIR LOGIKA BASE BUILDING ---

  return (
    <main className="container mx-auto p-4 md:p-8 mt-10">
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Kolom Kiri: Konten Postingan & Komentar */}
        <div className="lg:col-span-3">
          <div className="mb-6">
            <Button
              href="/knowledge-hub"
              variant="secondary"
              size="md"
              className="flex items-center"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Hub
            </Button>
          </div>

          <div className="card-stone p-8 space-y-6 rounded-lg">
            <header>
              <h1 className="text-4xl text-white font-clash m-0 leading-tight">
                {post.title}
              </h1>

              {/* Meta Detail */}
              <div className="flex flex-wrap items-center gap-4 py-4 mt-4 border-y border-coc-gold-dark/20 text-sm text-gray-400">
                {/* Tags */}
                <div className="flex gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-0.5 text-xs font-bold rounded-sm bg-coc-red text-white"
                    >
                      #{tag.toUpperCase()}
                    </span>
                  ))}
                </div>
                {/* Kategori */}
                <span className="font-bold text-coc-gold flex items-center gap-1">
                  <BookOpenIcon className="h-4 w-4" /> {post.category}
                </span>
                {/* Tanggal */}
                <span className="flex items-center gap-1">
                  <ClockIcon className="h-4 w-4" />{' '}
                  {format(post.createdAt, 'd MMMM yyyy', { locale: id })}
                </span>
              </div>
            </header>

            {/* START: KONTEN KHUSUS STRATEGI SERANGAN */}
            {isStrategyPost && (post.troopLink || videoId) && (
              <div className="space-y-6 pt-4 border-b border-coc-gold-dark/20 pb-6">
                <h2 className="text-2xl font-clash text-coc-gold-dark flex items-center gap-2">
                  <CogsIcon className="h-6 w-6" /> Detail Strategi
                </h2>

                {/* 1. Video Section */}
                {videoId ? (
                  <div className="w-full">
                    <p className="text-sm text-gray-400 mb-2 font-bold flex items-center gap-1">
                      Video Tutorial:
                    </p>
                    <div
                      className="relative w-full overflow-hidden rounded-lg border-2 border-coc-gold-dark"
                      style={{ paddingTop: '56.25%' }}
                    >
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute top-0 left-0 w-full h-full"
                        title="Embedded YouTube video"
                      ></iframe>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-coc-stone/50 rounded-lg flex items-center justify-center text-center">
                    <p className="text-gray-500 text-sm">
                      Video tutorial tidak tersedia.
                    </p>
                  </div>
                )}

                {/* 2. Troop Link Section */}
                <div className="w-full pt-4 border-t border-coc-gold-dark/20">
                  <p className="text-sm text-gray-400 mb-4 font-bold flex items-center gap-1">
                    Kombinasi Pasukan (Copy Link):
                  </p>
                  <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-coc-stone/50 rounded-lg border border-coc-gold-dark/30">
                    {post.troopLink ? (
                      <>
                        <Image
                          src="/images/barbarian.png"
                          alt="Troop Combo Preview"
                          width={80}
                          height={80}
                          className="w-16 h-16 flex-shrink-0"
                        />
                        <a
                          href={post.troopLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-grow w-full md:w-auto"
                        >
                          <Button
                            variant="primary"
                            size="lg"
                            className="w-full text-sm"
                          >
                            <LinkIcon className="inline h-5 w-5 mr-2" /> SALIN
                            KOMBINASI PASUKAN
                          </Button>
                        </a>
                      </>
                    ) : (
                      <p className="text-gray-500 text-sm text-center w-full">
                        Troop Link tidak tersedia.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {/* END: KONTEN KHUSUS STRATEGI SERANGAN */}

            {/* --- KONTEN KHUSUS BASE BUILDING --- */}
            {isBaseBuildingPost && (post.baseImageUrl || post.baseLinkUrl) && (
              <div className="space-y-6 pt-4 border-b border-coc-gold-dark/20 pb-6">
                <h2 className="text-2xl font-clash text-coc-gold-dark flex items-center gap-2">
                  <HomeIcon className="h-6 w-6" /> Detail Base
                </h2>

                {/* 1. Base Image (Imgur) */}
                {post.baseImageUrl && (
                  <div className="w-full">
                    <p className="text-sm text-gray-400 mb-2 font-bold flex items-center gap-1">
                      Tampilan Base:
                    </p>
                    <div className="relative w-full aspect-video overflow-hidden rounded-lg border-2 border-coc-gold-dark bg-black/20">
                      <Image
                        src={post.baseImageUrl}
                        alt={`Tampilan base untuk ${post.title}`}
                        layout="fill"
                        objectFit="contain"
                        className="bg-black/20"
                        loading="lazy"
                        placeholder="blur"
                        blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88/JjPQAIiwM/q1QNGwAAAABJRU5ErkJggg=="
                      />
                    </div>
                  </div>
                )}

                {/* 2. Base Link (CoC) */}
                {post.baseLinkUrl && (
                  <div className="w-full pt-4 mt-6 border-t border-coc-gold-dark/20">
                    <p className="text-sm text-gray-400 mb-4 font-bold flex items-center gap-1">
                      Link Base (Copy):
                    </p>
                    <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-coc-stone/50 rounded-lg border border-coc-gold-dark/30">
                      <Image
                        src="/images/th12.png"
                        alt="Base Link Preview"
                        width={80}
                        height={80}
                        className="w-16 h-16 flex-shrink-0"
                      />
                      <a
                        href={post.baseLinkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-grow w-full md:w-auto"
                      >
                        <Button
                          variant="primary"
                          size="lg"
                          className="w-full text-sm"
                        >
                          <LinkIcon className="inline h-5 w-5 mr-2" /> SALIN
                          LINK BASE
                        </Button>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}
            {/* --- AKHIR KONTEN KHUSUS BASE BUILDING --- */}

            {/* Konten Utama (Deskripsi) */}
            <div className="prose prose-invert prose-lg max-w-none text-gray-300">
              <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">
                Deskripsi Lengkap
              </h3>
              {/* Memanggil ContentRenderer */}
              <ContentRenderer post={post} />
            </div>

            {/* Tombol Aksi (Like/Edit/Hapus) - CLIENT COMPONENT */}
            <PostActionButtons
              postId={postId}
              isAuthor={isAuthor}
              initialLikes={post.likes || []} // Kirim array likes (atau array kosong)
              sessionUser={sessionUser} // Kirim data sesi pengguna
            />

            {/* [PERUBAHAN] Bagian Komentar Statis diganti dengan Komponen Client Dinamis */}
            <ReplySection
              postId={postId}
              initialReplyCount={post.replies || 0}
            />
            {/* [AKHIR PERUBAHAN] */}
          </div>
        </div>

        {/* Kolom Kanan: Sidebar Penulis */}
        <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6 text-center rounded-lg">
          <h2 className="text-xl font-clash border-l-4 border-coc-gold-dark pl-3 mb-4 flex items-center justify-center">
            Penulis
          </h2>

          <Image
            src={authorProfile?.avatarUrl || '/images/placeholder-avatar.png'}
            alt={`${post.authorName} Avatar`}
            width={80}
            height={80}
            className="w-20 h-20 rounded-full mx-auto border-4 border-coc-gold object-cover flex-shrink-0"
          />
          <h3 className="text-2xl text-white font-clash m-0">
            {post.authorName}
          </h3>

          <p className="text-xs text-gray-400 mt-1">
            {authorProfile?.playStyle || 'Kontributor'}
          </p>

          <div className="pt-4 border-t border-coc-gold-dark/20">
            <h3 className="text-lg font-clash text-coc-gold-dark">Reputasi</h3>
            <p className="text-4xl font-clash text-coc-gold my-1">
              {authorProfile?.reputation
                ? authorProfile.reputation.toFixed(1)
                : '5.0'}{' '}
              <StarIcon className="inline h-6 w-6" />
            </p>
          </div>

          <Button
            href={`/player/${post.authorId}`}
            variant="primary"
            className="w-full mt-4"
          >
            Lihat E-sports CV
          </Button>

          {/* Diskusi Terkait (Statis) */}
          <div className="pt-4 border-t border-coc-gold-dark/20 text-left">
            <h3 className="text-lg font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">
              Diskusi Terkait
            </h3>
            <ul className="text-sm space-y-3 mt-3">
              <li className="text-gray-300 hover:text-coc-gold transition-colors">
                <Link href="#">Base Building Anti-Hydrid</Link>
              </li>
              <li className="text-gray-300 hover:text-coc-gold transition-colors">
                <Link href="#">Upgrade Hero Equipment Terbaik</Link>
              </li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  );
};

export default PostDetailPage;