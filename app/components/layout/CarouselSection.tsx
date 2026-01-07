'use client';

import React, { ReactNode } from 'react';

type CarouselSectionProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

const CarouselSection = ({ title, icon, children }: CarouselSectionProps) => {
  return (
    <section className="mb-12 relative w-full group">
      
      {/* Header Section dengan Text Gold & Glow */}
      <div className="relative z-10 flex items-center gap-3 mb-6 px-1 pl-4 md:pl-0">
         <div className="p-2 rounded-lg bg-coc-gold/10 border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            <div className="text-coc-gold drop-shadow-md">
              {icon}
            </div>
         </div>
         <h2 className="text-xl md:text-2xl font-clash font-bold text-white tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] flex items-center gap-2">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              {title}
            </span>
         </h2>
      </div>
      
      {/* Kontainer Carousel dengan scroll horizontal */}
      <div className="relative">
        {/* Left Fade Gradient */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0a0b] to-transparent z-20 pointer-events-none md:hidden" />
        
        {/* Right Fade Gradient */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0a0b] to-transparent z-20 pointer-events-none md:hidden" />

        <div className="
          grid 
          grid-flow-col 
          auto-cols-[280px] 
          sm:auto-cols-[320px] 
          gap-6 
          overflow-x-auto 
          pb-8
          pt-2
          scrollbar-thin 
          scrollbar-thumb-coc-gold/20 
          scrollbar-track-transparent 
          hover:scrollbar-thumb-coc-gold/50
          snap-x snap-mandatory
          px-4 md:px-0 /* Edge-to-edge scroll di mobile */
        ">
          {children}
        </div>
      </div>
    </section>
  );
};

export default CarouselSection;