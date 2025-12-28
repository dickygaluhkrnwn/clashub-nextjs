// File: app/api/youtube/sync/route.ts
// Deskripsi: API Route untuk sinkronisasi video YouTube terbaru ke Firestore.
// UPDATE: Menggunakan Parallel Processing untuk menghindari Timeout dan menonaktifkan Cache fetch.

import { NextRequest, NextResponse } from 'next/server';
import { adminFirestore } from '@/lib/firebase-admin'; // Firebase Admin SDK
import { Timestamp as AdminTimestamp } from 'firebase-admin/firestore';
import { Video, PostCategory } from '@/lib/types'; // Tipe data Video dari types.ts
import { COLLECTIONS } from '@/lib/firestore-collections'; // Nama koleksi Firestore

// Memastikan route ini selalu dinamis (tidak di-cache static oleh Next.js)
export const dynamic = 'force-dynamic';

// --- Konfigurasi ---
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const MAX_RESULTS_PER_CHANNEL = 5; // Ambil 5 video terbaru per channel

// Daftar Channel YouTube Supercell yang akan dipantau
// CATATAN: Channel lain bisa ditambahkan nanti. Sistem akan memproses apa saja yang ada di list ini.
const CHANNELS_TO_SYNC = [
    {
        playlistId: 'UUD1Em4q90ZUK2R5HKesszJg', // ID Playlist Uploads Clash of Clans
        channelTitle: 'Clash of Clans',
        channelId: 'UCD1Em4q90ZUK2R5HKesszJg'
    },
    // --- TEMPLATE UNTUK CHANNEL LAIN (Uncomment & Isi jika sudah siap) ---
    // {
    //   playlistId: 'UU...', // ID Playlist Uploads Clash Royale
    //   channelTitle: 'Clash Royale',
    //   channelId: 'UC...'
    // },
    // {
    //   playlistId: 'UU...', // ID Playlist Uploads Brawl Stars
    //   channelTitle: 'Brawl Stars',
    //   channelId: 'UC...'
    // }
];

// Kunci rahasia untuk memicu manual via URL
const SYNC_SECRET = process.env.YOUTUBE_SYNC_SECRET || 'ganti-dengan-secret-anda';

// --- Tipe Data Respons YouTube API ---
interface YouTubePlaylistItem {
    kind: string;
    etag: string;
    id: string;
    snippet: {
        publishedAt: string;
        channelId: string;
        title: string;
        description: string;
        thumbnails: {
            [key: string]: { url: string; width: number; height: number; };
        };
        channelTitle: string;
        playlistId: string;
        position: number;
        resourceId: {
            kind: string;
            videoId: string;
        };
    };
}

interface YouTubePlaylistItemsResponse {
    items: YouTubePlaylistItem[];
}

// --- Fungsi Helper ---

/**
 * Mengambil video terbaru dari playlist YouTube.
 * UPDATE: Cache dimatikan (no-store) agar cronjob selalu mendapat data fresh.
 */
async function getLatestVideosFromPlaylist(playlistId: string, apiKey: string, maxResults: number): Promise<YouTubePlaylistItem[]> {
    const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}`;

    // console.log(`[YouTube Sync] Fetching playlist items: ${playlistId}`);
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
        cache: 'no-store' // PENTING: Jangan cache request ini untuk Cronjob
    });

    if (!response.ok) {
        const errorData = await response.json();
        console.error(`[YouTube Sync] Error fetching playlist ${playlistId}:`, response.status, errorData);
        throw new Error(`YouTube API error (${response.status}): ${errorData?.error?.message || 'Failed to fetch playlist items'}`);
    }

    const data: YouTubePlaylistItemsResponse = await response.json();
    return data.items || [];
}

/**
 * Menyimpan/Update video ke Firestore.
 */
async function saveVideoToFirestore(videoData: Omit<Video, 'id'>): Promise<{ status: 'added' | 'updated' | 'skipped' | 'error', id: string }> {
    const videoRef = adminFirestore.collection(COLLECTIONS.VIDEOS).doc(videoData.videoId);

    try {
        const docSnap = await videoRef.get();

        const dataToSave = {
            ...videoData,
            publishedAt: AdminTimestamp.fromDate(videoData.publishedAt),
        };

        if (!docSnap.exists) {
            await videoRef.set(dataToSave);
            return { status: 'added', id: videoData.videoId };
        } else {
            // Cek perubahan data (Title/Thumbnail)
            const existingData = docSnap.data();
            if (existingData?.title !== videoData.title || existingData?.thumbnailUrl !== videoData.thumbnailUrl) {
                await videoRef.update(dataToSave);
                return { status: 'updated', id: videoData.videoId };
            }
            return { status: 'skipped', id: videoData.videoId };
        }
    } catch (error) {
        console.error(`[Firestore Sync] Error saving video ${videoData.videoId}:`, error);
        return { status: 'error', id: videoData.videoId };
    }
}

/**
 * Memproses satu channel (Fetching -> Saving)
 * Dipisahkan agar bisa dijalankan secara paralel.
 */
async function processChannel(channel: typeof CHANNELS_TO_SYNC[0], apiKey: string) {
    const results = {
        channel: channel.channelTitle,
        added: 0,
        updated: 0,
        skipped: 0,
        errors: 0,
        details: [] as any[]
    };

    try {
        const latestVideos = await getLatestVideosFromPlaylist(channel.playlistId, apiKey, MAX_RESULTS_PER_CHANNEL);

        // Proses video satu per satu (bisa diparalel juga jika perlu, tapi sequential per channel cukup aman untuk DB)
        for (const item of latestVideos) {
            if (!item.snippet?.resourceId?.videoId) continue;

            const videoData: Omit<Video, 'id'> = {
                videoId: item.snippet.resourceId.videoId,
                title: item.snippet.title,
                description: item.snippet.description.substring(0, 500) + (item.snippet.description.length > 500 ? '...' : ''),
                thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url || '',
                publishedAt: new Date(item.snippet.publishedAt),
                channelTitle: channel.channelTitle,
                channelId: channel.channelId,
                category: 'Berita Komunitas' as PostCategory, // Casting ke tipe yang benar
                source: 'YouTube',
            };

            const saveResult = await saveVideoToFirestore(videoData);
            
            if (saveResult.status === 'added') results.added++;
            else if (saveResult.status === 'updated') results.updated++;
            else if (saveResult.status === 'skipped') results.skipped++;
            else results.errors++;

            results.details.push({ id: saveResult.id, status: saveResult.status });
        }
    } catch (error) {
        console.error(`[YouTube Sync] Failed channel ${channel.channelTitle}:`, error);
        results.errors++; // Tandai channel error
        throw error; // Lempar error agar ditangkap Promise.allSettled
    }

    return results;
}

// --- Handler API Route ---
export async function GET(request: NextRequest) {
    // Auth Check
    const authHeader = request.headers.get('authorization');
    const secretParam = request.nextUrl.searchParams.get('secret');
    
    // Support Bearer token (untuk Cron) atau Query Param (untuk manual)
    const isAuthorized = 
        (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) ||
        (secretParam === SYNC_SECRET);

    if (process.env.NODE_ENV === 'production' && !isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!YOUTUBE_API_KEY) {
        return NextResponse.json({ error: 'YouTube API Key missing' }, { status: 500 });
    }

    console.log('[YouTube Sync] Starting Parallel Sync...');
    const startTime = Date.now();

    // EKSEKUSI PARALEL: Jalankan semua channel sekaligus
    const promises = CHANNELS_TO_SYNC.map(channel => processChannel(channel, YOUTUBE_API_KEY!));
    const results = await Promise.allSettled(promises);

    // Agregasi Hasil
    let totalAdded = 0;
    let totalUpdated = 0;
    let totalErrors = 0;
    const summary = results.map((res, index) => {
        if (res.status === 'fulfilled') {
            totalAdded += res.value.added;
            totalUpdated += res.value.updated;
            totalErrors += res.value.errors;
            return { status: 'success', data: res.value };
        } else {
            totalErrors++;
            return { status: 'error', channel: CHANNELS_TO_SYNC[index].channelTitle, message: String(res.reason) };
        }
    });

    const duration = (Date.now() - startTime) / 1000;
    const message = `Sync complete in ${duration}s. Added: ${totalAdded}, Updated: ${totalUpdated}.`;
    
    console.log(`[YouTube Sync] ${message}`);

    return NextResponse.json({
        message,
        results: summary
    }, { status: totalErrors > 0 && totalAdded === 0 ? 500 : 200 });
}