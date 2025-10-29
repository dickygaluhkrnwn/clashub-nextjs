'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Post, UserProfile } from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import { formatDistanceToNowStrict } from 'date-fns'; // Use formatDistanceToNowStrict for relative time
import { id } from 'date-fns/locale';
import {
    ClockIcon, UserCircleIcon, LinkIcon, ThumbsUpIcon, HomeIcon, CogsIcon
    // MessageSquareIcon removed as it doesn't exist in the provided icons file
} from '@/app/components/icons'; // Import necessary icons

// --- Helper Functions ---

/**
 * Extracts YouTube Video ID from various URL formats.
 * @param url - The YouTube URL.
 * @returns The video ID or null if not found.
 */
const getYouTubeVideoId = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)(\w+)/i;
    const match = url.match(regex);
    return match ? match[1] : null;
};

/**
 * Renders post content, handling line breaks.
 */
const ContentRenderer = ({ content }: { content: string }) => {
    const contentParts = useMemo(() => {
        return content.split('\n').map((line, index, arr) => (
            <React.Fragment key={index}>
                {line}
                {index < arr.length - 1 && <br />}
            </React.Fragment>
        ));
    }, [content]);
    return <p className="text-gray-300 text-sm font-sans leading-relaxed">{contentParts}</p>;
};

// --- Component Props ---
interface FullPostDisplayProps {
    post: Post;
    // className?: string; // Optional className prop if needed later
}

// --- Main Component ---
const FullPostDisplay: React.FC<FullPostDisplayProps> = ({ post }) => {

    const timeAgo = useMemo(() => {
        try {
            // Ensure createdAt is a Date object
            const createdAtDate = post.createdAt instanceof Date ? post.createdAt : new Date(post.createdAt);
            if (isNaN(createdAtDate.getTime())) {
                return 'Invalid date';
            }
            return formatDistanceToNowStrict(createdAtDate, { addSuffix: true, locale: id });
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Invalid date';
        }
    }, [post.createdAt]);

    const videoId = getYouTubeVideoId(post.videoUrl);
    // Provide explicit fallback for authorAvatar right here to ensure it's always a string
    const authorAvatar = post.authorAvatarUrl || '/images/placeholder-avatar.png';

    // Determine which media to display based on priority
    const displayMedia = useMemo(() => {
        if (post.imageUrl) {
            return { type: 'image', url: post.imageUrl };
        } else if (videoId) {
            return { type: 'video', id: videoId };
        } else if (post.baseImageUrl) {
            return { type: 'baseImage', url: post.baseImageUrl };
        }
        return null; // No primary media
    }, [post.imageUrl, videoId, post.baseImageUrl]);

    // Define a fallback image URL for posts, e.g., a generic placeholder or the base placeholder
    const postImageFallback = '/images/baseth12-placeholder.png'; // Example fallback

    return (
        <article className="card-stone rounded-lg overflow-hidden shadow-lg border border-coc-gold-dark/20">
            {/* Header: Author Info */}
            <header className="flex items-center gap-3 p-4 bg-coc-stone-light/50 border-b border-coc-gold-dark/20">
                <Link href={`/player/${post.authorId}`} className="flex-shrink-0">
                    <Image
                        // Use the authorAvatar variable which already includes the fallback
                        src={authorAvatar}
                        alt={`${post.authorName}'s avatar`}
                        width={40}
                        height={40}
                        className="rounded-full border-2 border-coc-gold object-cover"
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/images/placeholder-avatar.png'; // Final fallback
                          }}
                    />
                </Link>
                <div className="flex-grow">
                    <Link href={`/player/${post.authorId}`} className="font-bold text-white hover:underline text-sm font-clash">
                        {post.authorName}
                    </Link>
                    <p className="text-xs text-gray-400 font-sans flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" /> {timeAgo} • Kategori: <span className="font-semibold text-coc-gold-dark">{post.category}</span>
                    </p>
                </div>
                {/* Optional: Add a 'more options' button here later */}
            </header>

            {/* Media Section */}
            {displayMedia && (
                <div className="relative w-full bg-black/20">
                    {displayMedia.type === 'image' && (
                        <div className="relative w-full aspect-video"> {/* Maintain aspect ratio */}
                             <Image
                                // Provide fallback directly in src prop
                                src={displayMedia.url || postImageFallback}
                                alt={`Post image for ${post.title}`}
                                layout="fill"
                                objectFit="contain" // Use 'contain' to show the whole image
                                className="bg-black/20"
                                loading="lazy"
                                onError={(e) => { // Basic fallback display on error
                                    e.currentTarget.onerror = null; // Prevent infinite loop if fallback fails
                                    e.currentTarget.src = postImageFallback; // Ensure fallback is set
                                    e.currentTarget.style.objectFit = 'cover'; // Adjust fit for placeholder
                                }}
                            />
                        </div>
                    )}
                     {displayMedia.type === 'baseImage' && ( // Handle base image separately if needed, same logic for now
                        <div className="relative w-full aspect-video">
                            <Image
                                // Provide fallback directly in src prop
                                src={displayMedia.url || postImageFallback}
                                alt={`Base image for ${post.title}`}
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
                        <div className="relative w-full aspect-video"> {/* YouTube uses 16:9 */}
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

            {/* Content Section */}
            <div className="p-4 space-y-3">
                <Link href={`/knowledge-hub/${post.id}`}>
                    <h2 className="text-xl font-clash text-white hover:text-coc-gold transition-colors leading-tight">{post.title}</h2>
                </Link>
                {/* Render the main content */}
                <ContentRenderer content={post.content} />

                {/* Specific Links Section */}
                {post.baseLinkUrl && post.category === 'Base Building' && (
                     <div className="pt-3 border-t border-coc-gold-dark/20">
                         <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1"><HomeIcon className="h-4 w-4"/> BASE LINK:</h4>
                         <a href={post.baseLinkUrl} target="_blank" rel="noopener noreferrer">
                             <Button variant="secondary" size="sm" className="w-full">
                                 <LinkIcon className="h-4 w-4 mr-2" /> Salin Link Base
                             </Button>
                         </a>
                     </div>
                 )}
                 {post.troopLink && post.category === 'Strategi Serangan' && (
                     <div className="pt-3 border-t border-coc-gold-dark/20">
                         <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1"><CogsIcon className="h-4 w-4"/> TROOP LINK:</h4>
                         <a href={post.troopLink} target="_blank" rel="noopener noreferrer">
                              <Button variant="secondary" size="sm" className="w-full">
                                 <LinkIcon className="h-4 w-4 mr-2" /> Salin Komposisi Pasukan
                             </Button>
                         </a>
                     </div>
                 )}
            </div>

            {/* Footer: Tags & Stats */}
            <footer className="p-4 border-t border-coc-gold-dark/20 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs">
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                    {post.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-0.5 font-semibold bg-coc-stone-light text-coc-gold rounded-sm border border-coc-gold-dark/30">
                            #{tag.toUpperCase()}
                        </span>
                    ))}
                </div>
                {/* Stats & Actions (Placeholder Buttons) */}
                <div className="flex items-center gap-4 text-gray-400">
                    <button className="flex items-center gap-1 hover:text-coc-gold transition-colors">
                        <ThumbsUpIcon className="h-4 w-4" /> {post.likes}
                    </button>
                    {/* Removed MessageSquareIcon */}
                    <Link href={`/knowledge-hub/${post.id}#comments`} className="flex items-center gap-1 hover:text-coc-gold transition-colors">
                         {post.replies} Balasan
                    </Link>
                </div>
            </footer>
        </article>
    );
};

export default FullPostDisplay;

