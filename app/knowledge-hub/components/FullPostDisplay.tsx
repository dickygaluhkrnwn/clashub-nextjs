'use client';

import React, { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
// PERBAIKAN: Impor tipe gabungan
import { Post, Video, KnowledgeHubItem, UserProfile } from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import { formatDistanceToNowStrict } from 'date-fns'; // Use formatDistanceToNowStrict for relative time
import { id } from 'date-fns/locale';
import {
    ClockIcon, UserCircleIcon, LinkIcon, ThumbsUpIcon, HomeIcon, CogsIcon
    // MessageSquareIcon removed as it doesn't exist in the provided icons file
} from '@/app/components/icons'; // Import necessary icons
// PERBAIKAN: Impor helper isVideo
import { isVideo } from '@/lib/knowledge-hub-utils';

// --- Helper Functions (Tetap sama) ---

/**
 * Extracts YouTube Video ID from various URL formats.
 * (Digunakan untuk Post, BUKAN untuk Video)
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
const ContentRenderer = ({ content }: { content: string | undefined }) => {
    // Handle konten yang mungkin undefined (dari Video)
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

// --- Component Props ---
interface FullPostDisplayProps {
    // PERBAIKAN: Menerima tipe gabungan
    item: KnowledgeHubItem;
    // className?: string; // Optional className prop if needed later
}

// --- Main Component ---
const FullPostDisplay: React.FC<FullPostDisplayProps> = ({ item }) => {

    // --- GUARD CLAUSE: PASTIKAN ITEM VALID ---
    // Jika item null/undefined, hentikan render
    if (!item) return null;
    
    // --- Cek Tipe Item ---
    const isItemVideo = isVideo(item);

    // Pisahkan item menjadi Post atau Video
    // Casting di sini aman KARENA kita sudah melakukan guard clause di atas.
    const post = isItemVideo ? null : (item as Post);
    const video = isItemVideo ? (item as Video) : null;

    // --- Data Universal ---
    // PERBAIKAN KRITIS: Gunakan optional chaining (?.) untuk mengakses properti,
    // terutama pada 'post' dan 'video' yang bisa null sesuai ternary operator di atas.
    const authorId = isItemVideo ? video?.channelId : post?.authorId;
    const authorName = isItemVideo ? video?.channelTitle : post?.authorName;
    
    // PERBAIKAN: Avatar untuk Video adalah thumbnail-nya, untuk Post adalah authorAvatarUrl
    const authorAvatar = isItemVideo ? video?.thumbnailUrl : (post?.authorAvatarUrl || '/images/placeholder-avatar.png');
    // FIX: Gunakan optional chaining untuk authorId dan videoId
    const authorHref = isItemVideo ? `https://www.youtube.com/channel/${video?.channelId}` : `/player/${post?.authorId}`;
    
    const category = item.category;
    const title = item.title;
    // Link utama item (Tujuan klik judul)
    // FIX: Gunakan optional chaining untuk id/videoId
    const itemLink = isItemVideo ? `https://www.youtube.com/watch?v=${video?.videoId}` : `/knowledge-hub/${post?.id}`;
    
    // Tipe link (internal atau eksternal)
    const isExternalLink = isItemVideo;

    const timeAgo = useMemo(() => {
        try {
            // PERBAIKAN ERROR TS2769: Fallback ke 0 jika publishedAt/createdAt tidak tersedia
            // Nilai 0 di new Date(0) merepresentasikan Epoch time yang valid.
            const dateValue = isItemVideo ? video?.publishedAt : post?.createdAt;
            
            // Menggunakan operator coalescing (??) untuk memastikan dateValue bukanlah null/undefined
            const itemDate = new Date(dateValue ?? 0); 
            
            // PERBAIKAN ERROR TS2367: Ganti 'dateValue === 0' menjadi 'itemDate.getTime() === 0'
            if (isNaN(itemDate.getTime()) || itemDate.getTime() === 0) {
                return 'Tanggal Tidak Valid';
            }
            return formatDistanceToNowStrict(itemDate, { addSuffix: true, locale: id });
        } catch (e) {
            console.error("Error formatting date:", e);
            return 'Invalid date';
        }
    }, [isItemVideo, post, video]); // Dependencies diupdate

    // --- Data Media (Video Embed atau Gambar Post) ---
    const videoIdFromPost = getYouTubeVideoId(post?.videoUrl);
    
    const displayMedia = useMemo(() => {
        // Prioritas 1: Jika item adalah Video, tampilkan video embed
        if (isItemVideo) {
            // FIX: Gunakan optional chaining
            return { type: 'video', id: video?.videoId };
        }
        // Prioritas 2: Jika item adalah Post dan punya imageUrl
        if (post?.imageUrl) {
            return { type: 'image', url: post.imageUrl };
        } 
        // Prioritas 3: Jika item adalah Post dan punya videoUrl
        else if (videoIdFromPost) {
            return { type: 'video', id: videoIdFromPost };
        } 
        // Prioritas 4: Jika item adalah Post dan punya baseImageUrl
        else if (post?.baseImageUrl) {
            return { type: 'baseImage', url: post.baseImageUrl };
        }
        return null; // Tidak ada media
    }, [isItemVideo, video, post, videoIdFromPost]); // Dependencies diupdate

    const postImageFallback = '/images/baseth12-placeholder.png';

    // --- Data Konten (Deskripsi) ---
    // FIX: Gunakan optional chaining
    const content = isItemVideo ? video?.description : post?.content;

    // --- Data Footer ---
    // FIX: Gunakan optional chaining
    const tags = isItemVideo ? [video?.channelTitle || 'YouTube'] : post?.tags;
    const likes = isItemVideo ? 'N/A' : post?.likes;
    const replies = isItemVideo ? 'N/A' : post?.replies;


    return (
        <article className="card-stone rounded-lg overflow-hidden shadow-lg border border-coc-gold-dark/20">
            {/* Header: Author Info */}
            <header className="flex items-center gap-3 p-4 bg-coc-stone-light/50 border-b border-coc-gold-dark/20">
                {/* FIX: Pastikan authorHref valid */}
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
                                e.currentTarget.src = '/images/placeholder-avatar.png'; // Final fallback
                              }}
                        />
                    </Link>
                )}
                <div className="flex-grow">
                    {/* FIX: Pastikan authorHref valid */}
                    {authorHref && (
                        <Link href={authorHref} target={isExternalLink ? "_blank" : "_self"} rel={isExternalLink ? "noopener noreferrer" : ""} className="font-bold text-white hover:underline text-sm font-clash">
                            {authorName || 'Kontributor Anonim'}
                        </Link>
                    )}
                    <p className="text-xs text-gray-400 font-sans flex items-center gap-1">
                        <ClockIcon className="h-3 w-3" /> {timeAgo} • Kategori: <span className="font-semibold text-coc-gold-dark">{category}</span>
                    </p>
                </div>
                {/* Optional: Add a 'more options' button here later */}
            </header>

            {/* Media Section */}
            {displayMedia && (
                <div className="relative w-full bg-black/20">
                    {(displayMedia.type === 'image' || displayMedia.type === 'baseImage') && (
                        <div className="relative w-full aspect-video"> {/* Maintain aspect ratio */}
                             <Image
                                src={(displayMedia as { url: string }).url || postImageFallback}
                                alt={`Media for ${title}`}
                                layout="fill"
                                objectFit="contain" // Use 'contain' to show the whole image
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
                {/* FIX: Pastikan itemLink valid */}
                {itemLink && (
                    <Link href={itemLink} target={isExternalLink ? "_blank" : "_self"} rel={isExternalLink ? "noopener noreferrer" : ""}>
                        <h2 className="text-xl font-clash text-white hover:text-coc-gold transition-colors leading-tight">{title}</h2>
                    </Link>
                )}
                {/* Render the main content (deskripsi post atau video) */}
                <ContentRenderer content={content} />

                {/* Specific Links Section (Hanya untuk Post) */}
                {!isItemVideo && post?.baseLinkUrl && post?.category === 'Base Building' && (
                     <div className="pt-3 border-t border-coc-gold-dark/20">
                         <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1"><HomeIcon className="h-4 w-4"/> BASE LINK:</h4>
                         <a href={post.baseLinkUrl} target="_blank" rel="noopener noreferrer">
                             <Button variant="secondary" size="sm" className="w-full">
                                 <LinkIcon className="h-4 w-4 mr-2" /> Salin Link Base
                             </Button>
                         </a>
                     </div>
                 )}
                 {!isItemVideo && post?.troopLink && post?.category === 'Strategi Serangan' && (
                     <div className="pt-3 border-t border-coc-gold-dark/20">
                         <h4 className="text-xs font-bold text-gray-400 mb-2 flex items-center gap-1"><CogsIcon className="h-4 w-4"/> TROOP LINK:</h4>
                         <a href={post.troopLink} target="_blank" rel="noopener noreferrer">
                              <Button variant="secondary" size="sm" className="w-full">
                                 <LinkIcon className="h-4 w-4 mr-2" /> Salin Komposisi Pasukan
                             </Button>
                         </a>
                     </div>
                 )}
                 {/* Link eksternal untuk Video */}
                 {isItemVideo && (
                     <div className="pt-3 border-t border-coc-gold-dark/20">
                         <a href={itemLink || '#'} target="_blank" rel="noopener noreferrer">
                             <Button variant="secondary" size="sm" className="w-full bg-coc-red/20 text-coc-red hover:bg-coc-red/30 border-coc-red/30">
                                 Tonton di YouTube
                             </Button>
                         </a>
                     </div>
                 )}
            </div>

            {/* Footer: Tags & Stats */}
            <footer className="p-4 border-t border-coc-gold-dark/20 flex flex-wrap items-center justify-between gap-y-2 gap-x-4 text-xs">
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                    {tags && tags.length > 0 ? tags.map((tag, index) => (
                        <span key={index} className="px-2 py-0.5 font-semibold bg-coc-stone-light text-coc-gold rounded-sm border border-coc-gold-dark/30">
                            #{tag.toUpperCase()}
                        </span>
                    )) : (
                        <span className="px-2 py-0.5 font-semibold bg-gray-500/30 text-gray-400 rounded-sm">#TAG_TIDAK_TERSEDIA</span>
                    )}
                </div>
                {/* Stats & Actions */}
                <div className="flex items-center gap-4 text-gray-400">
                    <button className="flex items-center gap-1 hover:text-coc-gold transition-colors" disabled={isItemVideo}>
                        <ThumbsUpIcon className="h-4 w-4" /> {likes}
                    </button>
                    {/* Link ke komentar hanya untuk Post, nonaktifkan untuk Video */}
                    {isItemVideo ? (
                        <span className="flex items-center gap-1 text-gray-600">
                           {replies} Balasan
                        </span>
                    ) : (
                        <Link href={`/knowledge-hub/${post?.id}#comments`} className="flex items-center gap-1 hover:text-coc-gold transition-colors">
                            {replies} Balasan
                        </Link>
                    )}
                </div>
            </footer>
        </article>
    );
};

export default FullPostDisplay;

