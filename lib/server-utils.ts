// File: lib/server-utils.ts
// Deskripsi: Kumpulan fungsi utilitas yang dijalankan HANYA di sisi server (misal: API Routes).

import { getManagedClans } from "@/lib/firestore"; // Menggunakan absolute path
import { ManagedClan } from "@/lib/types"; // Menggunakan absolute path

/**
 * @function getRecommendedTeams
 * Mengambil dan memilih klan secara acak untuk direkomendasikan di halaman utama.
 * Logika ini berjalan di Server Component (SSR).
 * @returns Array 5 klan internal terbaik atau klan acak.
 */
export async function getRecommendedTeams(): Promise<ManagedClan[]> { 
    try {
        const allClans = await getManagedClans(); 

        // 1. Prioritaskan klan dengan logo/website yang diisi (proxy rating)
        const prioritizedClans = allClans
            .filter(clan => clan.logoUrl || clan.website) 
            .sort((a, b) => b.avgTh - a.avgTh); 

        // 2. Ambil 5 klan dari yang diprioritaskan
        let selectedClans: ManagedClan[] = prioritizedClans.slice(0, 5);

        // 3. Jika kurang dari 5, tambahkan klan lain secara acak
        if (selectedClans.length < 5) {
            const remainingNeeded = 5 - selectedClans.length;
            const remainingClans = allClans.filter(clan => !selectedClans.find(s => s.id === clan.id));
            
            // Logika shuffle/acak dasar
            for (let i = 0; i < remainingNeeded && remainingClans.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * remainingClans.length);
                selectedClans.push(remainingClans.splice(randomIndex, 1)[0]);
            }
        }
        
        return selectedClans;
    } catch (error) {
        console.error("Failed to fetch recommended clans:", error);
        // Mengembalikan array kosong jika terjadi error agar halaman tidak crash
        return []; 
    }
}

/**
 * @function getClanTagsToMonitor
 * Mengambil daftar Clan Tags yang harus dimonitor dan di-cache secara berkala 
 * oleh Cron Job (Public Index).
 * @returns {string[]} Array of raw clan tags (termasuk '#').
 */
export function getClanTagsToMonitor(): string[] {
    // Implementasi placeholder menggunakan Tag Klan internal (GBK Crew & GBK Squad) 
    // sesuai blueprint Dasboard Clan CoC - Main - Pengaturan.csv.
    return [
        '#2G8PU0GLJ', // GBK Crew
        '#2GQ9R8Y2R', // GBK Squad
        // Daftar ini akan di-update secara otomatis oleh Cron Job.
    ];
}
