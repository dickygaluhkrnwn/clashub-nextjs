'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  BookOpenIcon, 
  MenuIcon, 
  XIcon, 
  ChevronRightIcon,
  CheckCircleIcon,
  HomeIcon
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

// Import Konten Tahap
import Stage1 from './components/Stage1';
import Stage2 from './components/Stage2';
import Stage3 from './components/Stage3';
import Stage4 from './components/Stage4';
import Stage5 from './components/Stage5';
import Stage6 from './components/Stage6';
import Stage7 from './components/Stage7';
import Stage8 from './components/Stage8';
import Stage9 from './components/Stage9';
import Stage10 from './components/Stage10'; // <-- Import Stage 10

// Tipe Data untuk Navigasi
type GuideStage = 
  | 'intro' 
  | 'profile' 
  | 'clan-hub' 
  | 'manage-clan' 
  | 'sync' 
  | 'war' 
  | 'tournament-create' 
  | 'tournament-play' 
  | 'knowledge' 
  | 'faq';

const STAGES: { id: GuideStage; label: string; description: string }[] = [
  { id: 'intro', label: '1. Pengenalan & Daftar', description: 'Mulai perjalananmu di Clashub' },
  { id: 'profile', label: '2. Profil Player', description: 'Hubungkan akun game CoC' },
  { id: 'clan-hub', label: '3. Cari Klan', description: 'Temukan komunitas baru' },
  { id: 'manage-clan', label: '4. Dasar Manajemen', description: 'Untuk Leader & Co-Leader' },
  { id: 'sync', label: '5. Sinkronisasi Data', description: 'Cara update data otomatis' },
  { id: 'war', label: '6. Analisis Perang', description: 'Pantau performa member' },
  { id: 'tournament-create', label: '7. Buat Turnamen', description: 'Panduan Organizer' },
  { id: 'tournament-play', label: '8. Ikut Turnamen', description: 'Panduan Peserta' },
  { id: 'knowledge', label: '9. Knowledge Hub', description: 'Berbagi strategi & base' },
  { id: 'faq', label: '10. FAQ & Bantuan', description: 'Pertanyaan umum' },
];

const GuideClient = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeStage, setActiveStage] = useState<GuideStage>('intro');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sinkronisasi URL dengan Tab Aktif
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && STAGES.some(s => s.id === tab)) {
      setActiveStage(tab as GuideStage);
    }
  }, [searchParams]);

  const handleStageChange = (stageId: GuideStage) => {
    setActiveStage(stageId);
    setIsMobileMenuOpen(false);
    // Update URL tanpa reload
    router.push(`/guide?tab=${stageId}`, { scroll: false });
    // Scroll ke atas konten
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderContent = () => {
    switch (activeStage) {
      case 'intro': return <Stage1 />;
      case 'profile': return <Stage2 />;
      case 'clan-hub': return <Stage3 />;
      case 'manage-clan': return <Stage4 />;
      case 'sync': return <Stage5 />;
      case 'war': return <Stage6 />;
      case 'tournament-create': return <Stage7 />;
      case 'tournament-play': return <Stage8 />;
      case 'knowledge': return <Stage9 />;
      case 'faq': return <Stage10 />; // <-- Render Stage 10
      default: 
        return (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-white/5 p-6 rounded-full mb-4">
              <BookOpenIcon className="h-12 w-12 text-gray-500" />
            </div>
            <h3 className="text-xl text-white font-clash mb-2">Konten Sedang Ditulis</h3>
            <p className="text-gray-400">Panduan untuk tahap ini akan segera tersedia.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-coc-dark text-white pt-24 pb-20">
      <div className="container mx-auto px-4">
        
        {/* Header Mobile */}
        <div className="lg:hidden flex items-center justify-between mb-6 bg-white/5 p-4 rounded-xl border border-white/10">
          <span className="font-clash text-lg text-coc-gold">Menu Panduan</span>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <XIcon className="h-6 w-6" /> : <MenuIcon className="h-6 w-6" />}
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* --- SIDEBAR NAVIGASI --- */}
          <aside className={`
            lg:w-80 flex-shrink-0 
            ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}
          `}>
            <div className="sticky top-28 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl p-4 overflow-hidden">
              <div className="mb-6 px-2">
                <h1 className="text-2xl font-clash text-white mb-1">Pusat Bantuan</h1>
                <p className="text-sm text-gray-400">Panduan lengkap Clashub</p>
              </div>

              <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                {STAGES.map((stage) => {
                  const isActive = activeStage === stage.id;
                  return (
                    <button
                      key={stage.id}
                      onClick={() => handleStageChange(stage.id)}
                      className={`
                        w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group relative
                        ${isActive 
                          ? 'bg-coc-gold text-black font-bold shadow-lg shadow-coc-gold/20' 
                          : 'text-gray-400 hover:bg-white/5 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className={`text-sm ${isActive ? 'text-black' : 'text-gray-300 group-hover:text-white'}`}>
                            {stage.label}
                          </p>
                          {isActive && (
                            <p className="text-xs text-black/70 mt-0.5 font-normal truncate">
                              {stage.description}
                            </p>
                          )}
                        </div>
                        {isActive && <ChevronRightIcon className="h-4 w-4 text-black" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Tombol Bantuan Ekstra */}
              <div className="mt-6 pt-6 border-t border-white/10 px-2">
                <p className="text-xs text-gray-500 mb-3 text-center">Masih butuh bantuan?</p>
                <Button 
                  href="https://discord.gg/clashub" 
                  target="_blank"
                  variant="outline" 
                  className="w-full justify-center text-xs"
                >
                  Join Discord Kami
                </Button>
              </div>
            </div>
          </aside>

          {/* --- KONTEN UTAMA --- */}
          <main className="flex-grow min-w-0">
            <div className="bg-black/20 backdrop-blur-md border border-white/5 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden animate-fade-in">
              {/* Dekorasi Background */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-coc-gold/5 rounded-full blur-[100px] -z-10 pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
              
              {renderContent()}

              {/* Footer Navigasi Konten */}
              <div className="mt-12 pt-8 border-t border-white/10 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Terakhir diperbarui: {new Date().toLocaleDateString('id-ID')}
                </div>
                
                {/* Logic Tombol Next */}
                {activeStage === 'intro' && (
                  <Button onClick={() => handleStageChange('profile')} variant="primary" size="sm">
                    Lanjut: Profil Player <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {activeStage === 'profile' && (
                  <Button onClick={() => handleStageChange('clan-hub')} variant="primary" size="sm">
                    Lanjut: Cari Klan <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {activeStage === 'clan-hub' && (
                  <Button onClick={() => handleStageChange('manage-clan')} variant="primary" size="sm">
                    Lanjut: Dasar Manajemen <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {activeStage === 'manage-clan' && (
                  <Button onClick={() => handleStageChange('sync')} variant="primary" size="sm">
                    Lanjut: Sinkronisasi <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {activeStage === 'sync' && (
                  <Button onClick={() => handleStageChange('war')} variant="primary" size="sm">
                    Lanjut: Analisis Perang <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {activeStage === 'war' && (
                  <Button onClick={() => handleStageChange('tournament-create')} variant="primary" size="sm">
                    Lanjut: Buat Turnamen <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {activeStage === 'tournament-create' && (
                  <Button onClick={() => handleStageChange('tournament-play')} variant="primary" size="sm">
                    Lanjut: Ikut Turnamen <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {activeStage === 'tournament-play' && (
                  <Button onClick={() => handleStageChange('knowledge')} variant="primary" size="sm">
                    Lanjut: Knowledge Hub <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                )}
                {activeStage === 'knowledge' && (
                  <Button onClick={() => handleStageChange('faq')} variant="primary" size="sm">
                    Lanjut: FAQ & Bantuan <ChevronRightIcon className="h-4 w-4 ml-1" />
                  </Button>
                )}
                
                {/* Tombol Finish di Stage Terakhir */}
                {activeStage === 'faq' && (
                  <Button onClick={() => router.push('/')} variant="success" size="sm">
                    <CheckCircleIcon className="h-4 w-4 mr-2" />
                    Selesai Membaca
                  </Button>
                )}
              </div>
            </div>
          </main>

        </div>
      </div>
    </div>
  );
};

export default GuideClient;