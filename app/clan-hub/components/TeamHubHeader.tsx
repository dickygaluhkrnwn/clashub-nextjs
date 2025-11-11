import React from 'react';

/**
 * Komponen Header (Banner) statis untuk halaman Clan Hub.
 * Diekstrak dari TeamHubClient.tsx untuk refactoring.
 */
export const TeamHubHeader = () => {
  return (
    <section
      className="relative h-[400px] bg-teamhub-banner bg-cover bg-top bg-no-repeat flex flex-col items-center justify-center text-center text-white border-b-4 border-coc-gold shadow-lg 
    mt-[-68px] pt-[68px]"
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 p-4">
        <h1 className="text-4xl md:text-5xl mb-4">Hub Komunitas Clashub</h1>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
          Temukan Tim Clashub Internal, cari Klan Publik, atau rekrut Pemain
          baru.
        </p>
      </div>
    </section>
  );
};