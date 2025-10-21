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
    let playersError: string | null = null;
    
    // Menggunakan Promise.all untuk mengambil semua data secara paralel
    try {
        const [teams, players] = await Promise.all([
            getTeams(),
            getPlayers()
        ]);

        initialTeams = teams;
        initialPlayers = players;
    } catch (err) {
        console.error("Error fetching data on server:", err);
        teamsError = "Gagal memuat daftar tim atau pemain. Silakan coba lagi.";
    }
    
    // Jika ada error fatal, kita tampilkan pesan error yang di-render oleh server
    if (teamsError) {
        return (
             <main className="container mx-auto p-4 md:p-8 mt-10">
                <div className="text-center py-20 card-stone p-6 max-w-lg mx-auto">
                    <h1 className="text-3xl text-coc-red font-supercell mb-4">Kesalahan Server</h1>
                    <h2 className="text-xl text-gray-300">{teamsError}</h2>
                    <p className="text-sm text-gray-500 mt-4">Data tim dan pemain tidak dapat dimuat saat ini. Coba lagi dalam beberapa saat.</p>
                </div>
            </main>
        );
    }


    // Meneruskan data yang sudah di-fetch ke Client Component
    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <TeamHubClient 
                initialTeams={initialTeams} 
                initialPlayers={initialPlayers} // Data pemain sekarang sudah dimuat di sini!
            />
        </main>
    );
};

export default TeamHubPage;
