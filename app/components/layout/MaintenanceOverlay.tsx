'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangleIcon, BanIcon } from '@/app/components/icons';

interface MaintenanceOverlayProps {
  isMaintenance: boolean;
  isAdmin: boolean;
}

export default function MaintenanceOverlay({ isMaintenance, isAdmin }: MaintenanceOverlayProps) {
  const pathname = usePathname();

  // Izinkan akses ke halaman auth dan api meskipun maintenance
  // Ini memungkinkan Admin mengetik '/auth' di URL bar untuk login (Backdoor aman)
  const isExcludedPath = pathname.startsWith('/auth') || pathname.startsWith('/api');

  // Jika tidak maintenance, atau user adalah admin, atau sedang di halaman login -> JANGAN BLOKIR
  if (!isMaintenance || isAdmin || isExcludedPath) {
    return null;
  }

  // TAMPILAN MAINTENANCE SCREEN
  return (
    <div className="fixed inset-0 z-[100] bg-[#0a0a0b] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 cursor-not-allowed">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-coc-red/5 via-transparent to-transparent opacity-50 pointer-events-none" />
      
      <div className="bg-[#15171e] p-8 rounded-full border-4 border-coc-red/30 mb-8 shadow-[0_0_50px_rgba(220,38,38,0.2)] animate-pulse relative z-10">
        <BanIcon className="h-24 w-24 text-coc-red drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]" />
      </div>
      
      <h1 className="font-clash text-4xl md:text-6xl text-white mb-6 tracking-widest uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] relative z-10">
        SYSTEM <span className="text-coc-red">LOCKDOWN</span>
      </h1>
      
      <div className="relative z-10 max-w-lg mx-auto bg-[#15171e]/80 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl">
          <p className="text-gray-300 text-lg mb-6 leading-relaxed font-sans">
            Sistem Clashub sedang menjalani pemeliharaan server atau pembaruan penting. 
            <br />
            <span className="text-gray-500 text-sm mt-2 block">Kami akan segera kembali dengan fitur yang lebih baik!</span>
          </p>

          <div className="flex justify-center">
            <div className="flex items-center gap-2 text-sm font-bold text-coc-gold bg-coc-gold/10 px-5 py-2.5 rounded-xl border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)] animate-pulse-slow">
              <AlertTriangleIcon className="h-4 w-4" />
              <span className="uppercase tracking-wide">ESTIMATED TIME: SOON</span>
            </div>
          </div>
      </div>
      
      {/* Footer Text */}
      <p className="absolute bottom-8 text-xs text-gray-600 font-mono uppercase tracking-widest opacity-50">
        Clashub Maintenance Protocol • v2.0
      </p>
    </div>
  );
}