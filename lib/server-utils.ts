import { getManagedClans } from "./firestore"; // PERBAIKAN #1: Mengganti getTeams
import { ManagedClan } from "./types"; // PERBAIKAN #2: Mengganti Team dengan ManagedClan

/**
 * Mengambil dan memilih klan secara acak untuk direkomendasikan di halaman utama.
 * Logika ini berjalan di Server Component (SSR).
 * @returns Array 5 klan internal terbaik atau klan acak.
 */
export async function getRecommendedTeams(): Promise<ManagedClan[]> { // PERBAIKAN #3: Mengganti Team[] dengan ManagedClan[]
    try {
        const allClans = await getManagedClans(); // PERBAIKAN #4: Memanggil getManagedClans

        // 1. Prioritaskan klan dengan rating tertinggi (kita menggunakan rating placeholder 5.0 di ManagedClan)
        // Kita akan menggunakan rata-rata TH tertinggi sebagai proxy rating, atau hanya klan dengan logo/website yang diisi.
        const prioritizedClans = allClans
            .filter(clan => clan.logoUrl || clan.website) // Filter hanya klan yang lebih lengkap datanya
            .sort((a, b) => b.avgTh - a.avgTh); // Urutkan dari rata-rata TH tertinggi

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
