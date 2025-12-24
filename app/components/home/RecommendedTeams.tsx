import { TeamCard } from "@/app/components/cards";
import { ShieldIcon } from "@/app/components/icons";
import { getRecommendedTeams } from "@/lib/server-utils";
import { RecommendedTeam } from "@/lib/types";

// Helper component untuk header section (biar rapi & konsisten)
const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
  <div className="flex items-center justify-between mb-4 px-1">
    <h2 className="flex items-center gap-2 text-lg md:text-xl font-clash text-white tracking-wide drop-shadow-md">
      {icon}
      {title}
    </h2>
    {/* Indikator scroll visual untuk user (opsional - di mobile scrollbar disembunyikan biasanya) */}
    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold hidden md:block">
      Geser untuk melihat &rarr;
    </span>
  </div>
);

export default async function RecommendedTeams() {
  let recommendedTeams: RecommendedTeam[] = [];
  let error: string | null = null;

  try {
    recommendedTeams = await getRecommendedTeams();
  } catch (err) {
    console.error("Error fetching recommended teams:", err);
    error = "Gagal memuat rekomendasi tim.";
  }

  if (error) {
    return (
      <div className="w-full p-6 rounded-2xl bg-coc-red/10 border border-coc-red/20 text-center backdrop-blur-sm mb-8">
        <p className="text-coc-red text-sm font-bold">{error}</p>
      </div>
    );
  }

  if (recommendedTeams.length === 0) {
    return (
      <div className="w-full p-8 rounded-2xl bg-black/20 border border-white/5 text-center backdrop-blur-sm mb-8">
        <p className="text-gray-400 text-sm">Belum ada klan yang direkomendasikan saat ini.</p>
      </div>
    );
  }

  return (
    <section className="animate-fade-in mb-8">
      <SectionHeader 
        title="Rekomendasi Klan" 
        icon={<ShieldIcon className="h-5 w-5 md:h-6 md:w-6 text-coc-gold drop-shadow-md" />} 
      />

      {/* [NATIVE SCROLL CONTAINER] 
        - snap-x: Agar scroll berhenti pas di elemen
        - scrollbar-hide (optional): Menyembunyikan scrollbar di mobile agar lebih bersih
        - -mx-4 px-4: Teknik agar konten bisa di-scroll sampai mentok layar HP tapi tetap align container
      */}
      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 md:mx-0 md:px-0 md:scrollbar-thin custom-scrollbar">
        {recommendedTeams.map((clan, index) => (
          <div 
            key={clan.id} 
            className="snap-center shrink-0 w-[280px] md:w-[320px] first:pl-0 last:pr-4"
            style={{ animationDelay: `${index * 100}ms` }} // Stagger effect manual
          >
            {/* Wrapper untuk hover effect yang konsisten */}
            <div className="h-full transition-transform hover:-translate-y-1 duration-300">
              <TeamCard
                id={clan.id}
                name={clan.name}
                tag={clan.tag}
                rating={clan.averageRating || 0}
                vision={clan.vision}
                avgTh={clan.avgTh}
                logoUrl={clan.logoUrl}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}