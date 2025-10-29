// File: app/api/youtube/sync/route.ts
// Deskripsi: API Route untuk sinkronisasi video YouTube terbaru ke Firestore.
// Dipicu manual (untuk dev) atau oleh Vercel Cron Job (di production).

import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin'; // Firebase Admin SDK
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
// PERBAIKAN: Import PostCategory juga
import { Video, VideoCategory, PostCategory } from '@/lib/types'; // Tipe data Video dari types.ts
import { COLLECTIONS } from '@/lib/firestore-collections'; // Nama koleksi Firestore

// --- Konfigurasi ---
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const MAX_RESULTS_PER_CHANNEL = 5; // Ambil 5 video terbaru per channel

// Daftar Channel YouTube Supercell yang akan dipantau
// Ganti dengan ID Playlist "Uploads" yang benar untuk setiap channel
const CHANNELS_TO_SYNC = [
    {
        playlistId: 'UUD1Em4q90ZUK2R5HKesszJg', // <-- ID Playlist Uploads Clash of Clans (Diperbarui)
        // category: 'Clash of Clans' as VideoCategory, // Ini tidak lagi digunakan untuk Firestore category
        channelTitle: 'Clash of Clans', // Nama channel untuk metadata
        channelId: 'UCD1Em4q90ZUK2R5HKesszJg' // <-- ID Channel Clash of Clans (Diperbarui)
    },
    // {
    //   playlistId: 'ID_PLAYLIST_BRAWL_STARS', // Ganti dengan ID Playlist Uploads Brawl Stars
    //   // category: 'Brawl Stars' as VideoCategory,
    //   channelTitle: 'Brawl Stars',
    //   channelId: 'ID_CHANNEL_BRAWL_STARS'
    // },
    // Tambahkan channel lain di sini jika perlu
];

// Kunci rahasia sederhana untuk memicu manual (opsional, bisa diganti mekanisme auth lain)
const SYNC_SECRET = process.env.YOUTUBE_SYNC_SECRET || 'ganti-dengan-secret-anda';

// --- Tipe Data Respons YouTube API (PlaylistItems) ---
interface YouTubePlaylistItem {
    kind: string;
    etag: string;
    id: string;
    snippet: {
        publishedAt: string; // ISO 8601 date string
        channelId: string;
        title: string;
        description: string;
        thumbnails: {
            [key: string]: { // default, medium, high, standard, maxres
                url: string;
                width: number;
                height: number;
            };
        };
        channelTitle: string;
        playlistId: string;
        position: number;
        resourceId: {
            kind: string;
            videoId: string;
        };
        videoOwnerChannelTitle: string;
        videoOwnerChannelId: string;
    };
}

interface YouTubePlaylistItemsResponse {
    kind: string;
    etag: string;
    nextPageToken?: string;
    prevPageToken?: string;
    pageInfo: {
        totalResults: number;
        resultsPerPage: number;
    };
    items: YouTubePlaylistItem[];
}

// --- Fungsi Helper ---

/**
 * Mengambil video terbaru dari playlist YouTube tertentu.
 */
async function getLatestVideosFromPlaylist(playlistId: string, apiKey: string, maxResults: number): Promise<YouTubePlaylistItem[]> {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}`;

    console.log(`[YouTube Sync] Fetching playlist items: ${playlistId}`);
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
        next: { revalidate: 3600 } // Cache API call for 1 hour
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error(`[YouTube Sync] Error fetching playlist ${playlistId}:`, response.status, errorData);
        throw new Error(`YouTube API error (${response.status}): ${errorData?.error?.message || 'Failed to fetch playlist items'}`);
    }

    const data: YouTubePlaylistItemsResponse = await response.json();
    console.log(`[YouTube Sync] Fetched ${data.items.length} items from playlist ${playlistId}`);
    return data.items || [];
}

/**
 * Menyimpan atau memperbarui data video ke Firestore.
 * Menggunakan videoId sebagai ID dokumen untuk mencegah duplikasi.
 */
async function saveVideoToFirestore(videoData: Omit<Video, 'id'>): Promise<{ status: 'added' | 'updated' | 'skipped' | 'error', id: string }> {
    const videoRef = adminFirestore.collection(COLLECTIONS.VIDEOS).doc(videoData.videoId); // Gunakan videoId sebagai ID dokumen

    try {
        const docSnap = await videoRef.get();

        const dataToSave = {
            ...videoData,
            // Konversi Date ke Firestore Timestamp sebelum menyimpan
            publishedAt: AdminTimestamp.fromDate(videoData.publishedAt),
        };

        if (!docSnap.exists) {
            await videoRef.set(dataToSave);
            console.log(`[Firestore Sync] Added video: ${videoData.videoId} - ${videoData.title}`);
            return { status: 'added', id: videoData.videoId };
        } else {
            // Video sudah ada, cek apakah perlu diupdate (misal judul berubah)
            const existingData = docSnap.data();
            if (existingData?.title !== videoData.title || existingData?.thumbnailUrl !== videoData.thumbnailUrl) {
                await videoRef.update(dataToSave); // Atau set dengan { merge: true }
                console.log(`[Firestore Sync] Updated video: ${videoData.videoId} - ${videoData.title}`);
                return { status: 'updated', id: videoData.videoId };
            }
            console.log(`[Firestore Sync] Skipped video (already exists): ${videoData.videoId}`);
            return { status: 'skipped', id: videoData.videoId };
        }
    } catch (error) {
        console.error(`[Firestore Sync] Error saving video ${videoData.videoId}:`, error);
        return { status: 'error', id: videoData.videoId };
    }
}

// --- Handler API Route ---
export async function GET(request: NextRequest) {
    // Keamanan sederhana (opsional)
    const secret = request.nextUrl.searchParams.get('secret');
    if (process.env.NODE_ENV === 'production' && secret !== SYNC_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!YOUTUBE_API_KEY) {
        console.error('[YouTube Sync] YOUTUBE_API_KEY is not configured.');
        return NextResponse.json({ error: 'YouTube API Key is not configured on the server.' }, { status: 500 });
    }

    console.log('[YouTube Sync] Starting synchronization process...');
    let videosAdded = 0;
    let videosUpdated = 0;
    let videosSkipped = 0;
    let errors = 0;
    const results: { channel: string, status: 'success' | 'error', message: string, details?: any[] }[] = [];

    // Loop melalui setiap channel yang dikonfigurasi
    for (const channel of CHANNELS_TO_SYNC) {
        const channelResultDetails: any[] = [];
        try {
            const latestVideos = await getLatestVideosFromPlaylist(channel.playlistId, YOUTUBE_API_KEY, MAX_RESULTS_PER_CHANNEL);

            for (const item of latestVideos) {
                if (!item.snippet?.resourceId?.videoId) {
                    console.warn(`[YouTube Sync] Skipping item without videoId: ${item.id}`);
                    continue;
                }

                const videoData: Omit<Video, 'id'> = {
                    videoId: item.snippet.resourceId.videoId,
                    title: item.snippet.title,
                    description: item.snippet.description.substring(0, 500) + (item.snippet.description.length > 500 ? '...' : ''), // Ambil deskripsi singkat
                    // Pilih thumbnail kualitas terbaik (misal: high atau standard)
                    thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || '',
                    publishedAt: new Date(item.snippet.publishedAt),
                    channelTitle: channel.channelTitle, // Gunakan nama channel dari config
                    channelId: channel.channelId, // Gunakan ID channel dari config
                    // ----- PERBAIKAN DI SINI -----
                    category: 'Berita Komunitas', // Set kategori ke "Berita Komunitas" (tipe PostCategory)
                    // -----------------------------
                    source: 'YouTube',
                };

                const saveResult = await saveVideoToFirestore(videoData);
                channelResultDetails.push({ videoId: saveResult.id, title: videoData.title, status: saveResult.status });

                if (saveResult.status === 'added') videosAdded++;
                if (saveResult.status === 'updated') videosUpdated++;
                if (saveResult.status === 'skipped') videosSkipped++;
                if (saveResult.status === 'error') errors++;
            }
            results.push({ channel: channel.channelTitle, status: 'success', message: `Synced ${latestVideos.length} items.`, details: channelResultDetails });

        } catch (error) {
            errors++;
            results.push({ channel: channel.channelTitle, status: 'error', message: (error as Error).message });
            console.error(`[YouTube Sync] Failed to sync channel ${channel.channelTitle}:`, error);
            // Lanjutkan ke channel berikutnya jika satu channel gagal
        }
    }

    const summaryMessage = `Sync complete. Added: ${videosAdded}, Updated: ${videosUpdated}, Skipped: ${videosSkipped}, Errors: ${errors}.`;
    console.log(`[YouTube Sync] ${summaryMessage}`);

    return NextResponse.json({
        message: summaryMessage,
        results: results,
    }, { status: errors > 0 ? 500 : 200 });
}
