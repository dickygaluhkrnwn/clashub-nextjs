import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPostById, getUserProfile } from '@/lib/firestore';
import { Post, UserProfile } from '@/lib/types';
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
  UserCircleIcon,
  ChevronLeftIcon
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
          <div key={index} className="my-4 p-4 rounded-xl bg-coc-gold/10 border border-coc-gold/30 flex flex-col sm:flex-row items-center justify-between gap-4 group hover:bg-coc-gold/20 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden w-full">
                <div className="p-2 bg-coc-gold/20 rounded-lg text-coc-gold">
                    <LinkIcon className="h-5 w-5" />
                </div>
                <span className="text-coc-gold text-sm truncate font-mono flex-1">{fullLink}</span>
            </div>
            <a
              href={fullLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold bg-coc-gold text-black px-4 py-2 rounded-lg hover:bg-white hover:text-black transition-all shadow-[0_0_15px_rgba(255,215,0,0.4)] uppercase tracking-wider flex-shrink-0 w-full sm:w-auto text-center"
            >
              Open In Game
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
    <div className="prose prose-invert prose-lg max-w-none text-gray-300 font-sans leading-relaxed tracking-wide">
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

  // --- Reusable Author Card Component ---
  const AuthorCard = () => (
    <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl shadow-2xl relative overflow-hidden group h-fit">
      {/* Top Accent (Added for alignment consistency with Article) */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coc-blue via-coc-gold to-coc-red opacity-50" />
      
      {/* Decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-coc-blue/10 rounded-full blur-[50px] pointer-events-none" />
      
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8 border-b border-white/10 pb-4 flex items-center gap-2 relative z-10">
        <UserCircleIcon className="h-4 w-4" /> About Author
      </h2>

      <div className="flex flex-col items-center text-center relative z-10">
        <div className="relative w-28 h-28 mb-5 group/avatar">
            <div className="absolute inset-0 bg-coc-gold/20 rounded-full blur-xl group-hover/avatar:opacity-100 opacity-50 transition-opacity" />
            <Image
            src={authorProfile?.avatarUrl || '/images/placeholder-avatar.png'}
            alt={post.authorName}
            fill
            className="rounded-full object-cover border-4 border-[#1a1d26] shadow-2xl relative z-10"
          />
          {authorProfile?.isVerified && (
              <div className="absolute bottom-1 right-1 bg-coc-blue text-white rounded-full p-1.5 border-4 border-[#15171e] z-20 shadow-lg" title="Verified Author">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              </div>
          )}
        </div>
        
        <h3 className="text-2xl font-bold text-white mb-2 font-clash tracking-wide">{post.authorName}</h3>
        
        <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-xs font-mono text-gray-400 bg-[#0a0a0b] px-3 py-1 rounded-full border border-white/10">
              {authorProfile?.playerTag || "No Tag"}
            </span>
            {authorProfile?.role && (
              <span className="text-[10px] font-bold uppercase tracking-wider text-coc-gold bg-coc-gold/10 px-2 py-1 rounded border border-coc-gold/20">
                  {authorProfile.role}
              </span>
            )}
        </div>

        <div className="w-full bg-[#0a0a0b] p-4 rounded-xl border border-white/5 mb-6 relative">
            <div className="absolute top-0 left-0 w-1 h-full bg-white/10 rounded-l-xl" />
            <p className="text-sm text-gray-400 italic leading-relaxed">
              "{authorProfile?.bio || 'Clasher antusias yang suka berbagi strategi dan membangun komunitas.'}"
            </p>
        </div>

        <Button href={`/player/${post.authorId}`} variant="secondary" className="w-full bg-white/5 hover:bg-white/10 border-white/10 hover:text-white shadow-none">
            VIEW FULL PROFILE
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-clash relative overflow-x-hidden pb-20">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-[600px] bg-gradient-to-b from-[#1a1625] via-[#0f1115] to-transparent pointer-events-none z-0 opacity-60" />
      <div className="fixed top-[-100px] right-[-100px] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <main className="container mx-auto p-4 md:p-8 mt-6 relative z-10 max-w-7xl">
        
        {/* Navigation Back REMOVED */}

        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Kolom Kiri: Konten Utama (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            <article className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
              {/* Top Accent */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coc-blue via-coc-gold to-coc-red opacity-50" />
              
              {/* Decorative Background */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-coc-gold/5 rounded-full blur-[80px] pointer-events-none" />

              <header className="mb-8 relative z-10">
                {/* Meta Badges */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className="px-3 py-1 bg-coc-gold/10 text-coc-gold border border-coc-gold/20 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_10px_rgba(255,215,0,0.2)]">
                      <BookOpenIcon className="h-3.5 w-3.5" /> {post.category}
                  </span>
                  <span className="px-3 py-1 bg-white/5 text-gray-400 border border-white/5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <ClockIcon className="h-3.5 w-3.5" /> 
                      {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: id })}
                  </span>
                </div>

                <h1 className="text-3xl md:text-5xl text-white font-bold leading-tight mb-6 drop-shadow-md">
                  {post.title}
                </h1>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-[10px] font-mono font-bold rounded-md bg-[#0a0a0b] text-gray-400 border border-white/10 hover:border-white/30 transition-colors uppercase tracking-wider"
                    >
                      #{tag.toUpperCase()}
                    </span>
                  ))}
                </div>
              </header>

              {/* --- KONTEN KHUSUS STRATEGI (Video / Army Link) --- */}
              {isStrategyPost && (post.troopLink || videoId) && (
                <div className="mb-10 p-1 rounded-2xl bg-gradient-to-br from-coc-blue/20 to-transparent border border-coc-blue/30 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-coc-blue/5 animate-pulse-slow pointer-events-none" />
                  <div className="bg-[#0f1115]/90 rounded-[14px] p-6 relative z-10">
                      <h2 className="text-lg font-bold text-coc-blue mb-4 flex items-center gap-2 uppercase tracking-widest">
                        <CogsIcon className="h-5 w-5" /> Strategy Intel
                      </h2>
                      <div className="grid grid-cols-1 gap-6">
                        {videoId && (
                            <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}`}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                className="absolute top-0 left-0 w-full h-full border-0"
                                title="YouTube video"
                              />
                            </div>
                        )}
                        {post.troopLink && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                                <div className="flex items-center gap-3">
                                   <div className="p-2 bg-coc-blue/20 rounded-lg text-coc-blue">
                                      <LinkIcon className="h-5 w-5" />
                                   </div>
                                   <div>
                                      <p className="text-sm text-white font-bold">Army Composition</p>
                                      <p className="text-xs text-gray-500">Import directly to Clash of Clans</p>
                                   </div>
                                </div>
                                <Button 
                                  href={post.troopLink} 
                                  target="_blank" 
                                  variant="primary" 
                                  size="sm"
                                  className="w-full sm:w-auto shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-gradient-to-b from-coc-blue to-blue-700 border-b-4 border-blue-800"
                                >
                                  COPY ARMY
                                </Button>
                            </div>
                        )}
                      </div>
                  </div>
                </div>
              )}

              {/* --- KONTEN KHUSUS BASE BUILDING (Image / Link) --- */}
              {isBaseBuildingPost && (post.baseImageUrl || post.baseLinkUrl) && (
                <div className="mb-10 p-1 rounded-2xl bg-gradient-to-br from-coc-gold/20 to-transparent border border-coc-gold/30 overflow-hidden relative group">
                  <div className="absolute inset-0 bg-coc-gold/5 animate-pulse-slow pointer-events-none" />
                  <div className="bg-[#0f1115]/90 rounded-[14px] p-6 relative z-10">
                    <h2 className="text-lg font-bold text-coc-gold mb-4 flex items-center gap-2 uppercase tracking-widest">
                      <HomeIcon className="h-5 w-5" /> Base Layout
                    </h2>
                    <div className="space-y-6">
                      {post.baseImageUrl && (
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/50 group/image">
                          <Image
                            src={post.baseImageUrl}
                            alt={`Base ${post.title}`}
                            fill
                            className="object-contain transition-transform duration-500 group-hover/image:scale-105"
                          />
                        </div>
                      )}
                      {post.baseLinkUrl && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 p-4 rounded-xl border border-white/10">
                            <div className="flex items-center gap-3">
                               <div className="p-2 bg-coc-gold/20 rounded-lg text-coc-gold">
                                  <LinkIcon className="h-5 w-5" />
                               </div>
                               <div>
                                  <p className="text-sm text-white font-bold">Copy Base Layout</p>
                                  <p className="text-xs text-gray-500">Open directly in Clash of Clans</p>
                               </div>
                            </div>
                            <Button href={post.baseLinkUrl} target="_blank" variant="primary" size="sm" className="w-full sm:w-auto shadow-lg shadow-coc-gold/20">
                              COPY LAYOUT
                            </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Konten Text */}
              <div className="mb-10 relative z-10">
                <ContentRenderer post={post} />
              </div>

              {/* Actions & Author Footer */}
              <div className="pt-8 border-t border-white/10 relative z-10">
                 <PostActionButtons
                   postId={postId}
                   isAuthor={isAuthor}
                   initialLikes={post.likes || []}
                   sessionUser={sessionUser}
                 />
              </div>

              {/* [NEW] Mobile Author Section - Visible ONLY on Mobile/Tablet */}
              <div className="lg:hidden mt-12 pt-8 border-t border-white/5">
                 <AuthorCard />
              </div>

              {/* Komentar */}
              <div className="mt-12 pt-8 border-t border-white/5 relative z-10">
                <h3 className="text-xl font-clash text-white mb-6 flex items-center gap-2">
                   Comments <span className="text-xs bg-white/10 px-2 py-1 rounded text-gray-400 font-mono">{post.replies || 0}</span>
                </h3>
                <ReplySection postId={postId} initialReplyCount={post.replies || 0} />
              </div>
            </article>
          </div>

          {/* Kolom Kanan: Sidebar Penulis (4 cols) - Visible ONLY on Desktop */}
          <aside className="hidden lg:block lg:col-span-4 space-y-6">
            <div className="sticky top-24">
                <AuthorCard />
            </div>
          </aside>

        </section>
      </main>
    </div>
  );
};

export default PostDetailPage;