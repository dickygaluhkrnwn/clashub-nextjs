'use client';

import React, { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Promotion } from '@/lib/clashub.types';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { ChevronLeftIcon, ChevronRightIcon, StarIcon } from '@/app/components/icons';
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
      className="relative w-full rounded-2xl overflow-hidden shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] border border-white/10 group mb-12 bg-[#0a0a0b]"
    >
      {/* Container dengan aspect ratio yang konsisten */}
      <div className="relative aspect-[16/9] sm:aspect-[21/9] max-h-[500px] w-full bg-[#15171e]">
        <div className="overflow-hidden h-full" ref={emblaRef}>
          <div className="flex h-full">
            {validPromotions.map((promo) => (
              <div
                className="relative flex-[0_0_100%] min-w-0 h-full cursor-pointer overflow-hidden"
                key={promo.id}
                onClick={() => handleBannerClick(promo)}
              >
                {/* Background Image with Zoom Effect */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-[8s] ease-out scale-100 group-hover:scale-110"
                  style={{ backgroundImage: `url(${promo.imageUrl})` }}
                />
                
                {/* Modern Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/40 to-transparent opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0b]/80 via-transparent to-transparent opacity-80" />

                {/* Content Overlay */}
                <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full flex flex-col items-start gap-4 z-10">
                    {/* Badge Featured - Glassmorphism */}
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-coc-gold/10 backdrop-blur-md border border-coc-gold/30 text-coc-gold text-[10px] md:text-xs font-bold uppercase tracking-widest shadow-[0_0_15px_rgba(255,215,0,0.2)] animate-pulse-slow"
                    >
                      <StarIcon className="w-3 h-3 fill-current" />
                      Featured Clan
                    </motion.div>

                    {/* Optional Title/Caption based on promo data availability */}
                    {/* Placeholder title logic if needed */}
                    <div className="max-w-2xl">
                        <h3 className="text-2xl md:text-4xl lg:text-5xl font-clash font-bold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)] leading-tight">
                           {/* Jika promo punya title, gunakan. Jika tidak, gunakan nama klan atau default */}
                           {(promo as any).title || "Join the Elite Ranks!"}
                        </h3>
                        <p className="text-gray-300 text-sm md:text-base mt-2 line-clamp-2 max-w-lg drop-shadow-md">
                           {(promo as any).description || "Discover top-tier clans, master new strategies, and dominate the battlefield. Tap to learn more."}
                        </p>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tombol Navigasi - Tactile & Modern */}
        <button
          className="absolute z-20 top-1/2 left-4 md:left-8 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-coc-gold hover:text-black hover:scale-110 active:scale-95 shadow-lg"
          onClick={(e) => { e.stopPropagation(); scrollPrev(); }}
          aria-label={t.banner.prevSlide}
        >
          <ChevronLeftIcon className="h-6 w-6" />
        </button>
        <button
          className="absolute z-20 top-1/2 right-4 md:right-8 -translate-y-1/2 w-12 h-12 flex items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-coc-gold hover:text-black hover:scale-110 active:scale-95 shadow-lg"
          onClick={(e) => { e.stopPropagation(); scrollNext(); }}
          aria-label={t.banner.nextSlide}
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>

        {/* Indikator Slide (Dots) - Modern Pill Style */}
        <div className="absolute bottom-6 md:bottom-10 right-6 md:right-12 flex gap-2 z-20">
          {validPromotions.map((_, index) => (
            <button
              key={index}
              onClick={(e) => { e.stopPropagation(); emblaApi?.scrollTo(index); }}
              className={`h-1.5 rounded-full transition-all duration-500 shadow-sm ${
                index === selectedIndex 
                  ? 'w-8 bg-coc-gold shadow-[0_0_10px_rgba(255,215,0,0.6)]' 
                  : 'w-2 bg-white/20 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </motion.section>
  );
}