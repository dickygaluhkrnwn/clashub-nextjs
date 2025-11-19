import React from 'react';

// [PERUBAHAN] Tidak lagi menerima props 'promotions'
export const TeamHubHeader = () => {
  return (
    <section
      className="relative h-[250px] md:h-[300px] bg-teamhub-banner bg-cover bg-top bg-no-repeat flex flex-col items-center justify-center text-center text-white border-b-4 border-coc-gold shadow-lg"
    >
      {/* Overlay gelap agar teks terbaca */}
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="relative z-10 p-4 animate-in fade-in zoom-in duration-700">
        <h1 className="text-4xl md:text-5xl mb-4 font-clash text-coc-gold drop-shadow-lg">
          Hub Komunitas Clashub
        </h1>
        <p className="text-lg text-gray-200 mb-8 max-w-2xl mx-auto font-sans leading-relaxed">
          Temukan Clan Internal yang kompetitif, cari Klan Publik, atau rekrut Pemain berbakat untuk tim Anda.
        </p>
      </div>
    </section>
  );
};