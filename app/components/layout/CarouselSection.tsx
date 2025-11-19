import React, { ReactNode } from 'react';
import Image from 'next/image';

type CarouselSectionProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

const CarouselSection = ({ title, icon, children }: CarouselSectionProps) => {
  return (
    <section className="mb-12 relative">
      <div className="absolute inset-0 z-0 rounded-xl overflow-hidden opacity-20">
        <Image
          src="/images/stone-texture.png" 
          alt="Stone Texture Background"
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          style={{ objectFit: 'cover' }}
          className="pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-coc-stone via-coc-stone/80 to-coc-stone" />
      </div>

      <div className="relative z-10 p-4">
        {/* [PERBAIKAN WARNA] Mengubah text-white menjadi text-coc-gold */}
        <h2 className="flex items-center gap-2 text-xl md:text-2xl font-clash text-coc-gold mb-4 pl-2 border-l-4 border-coc-gold">
          {icon}
          {title}
        </h2>
        
        {/* Kontainer Carousel dengan scroll horizontal */}
        <div className="
          grid 
          grid-flow-col 
          auto-cols-[280px] 
          sm:auto-cols-[320px] 
          gap-6 
          overflow-x-auto 
          pb-6
          pt-2
          px-2
          custom-scrollbar
          snap-x snap-mandatory
        ">
          {children}
        </div>
      </div>
    </section>
  );
};

export default CarouselSection;