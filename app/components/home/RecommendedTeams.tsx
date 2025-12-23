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
      // [PERBAIKAN JUDUL] Static title, karena ini Server Component. 
      // Jika ingin dinamis (multilingual), string harus dipass dari page.tsx parent (Server Component) 
      // atau menggunakan client component wrapper. Untuk saat ini static dulu aman.
      title="Rekomendasi Clan"
      icon={<CogsIcon className="inline-block h-5 w-5 text-coc-gold" />}
    >
      {error ? (
        <div className="p-4 bg-coc-red/10 text-red-400 rounded-lg col-span-full border border-coc-red/20 w-full text-center">
          <p className="font-bold mb-1">Gagal Memuat Tim</p>
          <p className="text-sm text-red-300">{error}</p>
        </div>
      ) : recommendedTeams.length === 0 ? (
        <div className="p-6 bg-coc-stone-light/50 text-gray-400 rounded-lg col-span-full border border-white/5 text-center w-full">
          Tidak ada tim yang ditemukan untuk direkomendasikan saat ini.
        </div>
      ) : (
        // [PERBAIKAN] Map data RecommendedTeam
        recommendedTeams.map((clan) => (
          // [MOBILE OPTIMIZATION] 
          // Wrapper div dengan min-width agar kartu tidak gepeng di carousel mobile
          <div key={clan.id} className="snap-center h-full min-w-[260px] md:min-w-[300px] pr-4 last:pr-0">
              <TeamCard
                id={clan.id}
                name={clan.name}
                tag={clan.tag}
                // [PERBAIKAN UTAMA] Ganti nilai dummy dengan data rating asli
                rating={clan.averageRating || 0}
                vision={clan.vision}
                avgTh={clan.avgTh}
                logoUrl={clan.logoUrl}
              />
          </div>
        ))
      )}
    </CarouselSection>
  );
}