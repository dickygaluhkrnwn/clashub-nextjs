import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPostById, getUserProfile } from '@/lib/firestore';
import { Post, UserProfile } from '@/lib/clashub.types';
import React, { useMemo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { getSessionUser, ServerUser } from '@/lib/server-auth';
import PostActionButtons from './components/PostActionButtons';
import ReplySection from './components/ReplySection';

import {
  BookOpenIcon,
  ClockIcon,
  LinkIcon,
  CogsIcon,
  HomeIcon,
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

// Force Dynamic agar selalu fresh saat dibuka
export const dynamic = 'force-dynamic';

interface PostDetailPageProps {
  params: {
    postId: string;
  };
}

// --- Content Renderer (Highlight Link & Newline) ---
const ContentRenderer = ({ post }: { post: Post }) => {
  const contentParts = useMemo(() => {
    return post.content.split('\n').map((line, index, arr) => {
      // Regex Link CoC (Base/Army)
      const cocLinkRegex = /(https?:\/\/(link\.clashofclans\.com)\/(\S+))/i;
      const linkMatch = line.match(cocLinkRegex);

      if (linkMatch) {
        const fullLink = linkMatch[0];
        return (
          <div key={index} className="my-2 p-3 rounded-lg bg-coc-gold/10 border border-coc-gold/30 flex items-center justify-between gap-2">
            <span className="text-coc-gold text-sm truncate font-mono">{fullLink}</span>
            <a
              href={fullLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold bg-coc-gold text-coc-dark px-3 py-1.5 rounded hover:bg-white transition-colors"
            >
              Buka Link
            </a>
          </div>
        );
      }

      return (
        <React.Fragment key={index}>
          {line}
          {index < arr.length - 1 && <br />}
        </React.Fragment>
      );
    });
  }, [post.content]);

  return (
    <div className="prose prose-invert prose-lg max-w-none text-gray-300 font-sans leading-relaxed">
      {contentParts}
    </div>
  );
};

export async function generateMetadata({
  params,
}: PostDetailPageProps): Promise<Metadata> {
  const postId = params.postId;
  const post = await getPostById(postId);

  if (!post) {
    return { title: 'Postingan Tidak Ditemukan | Clashub' };
  }

  const description =
    post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '');

  return {
    title: `Clashub | ${post.title}`,
    description: description,
  };
}

const PostDetailPage = async ({ params }: PostDetailPageProps) => {
  const postId = params.postId;

  const [post, sessionUser]: [Post | null, ServerUser | null] = await Promise.all([
    getPostById(postId),
    getSessionUser(),
  ]);

  if (!post) {
    notFound();
  }

  const authorProfile: UserProfile | null = await getUserProfile(post.authorId);
  const isAuthor = !!(sessionUser && sessionUser.uid === post.authorId);
  const isStrategyPost = post.category === 'Strategi Serangan';
  const isBaseBuildingPost = post.category === 'Base Building';

  // Helper Video ID
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)(\w+)/i;
  const videoId = post.videoUrl ? post.videoUrl.match(youtubeRegex)?.[1] : null;

  return (
    <div className="min-h-screen bg-coc-dark text-white font-clash relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed top-40 right-0 w-[400px] h-[400px] bg-coc-gold/5 blur-[120px] pointer-events-none z-0" />

      <main className="container mx-auto p-4 md:p-8 mt-4 relative z-10">
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Kolom Kiri: Konten Utama */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* [REMOVED] Tombol Back dihapus di sini */}

            <article className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
              {/* Top Accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coc-blue via-coc-gold to-coc-red opacity-50" />

              <header className="mb-8">
                {/* Meta Badges */}
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-coc-gold/10 text-coc-gold border border-coc-gold/20 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                     <BookOpenIcon className="h-3 w-3" /> {post.category}
                  </span>
                  <span className="px-3 py-1 bg-white/5 text-gray-400 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                     <ClockIcon className="h-3 w-3" /> 
                     {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: id })}
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl text-white font-bold leading-tight mb-6">
                  {post.title}
                </h1>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-white/5 text-gray-400 border border-white/5"
                    >
                      #{tag.toUpperCase()}
                    </span>
                  ))}
                </div>
              </header>

              {/* --- KONTEN KHUSUS STRATEGI --- */}
              {isStrategyPost && (post.troopLink || videoId) && (
                <div className="mb-8 p-6 bg-coc-dark-blue/40 rounded-2xl border border-coc-blue/20">
                  <h2 className="text-xl font-bold text-coc-blue mb-4 flex items-center gap-2">
                    <CogsIcon className="h-5 w-5" /> Media Strategi
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {videoId && (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-lg">
                           <iframe
                              src={`https://www.youtube.com/embed/${videoId}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="absolute top-0 left-0 w-full h-full"
                              title="YouTube video"
                           />
                        </div>
                     )}
                     {post.troopLink && (
                        <div className="flex flex-col justify-center">
                           <p className="text-sm text-gray-400 mb-3">Salin komposisi pasukan langsung ke game:</p>
                           <Button 
                              href={post.troopLink} 
                              target="_blank" 
                              variant="primary" 
                              className="w-full shadow-lg shadow-coc-gold/10"
                           >
                              <LinkIcon className="h-5 w-5 mr-2" /> Buka Troop Link
                           </Button>
                        </div>
                     )}
                  </div>
                </div>
              )}

              {/* --- KONTEN KHUSUS BASE BUILDING --- */}
              {isBaseBuildingPost && (post.baseImageUrl || post.baseLinkUrl) && (
                <div className="mb-8 p-6 bg-coc-dark-blue/40 rounded-2xl border border-coc-gold/20">
                  <h2 className="text-xl font-bold text-coc-gold mb-4 flex items-center gap-2">
                    <HomeIcon className="h-5 w-5" /> Layout Base
                  </h2>
                  <div className="space-y-6">
                    {post.baseImageUrl && (
                      <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-lg bg-black/50">
                        <Image
                          src={post.baseImageUrl}
                          alt={`Base ${post.title}`}
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    {post.baseLinkUrl && (
                      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                         <div className="flex-grow">
                            <p className="text-sm text-gray-300 font-bold">Salin Layout Base</p>
                            <p className="text-xs text-gray-500">Klik tombol untuk membuka langsung di Clash of Clans</p>
                         </div>
                         <Button href={post.baseLinkUrl} target="_blank" variant="primary" size="sm">
                            <LinkIcon className="h-4 w-4 mr-2" /> Salin Link
                         </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Konten Text */}
              <div className="mb-10">
                <ContentRenderer post={post} />
              </div>

              {/* Actions & Author Footer */}
              <div className="pt-8 border-t border-white/10">
                 <PostActionButtons
                    postId={postId}
                    isAuthor={isAuthor}
                    initialLikes={post.likes || []}
                    sessionUser={sessionUser}
                 />
              </div>

              {/* Komentar */}
              <div className="mt-10">
                <ReplySection postId={postId} initialReplyCount={post.replies || 0} />
              </div>
            </article>
          </div>

          {/* Kolom Kanan: Sidebar Penulis */}
          <aside className="lg:col-span-1 space-y-6">
            <div className="bg-black/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl shadow-lg sticky top-24">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-2">
                Tentang Penulis
              </h2>

              <div className="flex flex-col items-center text-center">
                <div className="relative w-24 h-24 mb-4">
                  <Image
                    src={authorProfile?.avatarUrl || '/images/placeholder-avatar.png'}
                    alt={post.authorName}
                    fill
                    className="rounded-full object-cover border-4 border-white/10 shadow-xl"
                  />
                  {authorProfile?.isVerified && (
                     <div className="absolute bottom-0 right-0 bg-coc-green rounded-full p-1 border-2 border-coc-dark">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                     </div>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-1">{post.authorName}</h3>
                <p className="text-xs font-mono text-coc-gold bg-coc-gold/10 px-2 py-0.5 rounded border border-coc-gold/20 mb-4">
                  {authorProfile?.playerTag || "No Tag"}
                </p>

                <p className="text-sm text-gray-400 mb-6 italic">
                  "{authorProfile?.bio || 'Clasher antusias yang suka berbagi strategi.'}"
                </p>

                <Button href={`/player/${post.authorId}`} variant="outline" size="sm" className="w-full border-white/10 hover:bg-white/5">
                   Lihat Profil Lengkap
                </Button>
              </div>
            </div>
          </aside>

        </section>
      </main>
    </div>
  );
};

export default PostDetailPage;