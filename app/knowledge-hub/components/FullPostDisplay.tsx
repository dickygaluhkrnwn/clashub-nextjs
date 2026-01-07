'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Post, Video, KnowledgeHubItem } from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import { formatDistanceToNowStrict } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale'; 
import {
  ClockIcon, LinkIcon, ThumbsUpIcon, HomeIcon, CogsIcon, MessageSquareIcon, ArrowRightIcon
} from '@/app/components/icons';
import { isVideo } from '@/lib/knowledge-hub-utils';
import { useLanguage } from '@/lib/hooks/useLanguage';

const getYouTubeVideoId = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)(\w+)/i;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const ContentRenderer = ({ content }: { content: string | undefined }) => {
  const safeContent = content || '';
  const contentParts = useMemo(() => {
    return safeContent.split('\n').map((line, index, arr) => (
      <React.Fragment key={index}>
        {line}
        {index < arr.length - 1 && <br />}
      </React.Fragment>
    ));
  }, [safeContent]);
  return <p className="text-gray-300 text-sm md:text-base font-sans leading-relaxed tracking-wide">{contentParts}</p>;
};

interface FullPostDisplayProps {
  item: KnowledgeHubItem;
}

const FullPostDisplay: React.FC<FullPostDisplayProps> = ({ item }) => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const { t, language } = useLanguage();

  if (!item) return null;
  
  const isItemVideo = isVideo(item);
  const post = isItemVideo ? null : (item as Post);
  const video = isItemVideo ? (item as Video) : null;

  const [isLiking, setIsLiking] = useState(false);
  const [currentLikes, setCurrentLikes] = useState(post?.likes || []);

  const userHasLiked = useMemo(() => {
    return currentUser ? currentLikes.includes(currentUser.uid) : false;
  }, [currentUser, currentLikes]);

  const likeCount = useMemo(() => currentLikes.length, [currentLikes]);

  const authorName = isItemVideo ? video?.channelTitle : post?.authorName;
  const authorAvatar = isItemVideo ? video?.thumbnailUrl : (post?.authorAvatarUrl || '/images/placeholder-avatar.png');
  const authorHref = isItemVideo ? `https://www.youtube.com/channel/${video?.channelId}` : `/player/${post?.authorId}`;
  
  const category = item.category;
  const title = item.title;
  const itemLink = isItemVideo ? `https://www.youtube.com/watch?v=${video?.videoId}` : `/knowledge-hub/${post?.id}`;
  const isExternalLink = isItemVideo;

  // --- Format Waktu Multibahasa ---
  const timeAgo = useMemo(() => {
    try {
      const dateValue = isItemVideo ? video?.publishedAt : post?.createdAt;
      const itemDate = new Date(dateValue ?? 0); 
      
      if (isNaN(itemDate.getTime()) || itemDate.getTime() === 0) {
        return t.knowledgeHub.detail.meta.invalidDate; 
      }
      const locale = language === 'id' ? idLocale : enUS;
      return formatDistanceToNowStrict(itemDate, { addSuffix: true, locale });
    } catch (e) {
      console.error("Error formatting date:", e);
      return 'Invalid date';
    }
  }, [isItemVideo, post, video, language, t.knowledgeHub.detail.meta.invalidDate]);

  const videoIdFromPost = getYouTubeVideoId(post?.videoUrl);
  const displayMedia = useMemo(() => {
    if (isItemVideo) {
      return { type: 'video', id: video?.videoId };
    }
    if (post?.imageUrl) {
      return { type: 'image', url: post.imageUrl };
    } 
    else if (videoIdFromPost) {
      return { type: 'video', id: videoIdFromPost };
    } 
    else if (post?.baseImageUrl) {
      return { type: 'baseImage', url: post.baseImageUrl };
    }
    return null;
  }, [isItemVideo, video, post, videoIdFromPost]);

  const postImageFallback = '/images/baseth12-placeholder.png';
  const content = isItemVideo ? video?.description : post?.content;
  const tags = isItemVideo ? [video?.channelTitle || 'YouTube'] : post?.tags;
  const replies = isItemVideo ? 0 : post?.replies;

  const handleLike = async () => {
    if (!currentUser) {
      router.push('/auth');
      return;
    }
    if (isItemVideo || !post || !post.id) return;

    setIsLiking(true);
    const newLikeStatus = !userHasLiked;
    
    if (newLikeStatus) {
      setCurrentLikes(prev => [...prev, currentUser.uid]);
    } else {
      setCurrentLikes(prev => prev.filter(uid => uid !== currentUser.uid));
    }

    try {
      const response = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal memproses like');
      }
    } catch (error) {
      console.error("Gagal me-like:", error);
      if (newLikeStatus) {
        setCurrentLikes(prev => prev.filter(uid => uid !== currentUser.uid));
      } else {
        setCurrentLikes(prev => [...prev, currentUser.uid]);
      }
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <article className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl transition-all duration-300 hover:border-coc-gold/20 hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] group relative">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-coc-blue/5 rounded-full blur-[80px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

      {/* Header Author */}
      <header className="flex items-center gap-4 p-5 bg-[#0a0a0b]/50 border-b border-white/5 relative z-10">
        {authorHref && (
          <Link href={authorHref} target={isExternalLink ? "_blank" : "_self"} rel={isExternalLink ? "noopener noreferrer" : ""}>
            <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-white/10 hover:border-coc-gold transition-colors shadow-lg group/avatar">
              <Image
                src={authorAvatar || '/images/placeholder-avatar.png'}
                alt={`${authorName}'s avatar`}
                fill
                className="object-cover group-hover/avatar:scale-110 transition-transform duration-300"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/placeholder-avatar.png';
                }}
              />
            </div>
          </Link>
        )}
        <div className="flex-grow min-w-0">
          {authorHref && (
            <Link href={authorHref} target={isExternalLink ? "_blank" : "_self"} rel={isExternalLink ? "noopener noreferrer" : ""} className="font-bold text-white hover:text-coc-gold transition-colors text-base font-clash tracking-wide block truncate">
              {authorName || t.knowledgeHub.detail.meta.anonymous}
            </Link>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-coc-gold/10 text-coc-gold border border-coc-gold/20 tracking-wider shadow-[0_0_10px_rgba(255,215,0,0.1)]">
                {category}
              </span>
              <span className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                <ClockIcon className="h-3 w-3" /> {timeAgo}
              </span>
          </div>
        </div>
      </header>

      {/* Media Content */}
      {displayMedia && (
        <div className="relative w-full bg-black border-y border-white/5 overflow-hidden group/media">
          {(displayMedia.type === 'image' || displayMedia.type === 'baseImage') && (
            <div className="relative w-full aspect-video">
               <Image
                src={(displayMedia as { url: string }).url || postImageFallback}
                alt={`Media for ${title}`}
                fill
                className="object-contain transition-transform duration-500 group-hover/media:scale-105"
                loading="lazy"
                onError={(e) => { 
                  e.currentTarget.onerror = null; 
                  e.currentTarget.src = postImageFallback; 
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover/media:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </div>
          )}
          {displayMedia.type === 'video' && (
            <div className="relative w-full aspect-video">
              <iframe
                src={`https://www.youtube.com/embed/${displayMedia.id}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full border-0"
                title="YouTube video player"
              ></iframe>
            </div>
          )}
        </div>
      )}

      {/* Main Content */}
      <div className="p-6 space-y-4 relative z-10">
        {itemLink && (
          <Link href={itemLink} target={isExternalLink ? "_blank" : "_self"} rel={isExternalLink ? "noopener noreferrer" : ""} className="group/title block">
            <h2 className="text-xl md:text-2xl font-clash text-white group-hover/title:text-coc-gold transition-colors leading-tight drop-shadow-md">
              {title}
            </h2>
          </Link>
        )}
        
        {/* Content Snippet */}
        <div className="line-clamp-3 md:line-clamp-4 bg-white/5 p-4 rounded-xl border border-white/5 text-gray-300 text-sm leading-relaxed relative overflow-hidden">
           <div className="absolute top-0 left-0 w-1 h-full bg-white/10" />
           <ContentRenderer content={content} />
        </div>

        {/* Action Buttons (Base Link / Troop Link) */}
        {!isItemVideo && (post?.baseLinkUrl || post?.troopLink) && (
            <div className="pt-2 flex flex-wrap gap-3">
              {post?.baseLinkUrl && post?.category === 'Base Building' && (
                <a href={post.baseLinkUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[140px]">
                  <Button variant="outline" size="sm" className="w-full border-coc-gold/30 text-coc-gold hover:bg-coc-gold/10 hover:text-white transition-all shadow-sm hover:shadow-coc-gold/10">
                    <LinkIcon className="h-4 w-4 mr-2" /> 
                    {t.knowledgeHub.detail.actions.copyBaseLink}
                  </Button>
                </a>
              )}
              {post?.troopLink && post?.category === 'Strategi Serangan' && (
                <a href={post.troopLink} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[140px]">
                   <Button variant="outline" size="sm" className="w-full border-coc-gold/30 text-coc-gold hover:bg-coc-gold/10 hover:text-white transition-all shadow-sm hover:shadow-coc-gold/10">
                    <CogsIcon className="h-4 w-4 mr-2" /> 
                    {t.knowledgeHub.detail.actions.copyArmyLink}
                  </Button>
                </a>
              )}
            </div>
        )}
        
        {isItemVideo && (
            <div className="pt-2">
              <a href={itemLink || '#'} target="_blank" rel="noopener noreferrer">
                <Button variant="danger" size="sm" className="w-full bg-coc-red/10 text-coc-red hover:bg-coc-red hover:text-white border border-coc-red/30 shadow-[0_0_15px_rgba(220,38,38,0.2)]">
                  {t.knowledgeHub.detail.actions.watchYoutube} <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </a>
            </div>
        )}
      </div>

      {/* Footer / Meta Actions */}
      <footer className="px-6 py-4 bg-[#0a0a0b]/50 border-t border-white/5 flex flex-wrap items-center justify-between gap-y-3 gap-x-4 relative z-10">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags && tags.length > 0 ? tags.map((tag, index) => (
            <span key={index} className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white/5 rounded-lg border border-white/5 hover:text-white hover:border-white/20 transition-colors cursor-default">
              #{tag.toUpperCase()}
            </span>
          )) : (
            <span className="text-xs text-gray-600 italic">
               {t.knowledgeHub.detail.meta.noTags}
            </span>
          )}
        </div>

        {/* Social Actions */}
        <div className="flex items-center gap-2">
          <button 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-200 border ${
              userHasLiked
                ? 'bg-coc-gold/10 text-coc-gold border-coc-gold/20 shadow-[0_0_10px_rgba(255,215,0,0.1)]'
                : 'bg-transparent text-gray-400 border-transparent hover:bg-white/5 hover:text-white'
            } ${isLiking ? 'opacity-50 cursor-wait' : ''}`}
            disabled={isItemVideo || isLiking}
            onClick={handleLike}
            title={userHasLiked ? "Unlike" : "Like"}
          >
            <ThumbsUpIcon className={`h-4 w-4 ${userHasLiked ? 'fill-current' : ''}`} /> 
            <span className="text-xs font-bold font-sans">
                {isItemVideo ? '-' : likeCount}
            </span>
          </button>

          {!isItemVideo ? (
            <Link href={`/knowledge-hub/${post?.id}#comments`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white border border-transparent hover:border-white/10 transition-all duration-200">
               <MessageSquareIcon className="h-4 w-4" />
               <span className="text-xs font-bold font-sans">
                 {replies}
               </span>
            </Link>
          ) : (
             <span className="flex items-center gap-1.5 px-3 py-1.5 text-gray-600 opacity-50 cursor-not-allowed">
               <MessageSquareIcon className="h-4 w-4" />
               <span className="text-xs font-bold font-sans">-</span>
             </span>
          )}
        </div>
      </footer>
    </article>
  );
};

export default FullPostDisplay;