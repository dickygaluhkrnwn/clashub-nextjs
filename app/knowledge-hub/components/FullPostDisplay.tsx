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
  ClockIcon, LinkIcon, ThumbsUpIcon, HomeIcon, CogsIcon
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
  return <p className="text-gray-300 text-sm font-sans leading-relaxed">{contentParts}</p>;
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
        return t.knowledgeHub.detail.meta.invalidDate; // Pakai kamus
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
  const replies = isItemVideo ? 'N/A' : post?.replies;

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
    <article className="card-stone rounded-lg overflow-hidden shadow-lg border border-coc-gold-dark/20">
      <header className="flex items-center gap-3 p-4 bg-coc-stone-light/50 border-b border-coc-gold-dark/20">
        {authorHref && (
          <Link href={authorHref} target={isExternalLink ? "_blank" : "_self"} rel={isExternalLink ? "noopener noreferrer" : ""}>
            <Image
              src={authorAvatar || '/images/placeholder-avatar.png'}
              alt={`${authorName}'s avatar`}
              width={40}
              height={40}
              className="rounded-full border-2 border-coc-gold object-cover"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = '/images/placeholder-avatar.png';
              }}
            />
          </Link>
        )}
        <div className="flex-grow">
          {authorHref && (
            <Link href={authorHref} target={isExternalLink ? "_blank" : "_self"} rel={isExternalLink ? "noopener noreferrer" : ""} className="font-bold text-white hover:underline text-sm font-clash">
              {authorName || t.knowledgeHub.detail.meta.anonymous}
            </Link>
          )}
          <p className="text-xs text-gray-400 font-sans flex items-center gap-1">
            <ClockIcon className="h-3 w-3" /> {timeAgo} • 
            {/* Pakai kamus */}
            {` ${t.knowledgeHub.detail.meta.categoryLabel} `}
            <span className="font-semibold text-coc-gold-dark">{category}</span>
          </p>
        </div>
      </header>

      {displayMedia && (
        <div className="relative w-full bg-black/20">
          {(displayMedia.type === 'image' || displayMedia.type === 'baseImage') && (
            <div className="relative w-full aspect-video">
               <Image
                src={(displayMedia as { url: string }).url || postImageFallback}
                alt={`Media for ${title}`}
                layout="fill"
                objectFit="contain"
                className="bg-black/20"
                loading="lazy"
                onError={(e) => { 
                  e.currentTarget.onerror = null; 
                  e.currentTarget.src = postImageFallback; 
                  e.currentTarget.style.objectFit = 'cover'; 
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
                title="YouTube video player for post"
              ></iframe>
            </div>
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        {itemLink && (
          <Link href={itemLink} target={isExternalLink ? "_blank" : "_self"} rel={isExternalLink ? "noopener noreferrer" : ""}>
            <h2 className="text-xl font-clash text-white hover:text-coc-gold transition-colors leading-tight">{title}</h2>
          </Link>
        )}
        <ContentRenderer content={content} />

        {!isItemVideo && post?.baseLinkUrl && post?.category === 'Base Building' && (
            <div className="pt-3 border-t border-coc-gold-dark/20">
              {/* Pakai kamus */}
              <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1"><HomeIcon className="h-4 w-4"/> {t.knowledgeHub.detail.actions.baseLinkHeader}</h4>
              <a href={post.baseLinkUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" className="w-full">
                  <LinkIcon className="h-4 w-4 mr-2" /> 
                  {/* Pakai kamus */}
                  {t.knowledgeHub.detail.actions.copyBaseLink}
                </Button>
              </a>
            </div>
          )}
          {!isItemVideo && post?.troopLink && post?.category === 'Strategi Serangan' && (
            <div className="pt-3 border-t border-coc-gold-dark/20">
              {/* Pakai kamus */}
              <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1"><CogsIcon className="h-4 w-4"/> {t.knowledgeHub.detail.actions.troopLinkHeader}</h4>
              <a href={post.troopLink} target="_blank" rel="noopener noreferrer">
                 <Button variant="secondary" size="sm" className="w-full">
                  <LinkIcon className="h-4 w-4 mr-2" /> 
                  {/* Pakai kamus */}
                  {t.knowledgeHub.detail.actions.copyArmyLink}
                </Button>
              </a>
            </div>
          )}
          {isItemVideo && (
            <div className="pt-3 border-t border-coc-gold-dark/20">
              <a href={itemLink || '#'} target="_blank" rel="noopener noreferrer">
                <Button variant="secondary" size="sm" className="w-full bg-coc-red/20 text-coc-red hover:bg-coc-red/30 border-coc-red/30">
                  {/* Pakai kamus */}
                  {t.knowledgeHub.detail.actions.watchYoutube}
                </Button>
              </a>
            </div>
          )}
      </div>

      <footer className="p-4 border-t border-coc-gold-dark/20 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {tags && tags.length > 0 ? tags.map((tag, index) => (
            <span key={index} className="px-2 py-0.5 font-semibold bg-coc-stone-light text-coc-gold rounded-sm border border-coc-gold-dark/30">
              #{tag.toUpperCase()}
            </span>
          )) : (
            <span className="px-2 py-0.5 font-semibold bg-gray-500/30 text-gray-400 rounded-sm">
                {/* Pakai kamus */}
                {t.knowledgeHub.detail.meta.noTags}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-gray-400">
          <button 
            className={`flex items-center gap-1 transition-colors ${
              userHasLiked
                ? 'text-coc-gold hover:text-coc-gold-light'
                : 'text-gray-400 hover:text-coc-gold'
            } ${isLiking ? 'opacity-50 cursor-wait' : ''}`}
            disabled={isItemVideo || isLiking}
            onClick={handleLike}
          >
            <ThumbsUpIcon className={`h-4 w-4 ${userHasLiked ? 'fill-current' : ''}`} /> 
            {isItemVideo ? 'N/A' : `${likeCount} ${t.knowledgeHub.detail.meta.likes}`}
          </button>

          {isItemVideo ? (
            <span className="flex items-center gap-1 text-gray-600">
               {replies} {t.knowledgeHub.detail.actions.reply}
            </span>
          ) : (
            <Link href={`/knowledge-hub/${post?.id}#comments`} className="flex items-center gap-1 hover:text-coc-gold transition-colors">
               {replies} {t.knowledgeHub.detail.actions.reply}
            </Link>
          )}
        </div>
      </footer>
    </article>
  );
};

export default FullPostDisplay;