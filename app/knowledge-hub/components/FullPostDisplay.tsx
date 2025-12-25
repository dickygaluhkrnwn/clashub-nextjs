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
  return <p className="text-gray-300 text-sm md:text-base font-sans leading-relaxed">{contentParts}</p>;
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
    <article className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-lg transition-all duration-300 hover:border-white/10 group">
      {/* Header Author */}
      <header className="flex items-center gap-3 p-4 bg-white/5 border-b border-white/5">
        {authorHref && (
          <Link href={authorHref} target={isExternalLink ? "_blank" : "_self"} rel={isExternalLink ? "noopener noreferrer" : ""}>
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-coc-gold/50 hover:border-coc-gold transition-colors shadow-sm">
              <Image
                src={authorAvatar || '/images/placeholder-avatar.png'}
                alt={`${authorName}'s avatar`}
                fill
                className="object-cover"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/images/placeholder-avatar.png';
                }}
              />
            </div>
          </Link>
        )}
        <div className="flex-grow">
          {authorHref && (
            <Link href={authorHref} target={isExternalLink ? "_blank" : "_self"} rel={isExternalLink ? "noopener noreferrer" : ""} className="font-bold text-white hover:text-coc-gold hover:underline text-sm font-clash tracking-wide block">
              {authorName || t.knowledgeHub.detail.meta.anonymous}
            </Link>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
             <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-coc-gold/10 text-coc-gold border border-coc-gold/20">
                {category}
             </span>
             <span className="text-xs text-gray-500 font-sans flex items-center gap-1">
               <ClockIcon className="h-3 w-3" /> {timeAgo}
             </span>
          </div>
        </div>
      </header>

      {/* Media Content */}
      {displayMedia && (
        <div className="relative w-full bg-black/60 border-y border-white/5">
          {(displayMedia.type === 'image' || displayMedia.type === 'baseImage') && (
            <div className="relative w-full aspect-video">
               <Image
                src={(displayMedia as { url: string }).url || postImageFallback}
                alt={`Media for ${title}`}
                fill
                className="object-contain"
                loading="lazy"
                onError={(e) => { 
                  e.currentTarget.onerror = null; 
                  e.currentTarget.src = postImageFallback; 
                }}
              />
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
      <div className="p-5 space-y-3">
        {itemLink && (
          <Link href={itemLink} target={isExternalLink ? "_blank" : "_self"} rel={isExternalLink ? "noopener noreferrer" : ""} className="group/title">
            <h2 className="text-xl md:text-2xl font-clash text-white group-hover/title:text-coc-gold transition-colors leading-tight">
              {title}
            </h2>
          </Link>
        )}
        
        {/* Content Snippet */}
        <div className="line-clamp-3 md:line-clamp-4">
           <ContentRenderer content={content} />
        </div>

        {/* Action Buttons (Base Link / Troop Link) */}
        {!isItemVideo && (post?.baseLinkUrl || post?.troopLink) && (
           <div className="pt-4 flex flex-wrap gap-3">
              {post?.baseLinkUrl && post?.category === 'Base Building' && (
                <a href={post.baseLinkUrl} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[140px]">
                  <Button variant="outline" size="sm" className="w-full border-coc-gold/30 text-coc-gold hover:bg-coc-gold/10">
                    <LinkIcon className="h-4 w-4 mr-2" /> 
                    {t.knowledgeHub.detail.actions.copyBaseLink}
                  </Button>
                </a>
              )}
              {post?.troopLink && post?.category === 'Strategi Serangan' && (
                <a href={post.troopLink} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-[140px]">
                   <Button variant="outline" size="sm" className="w-full border-coc-gold/30 text-coc-gold hover:bg-coc-gold/10">
                    <CogsIcon className="h-4 w-4 mr-2" /> 
                    {t.knowledgeHub.detail.actions.copyArmyLink}
                  </Button>
                </a>
              )}
           </div>
        )}
        
        {isItemVideo && (
           <div className="pt-4">
             <a href={itemLink || '#'} target="_blank" rel="noopener noreferrer">
               <Button variant="danger" size="sm" className="w-full bg-coc-red/20 text-coc-red hover:bg-coc-red/30 border border-coc-red/30">
                 {t.knowledgeHub.detail.actions.watchYoutube} <ArrowRightIcon className="h-4 w-4 ml-2" />
               </Button>
             </a>
           </div>
        )}
      </div>

      {/* Footer / Meta Actions */}
      <footer className="px-5 py-3 bg-white/5 border-t border-white/5 flex flex-wrap items-center justify-between gap-y-3 gap-x-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {tags && tags.length > 0 ? tags.map((tag, index) => (
            <span key={index} className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-black/20 rounded border border-white/5 hover:text-white hover:border-white/20 transition-colors cursor-default">
              #{tag.toUpperCase()}
            </span>
          )) : (
            <span className="text-xs text-gray-600 italic">
               {t.knowledgeHub.detail.meta.noTags}
            </span>
          )}
        </div>

        {/* Social Actions */}
        <div className="flex items-center gap-4">
          <button 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
              userHasLiked
                ? 'bg-coc-gold/10 text-coc-gold'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
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
            <Link href={`/knowledge-hub/${post?.id}#comments`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-gray-400 hover:bg-white/10 hover:text-white transition-all duration-200">
               <MessageSquareIcon className="h-4 w-4" />
               <span className="text-xs font-bold font-sans">
                 {replies}
               </span>
            </Link>
          ) : (
             <span className="flex items-center gap-1.5 px-3 py-1.5 text-gray-500 opacity-50 cursor-not-allowed">
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