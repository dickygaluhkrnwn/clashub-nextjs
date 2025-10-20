import React, { ReactNode } from 'react';

type CarouselSectionProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

const CarouselSection = ({ title, icon, children }: CarouselSectionProps) => {
  return (
    <section className="mb-12">
      {/* Judul seksi dengan ikon */}
      <h2 className="flex items-center gap-2">
        {icon}
        {title}
      </h2>
      
      {/* Kontainer Carousel dengan scroll horizontal */}
      <div className="
        mt-4 
        grid 
        grid-flow-col 
        auto-cols-[280px] 
        sm:auto-cols-[320px] 
        gap-6 
        overflow-x-auto 
        pb-4
        custom-scrollbar
      ">
        {children}
      </div>
    </section>
  );
};

export default CarouselSection;
