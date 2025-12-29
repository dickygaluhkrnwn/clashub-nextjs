'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AlertTriangleIcon, BanIcon } from '@/app/components/icons';
// Hapus import Button karena tidak lagi digunakan
// import { Button } from '@/app/components/ui/Button';

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
    <div className="fixed inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300 cursor-not-allowed">
      <div className="bg-coc-red/10 p-6 rounded-full border-4 border-coc-red/30 mb-6 shadow-[0_0_50px_rgba(255,0,0,0.2)] animate-pulse">
        <BanIcon className="h-20 w-20 text-coc-red" />
      </div>
      
      <h1 className="font-clash text-4xl md:text-6xl text-white mb-4 tracking-wide">
        UNDER MAINTENANCE
      </h1>
      
      <p className="text-gray-400 text-lg max-w-lg mb-10 leading-relaxed">
        Sistem Clashub sedang menjalani perbaikan atau pembaruan penting. 
        <br />
        Kami akan segera kembali dengan fitur yang lebih baik!
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center gap-2 text-sm text-coc-gold bg-coc-gold/10 px-4 py-2 rounded-lg border border-coc-gold/20">
          <AlertTriangleIcon className="h-4 w-4" />
          <span>Estimasi waktu: Segera</span>
        </div>

        {/* Tombol Login dihapus agar tidak memancing user biasa */}
      </div>
    </div>
  );
}