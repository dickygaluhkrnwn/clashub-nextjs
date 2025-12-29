'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MegaphoneIcon, 
  CalendarIcon, 
  ChevronRightIcon, 
  AlertTriangleIcon,
  InfoIcon,
  UserIcon
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import { doc, getDoc } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase';

export default function AnnouncementDetailPage({ params }: { params: { id: string } }) {
  const [announcement, setAnnouncement] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const docRef = doc(db, 'announcements', params.id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setAnnouncement({ id: docSnap.id, ...docSnap.data() });
        } else {
          router.push('/announcements'); // Redirect jika tidak ketemu
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [params.id, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-coc-dark flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-coc-gold border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!announcement) return null;

  // Format tanggal
  const dateStr = announcement.createdAt?.seconds 
    ? new Date(announcement.createdAt.seconds * 1000).toLocaleDateString('id-ID', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) 
    : '-';

  return (
    <div className="min-h-screen bg-coc-dark text-white pt-24 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <ChevronRightIcon className="h-3 w-3" />
          <Link href="/announcements" className="hover:text-white transition-colors">Pengumuman</Link>
          <ChevronRightIcon className="h-3 w-3" />
          <span className="text-coc-gold truncate max-w-[200px]">{announcement.title}</span>
        </div>

        <article className="bg-[#1a1a1a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* Header Banner */}
          <div className={`h-2 w-full ${
            announcement.type === 'danger' ? 'bg-coc-red' : 
            announcement.type === 'warning' ? 'bg-coc-gold' : 'bg-coc-blue'
          }`}></div>

          <div className="p-8 md:p-12">
            
            {/* Meta Header */}
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                announcement.type === 'danger' ? 'bg-coc-red/10 text-coc-red border-coc-red/20' : 
                announcement.type === 'warning' ? 'bg-coc-gold/10 text-coc-gold border-coc-gold/20' : 
                'bg-coc-blue/10 text-coc-blue border-coc-blue/20'
              }`}>
                {announcement.type === 'danger' ? 'Penting' : announcement.type === 'warning' ? 'Peringatan' : 'Informasi'}
              </span>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <CalendarIcon className="h-4 w-4" />
                <span>{dateStr}</span>
              </div>
            </div>

            {/* Content */}
            <h1 className="text-3xl md:text-4xl font-clash text-white mb-8 leading-tight">
              {announcement.title}
            </h1>

            <div className="prose prose-invert prose-lg max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
              {announcement.message}
            </div>

            {/* Footer / Author */}
            <div className="mt-12 pt-8 border-t border-white/5 flex items-center gap-4">
              <div className="h-10 w-10 bg-coc-gold/10 rounded-full flex items-center justify-center border border-coc-gold/20">
                <UserIcon className="h-5 w-5 text-coc-gold" />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Tim Admin Clashub</p>
                <p className="text-xs text-gray-500">Official Announcement</p>
              </div>
            </div>

          </div>
        </article>

        <div className="mt-8 text-center">
          <Button href="/announcements" variant="secondary">
            Kembali ke Daftar Pengumuman
          </Button>
        </div>

      </div>
    </div>
  );
}