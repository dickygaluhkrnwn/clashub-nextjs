import { Metadata } from "next";
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import { getAllTournamentsAdmin } from '@/lib/firestore-admin/tournaments';
import TournamentClient from "./TournamentClient"; 

// Metadata SEO (Server-side)
export const metadata: Metadata = {
    title: "Clashub | Turnamen & Liga",
    description: "Lihat daftar turnamen Clash of Clans yang akan datang, sedang berlangsung, dan klasemen liga kompetitif.",
};

// Opsi Cache: Revalidate data setiap 60 detik (ISR)
// Agar data tidak terlalu stale tapi server tidak terbebani setiap request
export const revalidate = 60; 

const TournamentPage = async () => {
    let initialTournaments: FirestoreDocument<Tournament>[] = [];
    let error: string | null = null;

    try {
        // Fetch data langsung dari Firestore Admin (Server-side)
        initialTournaments = await getAllTournamentsAdmin();
    } catch (err) {
        console.error("Error fetching tournaments on server:", err);
        // Set error message jika fetch gagal
        error = "Failed to load tournaments from server.";
    }

    return (
        <TournamentClient
            initialTournaments={initialTournaments}
            // Hanya kirim error jika data benar-benar kosong (agar user tidak melihat error jika data cache masih ada)
            error={error && initialTournaments.length === 0 ? error : null}
        />
    );
};

export default TournamentPage;