'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useGameAssets } from '@/lib/hooks/useGameAssets';

// Ikon Paw Print (Telapak Kaki) Khusus untuk Pet
const PawIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="currentColor" 
    className={className}
  >
    <path d="M12 2C10.3431 2 9 3.34315 9 5C9 6.65685 10.3431 8 12 8C13.6569 8 15 6.65685 15 5C15 3.34315 13.6569 2 12 2ZM6 7C4.34315 7 3 8.34315 3 10C3 11.6569 4.34315 13 6 13C7.65685 13 9 11.6569 9 10C9 8.34315 7.65685 7 6 7ZM18 7C16.3431 7 15 8.34315 15 10C15 11.6569 16.3431 13 18 13C19.6569 13 21 11.6569 21 10C21 8.34315 19.6569 7 18 7ZM6.6099 15.6521C5.5539 16.2951 5 17.5 5 18.5C5 20.433 6.567 22 8.5 22C9.75543 22 10.8524 21.3326 11.4583 20.3162C11.6111 20.0598 11.9566 20.0617 12.1107 20.3188C12.723 21.3409 13.8296 22 15.0991 22C17.2536 22 19 20.2536 19 18.0991C19 17.0676 18.3533 15.8202 17.1517 15.1979C16.4802 14.8501 15.6888 14.7571 14.949 14.8722C14.0042 15.0193 13.0135 15.0134 12.0831 14.8697C11.1644 14.7278 10.2223 14.8659 9.39082 15.3129C8.42391 15.8327 7.42065 15.1583 6.6099 15.6521Z" />
  </svg>
);

interface PlayerPetsCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

// [REMOVED] const PET_NAMES = [...] -> Dihapus karena kita pakai dynamic check

export const PlayerPetsCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerPetsCardProps) => {
  const { t } = useLanguage();
  const { getAssetUrl, getAssetType } = useGameAssets(); // Gunakan getAssetType

  // Ambil data Troops (API CoC menggabungkan Pet di dalam array Troops/Heroes tergantung endpoint)
  // Biasanya Pet ada di 'troops' dalam API player endpoint
  const rawData = fullPlayerData?.troops ?? userProfile?.cachedTroops ?? [];
  // Kita gabung juga dengan heroes jika API berubah sewaktu-waktu, tapi fokus troops dulu
  // const allUnits = [...rawData, ...(fullPlayerData?.heroes || [])]; 

  // [LOGIKA BARU] Filter Dinamis berdasarkan Asset Manager
  const pets = rawData.filter(item => {
      const type = getAssetType(item.name);
      // Masukkan ke list jika tipe di admin adalah 'pet'
      return type === 'pet';
  });

  const showLoading = isLoading && !fullPlayerData && !userProfile.cachedTroops;

  // Jika tidak ada pet sama sekali, jangan render
  if (!showLoading && pets.length === 0) return null;

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
      {/* Ambient Green Glow */}
      <div className="absolute top-10 right-10 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-all duration-700" />

      <h2 className="mb-6 flex items-center gap-2 font-clash text-lg text-white relative z-10">
        <PawIcon className="h-5 w-5 text-coc-gold" /> {(t.profileArmy as any)?.petsTitle || "Hero Pets"}
      </h2>

      {/* Content */}
      <div className="relative z-10">
        {showLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
            {pets.map((pet) => (
              <div
                key={pet.name}
                className="relative bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-2 flex flex-col items-center justify-center transition-transform duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] group/item"
                title={pet.name}
              >
                <div className="w-12 h-12 relative mb-1">
                   <img 
                      src={getAssetUrl(pet.name)} 
                      alt={pet.name}
                      className="w-full h-full object-contain drop-shadow-md group-hover/item:scale-110 transition-transform"
                      onError={(e) => e.currentTarget.style.display = 'none'}
                   />
                </div>
                <div className={`absolute -top-2 -right-2 text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-sm ${
                    pet.level === pet.maxLevel 
                    ? 'bg-coc-gold text-black border-white/20' 
                    : 'bg-emerald-600 text-white border-emerald-400'
                }`}>
                  Lvl {pet.level}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};