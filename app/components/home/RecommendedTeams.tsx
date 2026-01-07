import { TeamCard } from "@/app/components/cards";
import { ShieldIcon, ChevronRightIcon } from "@/app/components/icons";
import { getRecommendedTeams } from "@/lib/server-utils";
import { RecommendedTeam } from "@/lib/types";
import Link from "next/link";

// Helper component untuk header section
const SectionHeader = ({ title, icon }: { title: string; icon: React.ReactNode }) => (
  <div className="relative z-10 flex items-center justify-between gap-3 mb-6 px-1 pl-4 md:pl-0">
     <div className="flex items-center gap-3">
         <div className="p-2 rounded-lg bg-coc-blue/10 border border-coc-blue/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <div className="text-coc-blue drop-shadow-md">
              {icon}
            </div>
         </div>
         <h2 className="text-xl md:text-2xl font-clash font-bold text-white tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {title}
         </h2>
     </div>
     <Link 
        href="/clan-hub" 
        className="text-xs text-coc-blue hover:text-white transition-colors font-bold uppercase tracking-wider flex items-center gap-1 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 hover:border-white/20"
     >
        Explore <ChevronRightIcon className="h-3 w-3" />
     </Link>
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
        <p className="text-coc-red text-sm font-bold flex items-center justify-center gap-2">
           <ShieldIcon className="h-4 w-4" /> {error}
        </p>
      </div>
    );
  }

  if (recommendedTeams.length === 0) {
    return (
      <div className="w-full p-8 rounded-2xl bg-[#15171e]/80 border border-white/5 text-center backdrop-blur-sm mb-8 flex flex-col items-center gap-4">
        <ShieldIcon className="h-10 w-10 text-gray-600 opacity-50" />
        <p className="text-gray-400 text-sm">Belum ada klan yang direkomendasikan saat ini.</p>
      </div>
    );
  }

  return (
    <section className="mb-12 relative w-full group">
      <SectionHeader 
        title="Rekomendasi Klan" 
        icon={<ShieldIcon className="h-6 w-6" />} 
      />

      <div className="relative">
         {/* [REVISI] Shadow/Fade Edges dihapus agar tampilan mobile lebih bersih */}

        <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-8 pt-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-thin scrollbar-thumb-coc-gold/20 scrollbar-track-transparent hover:scrollbar-thumb-coc-gold/50">
          {recommendedTeams.map((clan, index) => (
            <div 
              key={clan.id} 
              className="snap-center shrink-0 w-[280px] md:w-[320px] h-[220px]"
              style={{ animationDelay: `${index * 100}ms` }} 
            >
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
          ))}
        </div>
      </div>
    </section>
  );
}