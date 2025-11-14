import { TeamCard } from "@/app/components/cards";
import { CogsIcon } from "@/app/components/icons";
import CarouselSection from "@/app/components/layout/CarouselSection";
import { getRecommendedTeams } from "@/lib/server-utils";
import { ManagedClan } from "@/lib/types";

// Ini adalah Server Component.
// Dia bertanggung jawab atas data fetching-nya sendiri.
export default async function RecommendedTeams() {
    let recommendedTeams: ManagedClan[] = [];
    let error: string | null = null;

    try {
        // getRecommendedTeams sekarang mengembalikan ManagedClan[]
        recommendedTeams = await getRecommendedTeams();
    } catch (err) {
        console.error("Error fetching recommended teams:", err);
        error = "Gagal memuat rekomendasi tim dari database.";
    }

    return (
        <CarouselSection title="Rekomendasi Tim untuk Anda" icon={<CogsIcon className="inline-block h-5 w-5" />}>
            {error ? (
                <div className="p-4 bg-coc-red/10 text-red-400 rounded-lg col-span-full">
                    <p className="font-bold">Error Memuat Tim:</p>
                    <p className="text-sm">{error}</p>
                </div>
            ) : recommendedTeams.length === 0 ? (
                <div className="p-4 bg-coc-stone-light/50 text-gray-400 rounded-lg col-span-full">
                    Tidak ada tim yang ditemukan untuk direkomendasikan.
                </div>
            ) : (
                // PERBAIKAN #3: Memastikan TeamCard menerima properti ManagedClan
                recommendedTeams.map((clan) => (
                    <TeamCard
                        key={clan.id}
                        id={clan.id}
                        name={clan.name}
                        tag={clan.tag}
                        // PERBAIKAN #4: Menggunakan nilai fallback 5.0 untuk 'rating' karena tidak ada di ManagedClan
                        rating={5.0}
                        vision={clan.vision}
                        avgTh={clan.avgTh}
                        logoUrl={clan.logoUrl}
                    />
                ))
            )}
        </CarouselSection>
    );
}