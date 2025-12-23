import React from 'react';

// [PERUBAHAN] Tidak lagi menerima props 'promotions'
export const TeamHubHeader = () => {
  return (
    <section
      // [MOBILE UPDATE] Tinggi banner dikurangi di mobile (h-[200px]) agar konten utama cepat terlihat
      className="relative h-[200px] md:h-[300px] bg-teamhub-banner bg-cover bg-center bg-no-repeat flex flex-col items-center justify-center text-center text-white border-b-4 border-coc-gold shadow-lg overflow-hidden"
    >
      {/* Overlay gelap agar teks terbaca */}
      <div className="absolute inset-0 bg-black/60" />
      
      <div className="relative z-10 p-4 animate-in fade-in zoom-in duration-700 w-full max-w-4xl px-6">
        <h1 className="text-2xl md:text-5xl mb-2 md:mb-4 font-clash text-coc-gold drop-shadow-lg tracking-wide">
          Hub Komunitas Clashub
        </h1>
        <p className="text-xs md:text-lg text-gray-200 max-w-xl mx-auto font-sans leading-relaxed opacity-90">
          Temukan Clan Internal yang kompetitif, cari Klan Publik, atau rekrut Pemain berbakat untuk tim Anda.
        </p>
      </div>
    </section>
  );
};