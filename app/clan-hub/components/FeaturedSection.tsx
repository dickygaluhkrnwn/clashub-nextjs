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
          limit(3) // Tampilkan 3 item terbaru saja (Spotlight Utama)
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
    <section className="mb-12 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20">
            <StarIcon className="h-6 w-6 text-coc-gold" />
        </div>
        <div>
            <h2 className="text-2xl font-clash text-white tracking-wide">
                Spotlight Minggu Ini
            </h2>
            <p className="text-xs text-gray-400">Komunitas & Pemain Terbaik Pilihan Editor</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {isLoading ? (
           [1, 2, 3].map(i => (
             <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
           ))
        ) : (
           items.map((item) => (
             <Link 
                href={item.type === 'clan' ? `/clan/${item.tag.replace('#', '')}` : `/profile/${item.tag.replace('#', '')}`}
                key={item.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#151515] hover:border-coc-gold/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
             >
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[60px] opacity-20 group-hover:opacity-40 transition-opacity ${item.type === 'clan' ? 'bg-coc-gold' : 'bg-coc-blue'}`} />

                <div className="relative z-10 p-6 flex flex-col h-full">
                    {/* Badge Tipe */}
                    <div className="flex justify-between items-start mb-4">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-coc-gold bg-coc-gold/10 px-2 py-1 rounded border border-coc-gold/20">
                            {item.title}
                        </span>
                        {item.type === 'clan' ? <ShieldIcon className="h-5 w-5 text-gray-600 group-hover:text-coc-gold transition-colors" /> : <UserIcon className="h-5 w-5 text-gray-600 group-hover:text-coc-blue transition-colors" />}
                    </div>

                    {/* Content */}
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-16 w-16 relative flex-shrink-0">
                            <img 
                                src={item.gameData.image} 
                                alt={item.gameData.name} 
                                className="w-full h-full object-contain drop-shadow-lg group-hover:scale-110 transition-transform duration-500" 
                            />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-xl font-clash text-white truncate group-hover:text-coc-gold transition-colors">
                                {item.gameData.name}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono mb-1">
                                {item.type === 'clan' ? `Clan Lvl ${item.gameData.level}` : `Town Hall ${item.gameData.level}`}
                            </p>
                            <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                                {item.description}
                            </p>
                        </div>
                    </div>

                    {/* Footer Arrow */}
                    <div className="mt-auto flex justify-end">
                        <span className="flex items-center gap-1 text-xs font-bold text-gray-500 group-hover:text-white transition-colors">
                            Lihat Profil <ArrowRightIcon className="h-3 w-3" />
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