'use client';

import React, { useState, useEffect } from 'react';
import { 
  AlertTriangleIcon, 
  CheckCircleIcon, 
  CogsIcon, 
  BanIcon,
  RefreshCwIcon
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

export default function MaintenancePage() {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch status saat ini
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/admin/maintenance');
        const data = await res.json();
        setIsActive(data.maintenanceMode);
      } catch (error) {
        console.error("Gagal mengambil status maintenance:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
  }, []);

  const handleToggle = async () => {
    const action = isActive ? "MEMATIKAN" : "MENYALAKAN";
    const confirmMessage = isActive 
      ? "Apakah Anda yakin ingin mematikan Maintenance Mode? Website akan kembali dapat diakses oleh publik."
      : "PERINGATAN: Menyalakan Maintenance Mode akan memblokir akses semua pengguna non-admin ke website. Lanjutkan?";

    if (!confirm(confirmMessage)) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isActive }),
      });

      if (!res.ok) throw new Error("Gagal mengubah status");

      const data = await res.json();
      setIsActive(data.maintenanceMode);
      alert(`Berhasil ${action} Maintenance Mode.`);
    } catch (error) {
      alert("Terjadi kesalahan: " + (error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-coc-gold animate-pulse">
        <RefreshCwIcon className="h-8 w-8 animate-spin mr-2" /> Memuat Status Sistem...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-clash text-white mb-2 flex items-center gap-3">
          <AlertTriangleIcon className={`h-8 w-8 ${isActive ? 'text-coc-red' : 'text-gray-400'}`} />
          Maintenance Mode
        </h1>
        <p className="text-gray-400">
          Saklar darurat untuk menutup akses publik ke website sementara waktu.
        </p>
      </div>

      <div className="max-w-2xl">
        <div className={`border rounded-2xl p-8 text-center transition-all duration-500 ${
          isActive 
            ? 'bg-coc-red/10 border-coc-red/50 shadow-[0_0_50px_rgba(255,0,0,0.2)]' 
            : 'bg-[#1a1a1a] border-white/10'
        }`}>
          
          <div className="flex justify-center mb-6">
            <div className={`p-6 rounded-full border-4 transition-all duration-500 ${
              isActive 
                ? 'bg-coc-red text-white border-red-900 shadow-xl scale-110' 
                : 'bg-white/5 text-gray-500 border-white/10'
            }`}>
              {isActive ? (
                <BanIcon className="h-16 w-16" />
              ) : (
                <CheckCircleIcon className="h-16 w-16" />
              )}
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-2">
            Status: <span className={isActive ? 'text-coc-red' : 'text-coc-green'}>
              {isActive ? 'SYSTEM LOCKED (MAINTENANCE)' : 'SYSTEM ONLINE'}
            </span>
          </h2>
          
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            {isActive 
              ? "Website saat ini terkunci. Hanya Master Admin yang dapat mengakses halaman. Pengguna lain akan dialihkan ke halaman 'Under Maintenance'."
              : "Website berjalan normal dan dapat diakses oleh semua pengguna publik."
            }
          </p>

          <Button
            onClick={handleToggle}
            disabled={isProcessing}
            variant={isActive ? 'success' : 'danger'}
            className="w-full max-w-sm py-4 text-lg shadow-2xl"
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <RefreshCwIcon className="h-5 w-5 animate-spin mr-2" /> Memproses...
              </span>
            ) : isActive ? (
              "Matikan Maintenance Mode"
            ) : (
              "Aktifkan Maintenance Mode"
            )}
          </Button>

        </div>

        <div className="mt-8 bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
          <CogsIcon className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-bold text-blue-400 mb-1">Catatan Teknis:</p>
            <p>
              Perubahan status ini tersimpan di Database Global (`settings/general`). 
              Efeknya mungkin membutuhkan waktu beberapa detik untuk menyebar ke seluruh sistem.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}