'use client';

import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  ShieldIcon, 
  UserPlusIcon, 
  TrashIcon, 
  CheckCircleIcon,
  SearchIcon,
  RefreshCwIcon,
  AlertTriangleIcon
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import { useAuth } from '@/app/context/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase';
import { UserProfile } from '@/lib/clashub.types';

export default function AdminUsersPage() {
  const { currentUser } = useAuth();
  
  // State untuk List Admin
  const [admins, setAdmins] = useState<UserProfile[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  
  // State untuk Pencarian User (Troubleshooting)
  const [searchEmail, setSearchEmail] = useState('');
  const [searchedUser, setSearchedUser] = useState<UserProfile | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  // State Aksi
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchAdmins();
  }, []);

  // 1. Fetch Daftar Admin
  const fetchAdmins = async () => {
    setIsLoadingAdmins(true);
    try {
      const q = query(collection(db, 'users'), where('isGlobalAdmin', '==', true));
      const snapshot = await getDocs(q);
      const list: UserProfile[] = [];
      snapshot.forEach(doc => list.push(doc.data() as UserProfile));
      setAdmins(list);
    } catch (error) {
      console.error("Gagal load admin:", error);
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  // 2. Cari User Spesifik
  const handleSearchUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;

    setIsSearching(true);
    setSearchedUser(null);
    setSearchMessage(null);

    try {
      const q = query(collection(db, 'users'), where('email', '==', searchEmail));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setSearchMessage("User tidak ditemukan dengan email tersebut.");
      } else {
        setSearchedUser(snapshot.docs[0].data() as UserProfile);
      }
    } catch (error) {
      setSearchMessage("Terjadi kesalahan saat mencari.");
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Aksi: Promote/Demote
  const handleRoleChange = async (email: string, action: 'promote' | 'demote') => {
    if (!confirm(`Yakin ingin ${action} user ini?`)) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: email, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      alert(data.message);
      fetchAdmins(); // Refresh list admin
      if (searchedUser?.email === email) {
        // Refresh searched user data local
        setSearchedUser(prev => prev ? { ...prev, isGlobalAdmin: action === 'promote' } : null);
      }
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Aksi: Reset Verification (Fitur Baru)
  const handleResetVerification = async (email: string) => {
    const confirmMsg = "PERINGATAN KERAS:\n\nIni akan menghapus status verifikasi, player tag, dan asosiasi klan user ini.\nUser harus memverifikasi ulang API Token mereka.\n\nGunakan ini HANYA jika data klan user error/hilang.";
    if (!confirm(confirmMsg)) return;

    setIsProcessing(true);
    try {
      const res = await fetch('/api/admin/users/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail: email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert(data.message);
      // Update tampilan lokal agar terlihat efeknya
      if (searchedUser) {
        setSearchedUser({
          ...searchedUser,
          isVerified: false,
          playerTag: 'RESET',
          clanId: undefined,
          clanName: undefined
        });
      }
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-clash text-white mb-2 flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-coc-blue" />
          Manajemen & Support User
        </h1>
        <p className="text-gray-400">
          Kelola hak akses admin dan perbaiki akun user yang bermasalah.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* KOLOM KIRI: Pencarian & Aksi User */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Card Pencarian */}
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-clash text-white mb-4 flex items-center gap-2">
              <SearchIcon className="h-5 w-5 text-coc-gold" /> Cari User
            </h3>
            
            <form onSubmit={handleSearchUser} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Email Pengguna</label>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="user@example.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-coc-gold/50 transition-colors"
                    required
                  />
                  <button 
                    type="submit"
                    disabled={isSearching}
                    className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition-colors"
                  >
                    {isSearching ? <RefreshCwIcon className="h-5 w-5 animate-spin" /> : <SearchIcon className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </form>

            {searchMessage && (
              <p className="text-xs text-coc-red mt-3 bg-coc-red/10 p-2 rounded">{searchMessage}</p>
            )}
          </div>

          {/* Card Hasil Pencarian (User Detail) */}
          {searchedUser && (
            <div className="bg-[#1a1a1a] border border-coc-blue/30 rounded-2xl p-6 shadow-[0_0_20px_rgba(0,0,255,0.05)] animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center gap-4 mb-6 border-b border-white/5 pb-4">
                <div className="h-12 w-12 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                  <img 
                    src={searchedUser.avatarUrl || '/images/placeholder-avatar.png'} 
                    alt={searchedUser.displayName}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-white text-lg">{searchedUser.displayName}</p>
                  <p className="text-xs text-gray-500">{searchedUser.email}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <InfoRow label="Status Verifikasi" value={searchedUser.isVerified ? 'Verified ✅' : 'Not Verified ❌'} />
                <InfoRow label="Player Tag" value={searchedUser.playerTag || '-'} />
                <InfoRow label="Clan" value={searchedUser.clanName || '-'} />
                <InfoRow label="Role Admin" value={searchedUser.isGlobalAdmin ? 'MASTER ADMIN 🛡️' : 'User Biasa'} />
              </div>

              <div className="space-y-2">
                {/* Tombol Promote/Demote */}
                {searchedUser.isGlobalAdmin ? (
                  <Button 
                    variant="danger" 
                    className="w-full justify-center"
                    onClick={() => handleRoleChange(searchedUser.email!, 'demote')}
                    disabled={isProcessing || searchedUser.uid === currentUser?.uid}
                  >
                    Hapus Akses Admin
                  </Button>
                ) : (
                  <Button 
                    variant="secondary" 
                    className="w-full justify-center"
                    onClick={() => handleRoleChange(searchedUser.email!, 'promote')}
                    disabled={isProcessing}
                  >
                    <ShieldIcon className="h-4 w-4 mr-2" /> Jadikan Admin
                  </Button>
                )}

                {/* Tombol Reset (Fitur Baru) */}
                <Button 
                  variant="outline"
                  className="w-full justify-center border-coc-red/50 text-coc-red hover:bg-coc-red/10 mt-4"
                  onClick={() => handleResetVerification(searchedUser.email!)}
                  disabled={isProcessing}
                >
                  <RefreshCwIcon className="h-4 w-4 mr-2" /> Reset Verifikasi
                </Button>
                <p className="text-[10px] text-gray-500 text-center mt-2 leading-tight">
                  Gunakan "Reset" jika user terjebak di klan yang sudah dihapus atau salah link akun.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* KOLOM KANAN: Daftar Admin Aktif */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-clash text-white">Daftar Admin Aktif</h3>
              <span className="bg-coc-blue/10 text-coc-blue px-3 py-1 rounded-full text-xs font-bold border border-coc-blue/20">
                {admins.length} Admin
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-black/20 text-xs uppercase text-gray-500 font-bold">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                  {isLoadingAdmins ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">Memuat data...</td>
                    </tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin.uid} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-black/40 border border-white/10 overflow-hidden">
                              <img 
                                src={admin.avatarUrl || '/images/placeholder-avatar.png'} 
                                alt="Avatar"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-white">{admin.displayName}</p>
                              <p className="text-xs text-gray-500">{admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 bg-green-500/10 text-green-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-green-500/20">
                            <ShieldIcon className="h-3 w-3" /> Master Admin
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleRoleChange(admin.email!, 'demote')}
                            disabled={isProcessing || admin.uid === currentUser?.uid}
                            className="p-2 text-gray-500 hover:text-coc-red hover:bg-coc-red/10 rounded-lg transition-colors disabled:opacity-30"
                            title="Hapus Akses"
                          >
                            <TrashIcon className="h-4 w-4" />
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

      </div>
    </div>
  );
}

// Helper
const InfoRow = ({ label, value }: { label: string, value: string }) => (
  <div className="flex justify-between items-center text-sm border-b border-white/5 pb-2 last:border-0">
    <span className="text-gray-500">{label}</span>
    <span className="text-white font-medium max-w-[150px] truncate" title={value}>{value}</span>
  </div>
);