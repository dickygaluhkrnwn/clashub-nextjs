'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Promotion } from '@/lib/clashub.types';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeftIcon, ChevronRightIcon } from '@/app/components/icons';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { motion } from 'framer-motion';

interface HomeBannerProps {
  promotions: Promotion[];
}

export default function HomeBanner({ promotions }: HomeBannerProps) {
  const router = useRouter();
  const { userProfile } = useAuth();
  const { t } = useLanguage();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Filter promosi valid
  const validPromotions =
    promotions?.filter((p) => p.id && p.clanId && p.imageUrl) || [];
  const hasPromotions = validPromotions.length > 0;

  // --- Logika Carousel ---
  const autoplay = useRef(Autoplay({ delay: 6000, stopOnInteraction: false }));
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [
    autoplay.current,
  ]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  React.useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
  }, [emblaApi, onSelect]);

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const handleBannerClick = (promo: Promotion) => {
    const thLevel = userProfile?.thLevel || 'unknown';

    // 1. Catat statistik (fire and forget)
    fetch('/api/promotions/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clanId: promo.clanId,
        promotionId: promo.id,
        thLevel: thLevel,
      }),
    }).catch((err) => console.error('Failed to log click:', err));

    // 2. Arahkan pengguna
    router.push(`/clan/internal/${promo.clanId}`);
  };

  if (!hasPromotions) return null;

  return (
    <motion.section 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-coc-gold/20 group"
    >
      {/* Container dengan aspect ratio yang konsisten */}
      <div className="relative aspect-[16/7] md:aspect-[21/9] max-h-[400px] w-full bg-coc-stone">
        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full">
            {validPromotions.map((promo) => (
              <div
                className="relative flex-[0_0_100%] min-w-0 h-full cursor-pointer"
                key={promo.id}
                onClick={() => handleBannerClick(promo)}
              >
                {/* Background Image */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${promo.imageUrl})` }}
                />
                
                {/* Gradient Overlay untuk keterbacaan teks/kontras */}
                <div className="absolute inset-0 bg-gradient-to-t from-coc-stone via-transparent to-transparent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-r from-coc-stone/50 via-transparent to-transparent opacity-60" />

                {/* Badge Featured (Opsional) */}
                <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
                   <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-coc-gold/20 backdrop-blur-md border border-coc-gold/40 text-coc-gold text-xs font-bold uppercase tracking-wider mb-2">
                      Featured Clan
                   </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tombol Navigasi - Muncul saat Hover di Desktop */}
        <button
          className="absolute z-10 top-1/2 left-4 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-coc-gold hover:text-black hover:scale-110"
          onClick={scrollPrev}
          aria-label={t.banner.prevSlide}
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <button
          className="absolute z-10 top-1/2 right-4 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-coc-gold hover:text-black hover:scale-110"
          onClick={scrollNext}
          aria-label={t.banner.nextSlide}
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>

        {/* Indikator Slide (Dots) */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {validPromotions.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === selectedIndex 
                  ? 'w-8 bg-coc-gold shadow-[0_0_10px_rgba(255,215,0,0.5)]' 
                  : 'w-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}