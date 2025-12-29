'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldIcon, 
  SearchIcon, 
  CheckCircleIcon, 
  BanIcon,
  RefreshCwIcon
} from '@/app/components/icons';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase';
import { ManagedClan } from '@/lib/clashub.types';

// [REFACTOR] Interface AdminManagedClan dihapus karena ManagedClan sekarang sudah punya isVerified.

export default function ClanManagerPage() {
  const [clans, setClans] = useState<ManagedClan[]>([]);
  const [filteredClans, setFilteredClans] = useState<ManagedClan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchClans();
  }, []);

  useEffect(() => {
    if (!searchTerm) {
      setFilteredClans(clans);
    } else {
      const lowerTerm = searchTerm.toLowerCase();
      const filtered = clans.filter(clan => 
        (clan.name?.toLowerCase() || '').includes(lowerTerm) || 
        (clan.tag?.toLowerCase() || '').includes(lowerTerm)
      );
      setFilteredClans(filtered);
    }
  }, [searchTerm, clans]);

  const fetchClans = async () => {
    setIsLoading(true);
    try {
      // [FIX] Menghapus orderBy('createdAt') agar klan lama yang tidak punya field createdAt tetap muncul.
      // Kita gunakan limit(50) saja untuk mengambil data sembarang (default order by ID).
      const q = query(
        collection(db, 'managedClans'), 
        // orderBy('createdAt', 'desc'), // <-- Ini penyebab klan lama hilang
        limit(50)
      );
      
      const snapshot = await getDocs(q);
      const list: ManagedClan[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as ManagedClan);
      });
      setClans(list);
      setFilteredClans(list);
    } catch (error) {
      console.error("Gagal mengambil data klan:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleVerify = async (clanId: string, currentStatus: boolean) => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status verifikasi klan ini menjadi ${!currentStatus ? 'VERIFIED' : 'UNVERIFIED'}?`)) return;

    setProcessingId(clanId);
    try {
      const res = await fetch('/api/admin/clans/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clanId, isVerified: !currentStatus }),
      });

      if (!res.ok) throw new Error('Gagal update status');

      // Update state lokal
      const updatedClans = clans.map(c => 
        c.id === clanId ? { ...c, isVerified: !currentStatus } : c
      );
      setClans(updatedClans);
      
    } catch (error) {
      console.error("Error verification:", error);
      alert("Gagal mengubah status verifikasi.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-clash text-white mb-2 flex items-center gap-3">
            <ShieldIcon className="h-8 w-8 text-coc-blue" />
            Clan Manager
          </h1>
          <p className="text-gray-400">
            Validasi dan kelola klan yang terdaftar di platform.
          </p>
        </div>
        <button 
          onClick={fetchClans}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm font-bold text-coc-gold transition-colors"
        >
          <RefreshCwIcon className="h-4 w-4" /> Refresh Data
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Cari klan berdasarkan Nama atau Tag..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-coc-gold/50 transition-colors"
          />
        </div>
      </div>

      {/* Clan List Table */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/20 text-xs uppercase text-gray-500 font-bold">
              <tr>
                <th className="px-6 py-4">Klan</th>
                <th className="px-6 py-4 text-center">Level</th>
                <th className="px-6 py-4 text-center">Members</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 animate-pulse">
                    Memuat data klan...
                  </td>
                </tr>
              ) : filteredClans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Tidak ada klan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredClans.map((clan) => (
                  <tr key={clan.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 relative">
                           {/* Placeholder Badge jika tidak ada image */}
                           <div className="absolute inset-0 bg-coc-gold/10 rounded-full border border-coc-gold/20 flex items-center justify-center">
                             <ShieldIcon className="h-5 w-5 text-coc-gold opacity-50" />
                           </div>
                           {clan.logoUrl && (
                             <img 
                               src={clan.logoUrl} 
                               alt={clan.name} 
                               className="h-full w-full object-contain relative z-10"
                               onError={(e) => e.currentTarget.style.display = 'none'}
                             />
                           )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-bold text-white text-base">{clan.name}</p>
                            {/* Bungkus Icon dengan span untuk tooltip */}
                            {clan.isVerified && (
                              <span title="Verified Clan">
                                <CheckCircleIcon className="h-4 w-4 text-coc-blue" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 font-mono">{clan.tag}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center px-2 py-1 rounded bg-black/40 border border-white/10 text-coc-gold font-bold text-xs">
                        {clan.clanLevel || 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-400">
                      {clan.memberCount || 0}/50
                    </td>
                    <td className="px-6 py-4 text-center">
                      {clan.isVerified ? (
                        <span className="inline-flex items-center gap-1 bg-coc-blue/10 text-coc-blue px-2 py-1 rounded text-xs font-bold border border-coc-blue/20">
                          VERIFIED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-white/5 text-gray-500 px-2 py-1 rounded text-xs font-bold border border-white/10">
                          UNVERIFIED
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleToggleVerify(clan.id, !!clan.isVerified)}
                        disabled={processingId === clan.id}
                        className={`
                          p-2 rounded-lg border transition-all
                          ${clan.isVerified 
                            ? 'text-coc-red border-coc-red/30 hover:bg-coc-red/10' 
                            : 'text-coc-green border-coc-green/30 hover:bg-coc-green/10'
                          }
                          ${processingId === clan.id ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                        title={clan.isVerified ? "Hapus Verifikasi" : "Verifikasi Klan Ini"}
                      >
                        {processingId === clan.id ? (
                          <RefreshCwIcon className="h-5 w-5 animate-spin" />
                        ) : clan.isVerified ? (
                          <BanIcon className="h-5 w-5" />
                        ) : (
                          <CheckCircleIcon className="h-5 w-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}