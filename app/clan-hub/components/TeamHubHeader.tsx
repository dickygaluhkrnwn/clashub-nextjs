'use client'; // [BARU] Komponen ini sekarang interaktif

import React, { useCallback, useRef } from 'react';
// [ROMBAK V2] Impor useRouter, Hapus Link
import { useRouter } from 'next/navigation';
import { Promotion } from '@/lib/clashub.types';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeftIcon, ChevronRightIcon } from '@/app/components/icons';
import { useAuth } from '@/app/context/AuthContext'; // [BARU V3] Impor hook Auth

/**
 * [EDIT] Komponen Header sekarang menerima props 'promotions'
 * dan akan menampilkan carousel jika data ada.
 */
interface TeamHubHeaderProps {
  promotions: Promotion[];
}

export const TeamHubHeader = ({ promotions }: TeamHubHeaderProps) => {
  // [ROMBAK V2] Inisialisasi router
  const router = useRouter();
  // [BARU V3] Ambil userProfile dari AuthContext
  const { userProfile } = useAuth();

  // Cek apakah ada promosi yang valid
  // Kita juga pastikan data promosi memiliki 'id' dan 'clanId'
  const validPromotions =
    promotions?.filter((p) => p.id && p.clanId && p.imageUrl) || [];
  const hasPromotions = validPromotions.length > 0;

  // --- Logika Carousel ---
  const autoplay = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    autoplay.current,
  ]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);
  // --- Akhir Logika Carousel ---

  // [ROMBAK V2] Handler untuk klik banner
  const handleBannerClick = (promo: Promotion) => {
    // [EDIT V3] Ambil thLevel dari userProfile. Sesuai Peta Develop V3, Tugas 4.1
    const thLevel = userProfile?.thLevel || 'unknown';

    // 1. Catat statistik (Api fire-and-forget, tidak perlu ditunggu)
    fetch('/api/promotions/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clanId: promo.clanId,
        promotionId: promo.id,
        thLevel: thLevel, // [BARU V3] Kirim thLevel ke API
      }),
    }).catch((err) => {
      // Jika gagal, cukup log di console, jangan hentikan navigasi
      console.error('Failed to log promotion click:', err);
    });

    // 2. Arahkan pengguna ke halaman profil klan
    router.push(`/clan/internal/${promo.clanId}`);
  };

  const emblaStyles = `
    .embla {
      overflow: hidden;
    }
    .embla__container {
      display: flex;
    }
    .embla__slide {
      position: relative;
      flex: 0 0 100%;
      min-width: 0;
    }
  `;

  // [ROMBAK V2] Render Carousel Dinamis (Tanpa Teks)
  const renderCarousel = () => (
    <>
      <style>{emblaStyles}</style>
      <section
        className="relative h-[400px] bg-coc-dark text-white border-b-4 border-coc-gold shadow-lg 
                   embla"
        // [FIX 1.1 FINAL] Dihapus mt-[-68px] DAN pt-[68px]
        // Layout akan mengalir secara alami setelah header sticky
      >
        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="embla__container h-full">
            {validPromotions.map((promo) => (
              <div
                className="embla__slide h-full bg-cover bg-center cursor-pointer" // [EDIT] Tambah cursor-pointer
                key={promo.id} // [EDIT] Gunakan promo.id sebagai key
                style={{
                  backgroundImage: `url(${promo.imageUrl})`,
                }}
                onClick={() => handleBannerClick(promo)} // [EDIT] Tambah onClick handler
              >
                {/* [FIX 1.2] Overlay Gelap Dihapus */}
              </div>
            ))}
          </div>
        </div>

        {/* Tombol Navigasi Carousel */}
        <button
          className="absolute z-20 top-1/2 left-4 -translate-y-1/2 bg-black/30 text-white rounded-full p-2 hover:bg-black/60 transition-all"
          onClick={scrollPrev}
          aria-label="Previous Slide"
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <button
          className="absolute z-20 top-1/2 right-4 -translate-y-1/2 bg-black/30 text-white rounded-full p-2 hover:bg-black/60 transition-all"
          onClick={scrollNext}
          aria-label="Next Slide"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </section>
    </>
  );

  // [FALLBACK] Render Banner Statis (Kode Asli Anda)
  const renderStaticFallback = () => (
    <section
      className="relative h-[400px] bg-teamhub-banner bg-cover bg-top bg-no-repeat flex flex-col items-center justify-center text-center text-white border-b-4 border-coc-gold shadow-lg"
      // [FIX 1.1 FINAL] Dihapus mt-[-68px] DAN pt-[68px]
    >
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 p-4">
        <h1 className="text-4xl md:text-5xl mb-4 font-clash">
          Hub Komunitas Clashub
        </h1>
        <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto font-sans">
          {/* [PERBAIKAN] Mengganti "Tim Clashub Internal" menjadi "Clan Internal" */}
          Temukan Clan Internal, cari Klan Publik, atau rekrut Pemain baru.
        </p>
      </div>
    </section>
  );

  // Render utama: pilih carousel atau fallback
  return hasPromotions ? renderCarousel() : renderStaticFallback();
};