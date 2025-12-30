'use client';

import React from 'react';
import { CocPlayer, UserProfile } from '@/lib/types';
import { SwordsIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useGameAssets } from '@/lib/hooks/useGameAssets';

interface PlayerTroopsCardProps {
  userProfile: UserProfile;
  fullPlayerData?: CocPlayer | null;
  isLoading?: boolean;
  error?: string | null;
}

export const PlayerTroopsCard = ({
  userProfile,
  fullPlayerData,
  isLoading,
  error,
}: PlayerTroopsCardProps) => {
  const { t } = useLanguage();
  const { getAssetUrl, getAssetType } = useGameAssets();

  const troopsData = fullPlayerData?.troops ?? userProfile?.cachedTroops ?? [];

  // Filter 1: Hanya Home Village
  // Filter 2: BUKAN Pet
  // Filter 3: BUKAN Super Troop Aktif (Karena sudah ada card sendiri)
  // Filter 4: BUKAN Super Troop Unlockable (biasanya kita sembunyikan dari regular list agar tidak penuh, kecuali mau ditampilkan)
  // Tapi untuk amannya, kita tampilkan semua NON-Aktif Super Troops sebagai "Regular"
  // Atau lebih baik lagi: Hanya tampilkan pasukan REGULER (bukan varian super)
  // Nama pasukan super biasanya ada "Super".
  // API CoC memisahkan "Barbarian" dan "Super Barbarian".
  
  const regularTroops = troopsData.filter((t) => {
     const type = getAssetType(t.name);
     const isPet = type === 'pet';
     const isSuperActive = t.superTroopIsActive;
     
     // Kita exclude Pet dan Super Troop yang SEDANG AKTIF (karena masuk card atas)
     // Super Troop yang TIDAK aktif tetap masuk sini? Atau kita filter semua "Super"?
     // Biasanya user ingin melihat list troop biasa di sini.
     // Kita filter yang namanya mengandung "Super " atau "Ice Hound" dsb jika kita mau strict,
     // tapi logic sederhana: exclude Pet & Active Super.
     
     // UPDATE: Mari kita filter "Super" troops agar card Regular benar-benar bersih.
     // Kita asumsikan nama aset super troop diawali "Super" atau tipe di admin 'super-troop'
     const isSuperType = type === 'super-troop' || t.name.startsWith('Super ') || t.name === 'Ice Hound' || t.name === 'Rocket Balloon' || t.name === 'Inferno Dragon';

     return t.village === 'home' && !isPet && !isSuperActive && !isSuperType;
  });

  const showLoading = isLoading && !fullPlayerData && !userProfile.cachedTroops;

  return (
    <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-lg relative overflow-hidden group">
      <div className="absolute top-20 -right-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-blue-500/20 transition-all duration-700" />

      <h2 className="mb-6 flex items-center gap-2 font-clash text-lg text-white relative z-10">
        <SwordsIcon className="h-5 w-5 text-coc-gold" /> {t.profileArmy.troopsTitle}
      </h2>

      {error && !isLoading && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm text-center">
          {t.profileArmy.troopsError.replace('{error}', error)}
        </div>
      )}

      <div className="relative z-10 space-y-8">
        {showLoading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="aspect-square bg-white/5 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Regular Troops Grid */}
            {regularTroops.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
                  {regularTroops.map((troop) => (
                    <div
                      key={troop.name}
                      className="relative bg-white/5 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center hover:bg-white/10 hover:border-white/20 transition-all duration-300 group/item"
                      title={troop.name}
                    >
                      <div className="w-10 h-10 relative mb-1">
                         <img 
                            src={getAssetUrl(troop.name)} 
                            alt={troop.name}
                            className="w-full h-full object-contain drop-shadow-md group-hover/item:scale-110 transition-transform filter grayscale-[0.3] group-hover/item:grayscale-0"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                         />
                      </div>
                      
                      <div className={`absolute -top-1.5 -right-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm border ${
                          troop.level === troop.maxLevel 
                            ? 'bg-coc-gold text-black border-coc-gold' 
                            : 'bg-black/60 text-white border-white/20'
                      }`}>
                        {troop.level}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 bg-white/5 rounded-xl border border-white/5">
                <p className="text-sm">{t.profileArmy.troopsEmpty}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};