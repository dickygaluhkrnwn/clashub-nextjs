import { Metadata } from "next";
import { Tournament, FirestoreDocument } from '@/lib/clashub.types';
import { getAllTournamentsAdmin } from '@/lib/firestore-admin/tournaments';
import TournamentClient from "./TournamentClient"; 

export const metadata: Metadata = {
    title: "Clashub | Turnamen & Liga",
    description: "Lihat daftar turnamen Clash of Clans yang akan datang, sedang berlangsung, dan klasemen liga kompetitif.",
};

// ISR Revalidation (setiap 60 detik)
export const revalidate = 60;
// Force dynamic rendering untuk memastikan user session selalu dicek dengan benar di layout
export const dynamic = 'force-dynamic';

const TournamentPage = async () => {
    let initialTournaments: FirestoreDocument<Tournament>[] = [];
    let error: string | null = null;

    try {
        initialTournaments = await getAllTournamentsAdmin();
    } catch (err) {
        console.error("Error fetching tournaments on server:", err);
        error = "Failed to load tournaments from server.";
    }

    return (
        <main className="container mx-auto p-4 md:p-8 mt-4 md:mt-8">
            <TournamentClient
                initialTournaments={JSON.parse(JSON.stringify(initialTournaments))}
                error={error && initialTournaments.length === 0 ? error : null}
            />
        </main>
    );
};

export default TournamentPage;