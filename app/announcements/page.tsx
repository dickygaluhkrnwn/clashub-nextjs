'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  MegaphoneIcon, 
  CalendarIcon, 
  ChevronRightIcon, 
  AlertTriangleIcon,
  InfoIcon,
  CheckCircleIcon
} from '@/app/components/icons';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'; // Hapus orderBy dari import
import { firestore as db } from '@/lib/firebase';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger';
  isActive: boolean;
  createdAt: any;
  createdBy?: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        // [PERBAIKAN] Query tanpa orderBy untuk menghindari error "Missing Index"
        const q = query(
          collection(db, 'announcements'), 
          where('isActive', '==', true)
        );
        
        const snapshot = await getDocs(q);
        const list: Announcement[] = [];
        
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Announcement);
        });

        // [PERBAIKAN] Sorting manual di Client Side (Terbaru di atas)
        list.sort((a, b) => {
          const timeA = a.createdAt?.seconds || 0;
          const timeB = b.createdAt?.seconds || 0;
          return timeB - timeA; // Descending
        });

        setAnnouncements(list);
      } catch (error) {
        console.error("Gagal memuat berita:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="min-h-screen bg-coc-dark text-white pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-coc-gold/10 rounded-full mb-4 border border-coc-gold/20">
            <MegaphoneIcon className="h-8 w-8 text-coc-gold" />
          </div>
          <h1 className="text-3xl md:text-4xl font-clash text-white mb-4">Papan Pengumuman</h1>
          <p className="text-gray-400 max-w-lg mx-auto">
            Berita terbaru, update fitur, dan informasi pemeliharaan server seputar Clashub.
          </p>
        </div>

        {/* News Feed */}
        <div className="space-y-6">
          {isLoading ? (
            // Skeleton Loading
            [1, 2, 3].map(i => (
              <div key={i} className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-white/5 rounded w-full mb-2"></div>
                <div className="h-4 bg-white/5 rounded w-1/2"></div>
              </div>
            ))
          ) : announcements.length === 0 ? (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5">
              <p className="text-gray-500">Belum ada pengumuman saat ini.</p>
            </div>
          ) : (
            announcements.map((item) => (
              <Link 
                href={`/announcements/${item.id}`} 
                key={item.id}
                className="block bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 hover:border-coc-gold/30 hover:bg-[#222] transition-all group relative overflow-hidden"
              >
                {/* Decorative Glow based on Type */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  item.type === 'danger' ? 'bg-coc-red' : 
                  item.type === 'warning' ? 'bg-coc-gold' : 'bg-coc-blue'
                }`}></div>

                <div className="flex flex-col md:flex-row md:items-start gap-4 pl-4">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {item.type === 'danger' ? (
                      <AlertTriangleIcon className="h-6 w-6 text-coc-red" />
                    ) : item.type === 'warning' ? (
                      <AlertTriangleIcon className="h-6 w-6 text-coc-gold" />
                    ) : (
                      <InfoIcon className="h-6 w-6 text-coc-blue" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-xl font-bold text-white group-hover:text-coc-gold transition-colors line-clamp-1">
                        {item.title}
                      </h2>
                      {/* Badge New jika kurang dari 3 hari */}
                      {item.createdAt && (Date.now() - (item.createdAt.seconds * 1000)) < (3 * 24 * 60 * 60 * 1000) && (
                        <span className="bg-coc-red text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">
                          BARU
                        </span>
                      )}
                    </div>
                    
                    <p className="text-gray-400 text-sm line-clamp-2 mb-4 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <CalendarIcon className="h-3.5 w-3.5" />
                        <span>
                          {item.createdAt?.seconds 
                            ? new Date(item.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'long', year: 'numeric'
                              }) 
                            : 'Baru saja'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-coc-gold opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                        Baca Selengkapnya <ChevronRightIcon className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

      </div>
    </div>
  );
}