import { TeamCard } from "@/app/components/cards";
import { CogsIcon } from "@/app/components/icons";
import CarouselSection from "@/app/components/layout/CarouselSection";
import { getRecommendedTeams } from "@/lib/server-utils";
// [PERBAIKAN] Ganti impor ManagedClan ke RecommendedTeam
import { RecommendedTeam } from "@/lib/types";

// Ini adalah Server Component.
// Dia bertanggung jawab atas data fetching-nya sendiri.
export default async function RecommendedTeams() {
  // [PERBAIKAN] Ubah tipe variabel untuk menampung data baru
  let recommendedTeams: RecommendedTeam[] = [];
  let error: string | null = null;

  try {
    // Fungsi ini sekarang mengembalikan RecommendedTeam[] (termasuk averageRating)
    recommendedTeams = await getRecommendedTeams();
  } catch (err) {
    console.error("Error fetching recommended teams:", err);
    error = "Gagal memuat rekomendasi tim dari database.";
  }

  return (
    <CarouselSection
      title="Rekomendasi Tim untuk Anda"
      icon={<CogsIcon className="inline-block h-5 w-5" />}
    >
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
        // [PERBAIKAN] Sekarang kita map data RecommendedTeam
        recommendedTeams.map((clan) => (
          <TeamCard
            key={clan.id}
            id={clan.id}
            name={clan.name}
            tag={clan.tag}
            // [PERBAIKAN UTAMA] Ganti nilai dummy 5.0 dengan data rating asli
            rating={clan.averageRating}
            vision={clan.vision}
            avgTh={clan.avgTh}
            logoUrl={clan.logoUrl}
          />
        ))
      )}
    </CarouselSection>
  );
}