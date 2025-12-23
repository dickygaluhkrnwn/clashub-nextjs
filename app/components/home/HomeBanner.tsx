'use client';

import React, { useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Promotion } from '@/lib/clashub.types';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeftIcon, ChevronRightIcon } from '@/app/components/icons';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface HomeBannerProps {
  promotions: Promotion[];
}

export default function HomeBanner({ promotions }: HomeBannerProps) {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { t } = useLanguage();

  // Cek apakah ada promosi yang valid
  const validPromotions =
    promotions?.filter((p) => p.id && p.clanId && p.imageUrl) || [];
  const hasPromotions = validPromotions.length > 0;

  // Jika tidak ada promosi, jangan render apa-apa
  if (!hasPromotions) return null;

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

  // Handler untuk klik banner
  const handleBannerClick = (promo: Promotion) => {
    const thLevel = userProfile?.thLevel || 'unknown';

    // 1. Catat statistik
    fetch('/api/promotions/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clanId: promo.clanId,
        promotionId: promo.id,
        thLevel: thLevel,
      }),
    }).catch((err) => {
      console.error('Failed to log promotion click:', err);
    });

    // 2. Arahkan pengguna
    router.push(`/clan/internal/${promo.clanId}`);
  };

  return (
    // [MOBILE OPTIMIZATION]
    // Mobile: h-56 (224px) cukup untuk banner di layar kecil
    // Tablet: h-72
    // Desktop: h-[400px]
    // Margin atas/bawah disesuaikan agar tidak terlalu renggang di mobile
    <section className="relative w-full bg-coc-dark text-white border-y-4 border-coc-gold shadow-lg overflow-hidden mt-6 md:mt-8 rounded-xl mb-8 md:mb-12 h-56 sm:h-72 md:h-[400px] group">
      <div className="overflow-hidden h-full" ref={emblaRef}>
        <div className="flex h-full">
          {validPromotions.map((promo) => (
            <div
              className="relative flex-[0_0_100%] min-w-0 h-full bg-cover bg-center cursor-pointer transition-transform duration-500 hover:scale-105"
              key={promo.id}
              style={{
                backgroundImage: `url(${promo.imageUrl})`,
              }}
              onClick={() => handleBannerClick(promo)}
            >
              {/* Gradient Overlay halus agar gambar menyatu dengan tema gelap */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
            </div>
          ))}
        </div>
      </div>

      {/* Tombol Navigasi Carousel - Hidden on Mobile default, visible on hover/focus */}
      {/* Mobile: Posisikan sedikit lebih ke tepi */}
      <button
        className="absolute z-20 top-1/2 left-2 md:left-4 -translate-y-1/2 bg-black/40 hover:bg-coc-gold/90 text-white rounded-full p-2 md:p-3 transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
        onClick={scrollPrev}
        aria-label={t.banner.prevSlide}
      >
        <ChevronLeftIcon className="h-5 w-5 md:h-6 md:w-6" />
      </button>
      <button
        className="absolute z-20 top-1/2 right-2 md:right-4 -translate-y-1/2 bg-black/40 hover:bg-coc-gold/90 text-white rounded-full p-2 md:p-3 transition-all backdrop-blur-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
        onClick={scrollNext}
        aria-label={t.banner.nextSlide}
      >
        <ChevronRightIcon className="h-5 w-5 md:h-6 md:w-6" />
      </button>
      
      {/* Indikator Slide (Dots) - Penting untuk UX Mobile */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {validPromotions.map((_, index) => (
            <div 
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${index === 0 ? 'w-6 bg-coc-gold' : 'w-2 bg-white/50'}`} 
            />
        ))}
      </div>
    </section>
  );
}