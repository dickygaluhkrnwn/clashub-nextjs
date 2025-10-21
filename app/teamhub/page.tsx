import TeamHubClient from "./TeamHubClient"; // Import Client Component baru
import { getTeams, getPlayers } from '@/lib/firestore'; // Fungsi fetching data
import { Team, Player } from '@/lib/types';
import { Metadata } from "next";

// Metadata untuk SEO (Best practice Next.js)
export const metadata: Metadata = {
    title: "Clashub | Team Hub",
    description: "Cari tim kompetitif atau pemain berbakat di Clash of Clans. Filter berdasarkan TH level, reputasi, dan visi tim.",
};

// Mengubah komponen ini menjadi fungsi async menjadikannya Server Component
const TeamHubPage = async () => {
    let initialTeams: Team[] = [];
    let initialPlayers: Player[] = [];
    let teamsError: string | null = null;
    let playersError: string | null = null; // Kita hanya fetch data teams di SSR, data players bisa di-lazy-load

    // Ambil data Tim di sisi Server (SSR)
    try {
        initialTeams = await getTeams();
    } catch (err) {
        console.error("Error fetching teams on server:", err);
        teamsError = "Gagal memuat daftar tim. Silakan coba lagi.";
    }
    
    // Opsional: Ambil data Player di SSR, untuk memastikan tab 'Players' pertama kali dimuat cepat
    // Kita akan pertahankan logika Client-side load-on-demand di TeamHubClient.tsx untuk performa terbaik
    // Biarkan initialPlayers kosong agar data player hanya dimuat saat tab 'players' diklik (sesuai kode client)
    
    // Namun, jika ada error fatal pada teams, kita tampilkan
    if (teamsError) {
        return (
             <main className="container mx-auto p-4 md:p-8 mt-10">
                <div className="text-center py-20 card-stone p-6 max-w-lg mx-auto">
                    <h1 className="text-3xl text-coc-red font-supercell mb-4">Kesalahan Server</h1>
                    <h2 className="text-xl text-gray-300">{teamsError}</h2>
                    <p className="text-sm text-gray-500 mt-4">Data tim tidak dapat dimuat saat ini. Coba lagi dalam beberapa saat.</p>
                </div>
            </main>
        );
    }


    // Meneruskan data yang sudah di-fetch ke Client Component
    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <TeamHubClient 
                initialTeams={initialTeams} 
                initialPlayers={initialPlayers} // Initial players kosong, akan dimuat saat tab di-switch
            />
        </main>
    );
};

export default TeamHubPage;
