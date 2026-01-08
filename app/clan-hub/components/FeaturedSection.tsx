'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, orderBy, getDocs, limit } from 'firebase/firestore';
import { firestore } from '@/lib/firebase';
import { StarIcon, ShieldIcon, UserIcon, ArrowRightIcon } from '@/app/components/icons';

interface FeaturedItem {
  id: string;
  tag: string;
  type: 'clan' | 'player';
  title: string;
  description: string;
  gameData: {
    name: string;
    image: string;
    level: number;
  };
}

export default function FeaturedSection() {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const q = query(
          collection(firestore, 'featuredItems'),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        
        const snapshot = await getDocs(q);
        const list: FeaturedItem[] = [];
        snapshot.forEach(doc => {
           list.push({ id: doc.id, ...doc.data() } as FeaturedItem);
        });
        setItems(list);
      } catch (error) {
        console.error("Gagal load featured:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, []);

  if (!isLoading && items.length === 0) return null;

  return (
    <section className="mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex items-center gap-4 mb-8 px-2">
        <div className="p-3 bg-gradient-to-br from-coc-gold/20 to-coc-gold/5 rounded-2xl border border-coc-gold/20 shadow-[0_0_20px_rgba(255,215,0,0.15)]">
            <StarIcon className="h-8 w-8 text-coc-gold drop-shadow-md" />
        </div>
        <div>
            <h2 className="text-3xl md:text-4xl font-clash font-bold text-white tracking-wide uppercase drop-shadow-xl">
                Spotlight <span className="text-transparent bg-clip-text bg-gradient-to-r from-coc-gold to-yellow-200">Minggu Ini</span>
            </h2>
            <p className="text-sm text-gray-400 font-sans tracking-wide mt-1">Komunitas & Pemain Terbaik Pilihan Editor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
        {isLoading ? (
           [1, 2, 3].map(i => (
             <div key={i} className="h-[320px] bg-[#15171e] rounded-3xl animate-pulse border border-white/5 flex flex-col p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
                <div className="flex justify-between mb-8">
                   <div className="h-6 w-24 bg-white/10 rounded-full" />
                   <div className="h-10 w-10 bg-white/10 rounded-full" />
                </div>
                <div className="flex-grow flex items-center justify-center mb-6">
                   <div className="h-24 w-24 bg-white/10 rounded-2xl" />
                </div>
                <div className="space-y-2">
                   <div className="h-6 w-3/4 bg-white/10 rounded" />
                   <div className="h-4 w-full bg-white/5 rounded" />
                </div>
             </div>
           ))
        ) : (
           items.map((item) => (
             <Link 
                href={item.type === 'clan' ? `/clan/${item.tag.replace('#', '')}` : `/profile/${item.tag.replace('#', '')}`}
                key={item.id}
                className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#15171e] hover:border-coc-gold/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] flex flex-col h-full"
             >
                {/* Dynamic Background Glow */}
                <div className={`absolute top-[-20%] right-[-20%] w-[80%] h-[80%] rounded-full blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none ${item.type === 'clan' ? 'bg-coc-gold' : 'bg-coc-blue'}`} />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#15171e]/80 to-[#0a0a0b] opacity-90 group-hover:opacity-80 transition-opacity duration-500" />

                <div className="relative z-10 p-8 flex flex-col h-full">
                    
                    {/* Header: Badge & Icon */}
                    <div className="flex justify-between items-start mb-8">
                        <span className={`text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1.5 rounded-lg border shadow-lg backdrop-blur-md ${
                           item.type === 'clan' 
                             ? 'bg-coc-gold/10 text-coc-gold border-coc-gold/20' 
                             : 'bg-coc-blue/10 text-coc-blue border-coc-blue/20'
                        }`}>
                            {item.title}
                        </span>
                        <div className={`p-2.5 rounded-full border bg-white/5 transition-colors duration-300 ${item.type === 'clan' ? 'group-hover:border-coc-gold/40 group-hover:bg-coc-gold/10' : 'group-hover:border-coc-blue/40 group-hover:bg-coc-blue/10'}`}>
                           {item.type === 'clan' 
                             ? <ShieldIcon className={`h-5 w-5 text-gray-400 group-hover:text-coc-gold transition-colors`} /> 
                             : <UserIcon className={`h-5 w-5 text-gray-400 group-hover:text-coc-blue transition-colors`} />
                           }
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="flex-grow flex flex-col items-center text-center gap-6">
                        {/* Image Container with Glow */}
                        <div className="relative h-28 w-28 flex-shrink-0 group-hover:scale-110 transition-transform duration-500 ease-out">
                            <div className={`absolute inset-0 rounded-full blur-2xl opacity-0 group-hover:opacity-60 transition-opacity duration-500 ${item.type === 'clan' ? 'bg-coc-gold/30' : 'bg-coc-blue/30'}`} />
                            <img 
                                src={item.gameData.image} 
                                alt={item.gameData.name} 
                                className="w-full h-full object-contain drop-shadow-[0_15px_25px_rgba(0,0,0,0.6)] relative z-10" 
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <h3 className={`text-2xl font-clash font-bold text-white truncate transition-colors duration-300 drop-shadow-lg ${item.type === 'clan' ? 'group-hover:text-coc-gold' : 'group-hover:text-coc-blue'}`}>
                                {item.gameData.name}
                            </h3>
                            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#0a0a0b] border border-white/5 shadow-inner">
                                <p className="text-[10px] text-gray-400 font-mono font-bold uppercase tracking-wider">
                                    {item.type === 'clan' ? `Clan Lvl ${item.gameData.level}` : `Town Hall ${item.gameData.level}`}
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-gray-400 leading-relaxed text-center line-clamp-2 px-2 font-sans opacity-80 group-hover:opacity-100 transition-opacity">
                            "{item.description}"
                        </p>
                    </div>

                    {/* Footer Action */}
                    <div className="mt-8 pt-6 border-t border-white/5 flex justify-center">
                        <span className={`flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] transition-all duration-300 group-hover:gap-3 ${item.type === 'clan' ? 'text-coc-gold' : 'text-coc-blue'}`}>
                            View Details <ArrowRightIcon className="h-4 w-4" />
                        </span>
                    </div>
                </div>
             </Link>
           ))
        )}
      </div>
    </section>
  );
}