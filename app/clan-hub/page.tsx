// File: app/clan-hub/page.tsx
// PERBAIKAN 1: Mengganti import path dari "./TeamHubClient" menjadi "../clan-hub/TeamHubClient"
import TeamHubClient from "./TeamHubClient";
// PERBAIKAN: Mengganti getPublicClanIndex dengan getPublicClansForHub
import { getManagedClans, getPlayers, getPublicClansForHub } from '@/lib/firestore'; 
// PERBAIKAN #2: Menggunakan tipe data ManagedClan dan PublicClanIndex yang baru
import { ManagedClan, Player, PublicClanIndex } from '@/lib/types'; 
import { Metadata } from "next";

// Metadata untuk SEO (Best practice Next.js)
export const metadata: Metadata = {
    title: "Clashub | Hub Tim & Pencarian Klan", 
    description: "Cari tim kompetitif Clashub atau cari klan publik CoC. Filter berdasarkan Level TH, reputasi, dan visi tim.",
};

// Mengubah komponen ini menjadi fungsi async menjadikannya Server Component
// FIX: Ganti nama komponen menjadi ClanHubPage untuk konsistensi
const ClanHubPage = async () => {
    // PERBAIKAN #3: Inisialisasi array untuk Klan Publik
    let initialClans: ManagedClan[] = []; 
    let initialPlayers: Player[] = [];
    let initialPublicClans: PublicClanIndex[] = []; // BARU: Menampung cache klan publik
    let loadError: string | null = null;
    
    // Menggunakan Promise.all untuk mengambil semua data secara paralel
    try {
        // PERBAIKAN KRITIS: Mengganti getPublicClanIndex() dengan getPublicClansForHub()
        const [clans, players, publicClans] = await Promise.all([
            getManagedClans(), // Mengambil daftar ManagedClan (Tim Internal)
            getPlayers(), // Mengambil daftar Player
            getPublicClansForHub(), // MENGAMBIL SEMUA KLAN PUBLIK (ARRAY)
        ]);

        // PERBAIKAN #5: Menyimpan hasil ke initialClans dan initialPublicClans
        initialClans = clans; 
        initialPlayers = players;
        initialPublicClans = publicClans; // Resolusi Error 2322 (Type now matches Array)
    } catch (err) {
        console.error("Error fetching data on server:", err);
        loadError = "Gagal memuat daftar hub klan. Silakan coba lagi.";
    }

    // Jika ada error fatal, tampilkan pesan error yang di-render oleh server
    if (loadError) {
        return (
            // PENYESUAIAN UI: Menghapus container/padding dari sini
            <main className="mt-10"> 
                {/* Menambahkan wrapper layout standar di dalam pesan error */}
                <div className="max-w-7xl mx-auto p-4 md:p-8">
                    <div className="text-center py-20 card-stone p-6 max-w-lg mx-auto">
                        {/* Menggunakan font-clash untuk judul error */}
                        <h1 className="text-3xl text-coc-red font-clash mb-4">Kesalahan Server</h1>
                        <h2 className="text-xl text-gray-300">{loadError}</h2>
                        <p className="text-sm text-gray-500 mt-4">Data tim dan pemain tidak dapat dimuat saat ini. Coba lagi dalam beberapa saat.</p>
                    </div>
                </div>
              </main>
        );
    }

    // Meneruskan SEMUA data yang sudah di-fetch ke Client Component
    // PERBAIKAN #6: Mengirim initialPublicClans ke Client Component
    return (
        // PENYESUAIAN UI: Menghapus container/padding dari sini dan memindahkannya ke Client Component
        <main className="mt-10"> 
            <TeamHubClient
                initialClans={initialClans}
                initialPlayers={initialPlayers}
                initialPublicClans={initialPublicClans} // BARU: Data untuk tab Pencarian Klan Publik
            />
        </main>
    );
};

export default ClanHubPage;
