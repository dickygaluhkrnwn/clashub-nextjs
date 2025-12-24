'use client';

import React, { ReactNode } from 'react';

type CarouselSectionProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

const CarouselSection = ({ title, icon, children }: CarouselSectionProps) => {
  return (
    <section className="mb-12 relative w-full">
      {/* Background Texture dihapus agar lebih bersih (Clean UI) */}
      
      <div className="relative z-10">
        {/* Header Section dengan Text Gold */}
        <div className="flex items-center gap-3 mb-6 px-1">
           <div className="text-coc-gold drop-shadow-md">
              {icon}
           </div>
           <h2 className="text-xl md:text-2xl font-clash text-coc-gold tracking-wide drop-shadow-md">
              {title}
           </h2>
        </div>
        
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
          custom-scrollbar
          snap-x snap-mandatory
          -mx-4 px-4 md:mx-0 md:px-0 /* Edge-to-edge scroll di mobile */
        ">
          {children}
        </div>
      </div>
    </section>
  );
};

export default CarouselSection;