import { getTeams } from "./firestore";
import { Team } from "./types";

/**
 * Mengambil dan memilih tim secara acak untuk direkomendasikan di halaman utama.
 * Logika ini berjalan di Server Component (SSR).
 * @returns Array 5 tim terbaik atau tim acak.
 */
export async function getRecommendedTeams(): Promise<Team[]> {
    try {
        const allTeams = await getTeams();

        // 1. Prioritaskan tim dengan rating tertinggi (misalnya, di atas 4.5)
        const highRatedTeams = allTeams
            .filter(team => team.rating >= 4.5)
            .sort((a, b) => b.rating - a.rating); // Urutkan dari rating tertinggi

        // 2. Ambil 5 tim dari tim berating tinggi
        let selectedTeams: Team[] = highRatedTeams.slice(0, 5);

        // 3. Jika kurang dari 5, tambahkan tim lain secara acak
        if (selectedTeams.length < 5) {
            const remainingNeeded = 5 - selectedTeams.length;
            const remainingTeams = allTeams.filter(team => !selectedTeams.find(s => s.id === team.id));
            
            // Logika shuffle/acak dasar
            for (let i = 0; i < remainingNeeded && remainingTeams.length > 0; i++) {
                const randomIndex = Math.floor(Math.random() * remainingTeams.length);
                selectedTeams.push(remainingTeams.splice(randomIndex, 1)[0]);
            }
        }
        
        return selectedTeams;
    } catch (error) {
        console.error("Failed to fetch recommended teams:", error);
        // Mengembalikan array kosong jika terjadi error agar halaman tidak crash
        return []; 
    }
}
