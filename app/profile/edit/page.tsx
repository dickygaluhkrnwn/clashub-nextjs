'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import { UserProfile } from '@/lib/types';
import { getUserProfile, updateUserProfile } from '@/lib/firestore';
import { UserCircleIcon, SaveIcon, XIcon, InfoIcon, CogsIcon } from '@/app/components/icons';

// Opsi statis untuk dropdown
const thOptions = [16, 15, 14, 13, 12, 11, 10, 9];
const playStyleOptions = ['Attacker Utama', 'Base Builder', 'Donatur', 'Strategist'];

const EditProfilePage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  // State untuk input form yang dapat diubah
  const [formData, setFormData] = useState<Partial<UserProfile>>({
    displayName: '',
    playerTag: '',
    thLevel: 0,
    bio: '',
    playStyle: undefined, 
    activeHours: '',
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle perubahan input form
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    
    // Perubahan ini diperlukan karena 'id' bisa berupa PlayStyle, yang tipenya ketat
    const isPlayStyle = id === 'playStyle';

    setFormData(prevData => ({
        ...prevData,
        [id]: id === 'thLevel' 
              ? (value ? parseInt(value, 10) : 0) // Konversi TH level ke angka
              : (isPlayStyle && value === "" ? undefined : value), // Biarkan playStyle tetap string, kecuali jika itu nilai default ""
    }));
  };

  // Efek untuk Route Protection dan Memuat Data Profil (Read - Tugas 3.3)
  useEffect(() => {
    // 1. Route Protection
    if (!authLoading && !currentUser) {
      router.push('/auth');
      return;
    }

    const fetchProfile = async () => {
      if (currentUser) {
        setDataLoading(true);
        try {
          const profile = await getUserProfile(currentUser.uid);
          
          if (profile) {
            // Mengisi state form dengan data yang ada di Firestore (Pre-fill)
            setFormData({
                displayName: profile.displayName || '',
                playerTag: profile.playerTag || '',
                thLevel: profile.thLevel || 10, 
                bio: profile.bio || '',
                // playStyle: jika nilainya ada, gunakan, jika tidak gunakan undefined
                playStyle: profile.playStyle || undefined, 
                activeHours: profile.activeHours || '',
            });
          } else {
            // Jika profil tidak ditemukan, isi dengan data dasar
            setFormData(prevData => ({
                ...prevData,
                displayName: currentUser.displayName || 'Pemain Baru',
                playerTag: '', 
                thLevel: 10, 
                bio: 'Ini adalah E-Sports CV baru saya di Clashub!',
                playStyle: undefined,
            }));
            setError("Profil tidak ditemukan. Silakan isi E-Sports CV Anda.");
          }
        } catch (err) {
          console.error("Gagal memuat profil:", err);
          setError("Gagal memuat data profil untuk diedit.");
        } finally {
          setDataLoading(false);
        }
      } else if (!authLoading) {
        setDataLoading(false);
      }
    };

    if (!authLoading && currentUser) {
        fetchProfile();
    }
  }, [currentUser, authLoading, router]);

  // Fungsi untuk menangani proses Submit (Update - Tugas 3.3)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isSaving) return;

    setIsSaving(true);
    setError(null);

    // Filter data yang diupdate
    const updatedData: Partial<UserProfile> = {
        displayName: formData.displayName,
        thLevel: formData.thLevel,
        bio: formData.bio,
        // PERBAIKAN UTAMA: Menggunakan 'as string' untuk mengatasi error TypeScript/ESLint
        // Ini memberi tahu TS untuk memperlakukan playStyle sebagai string normal saat dibandingkan dengan "".
        playStyle: (formData.playStyle as string) === "" ? undefined : formData.playStyle, 
        activeHours: formData.activeHours,
    };

    try {
        await updateUserProfile(currentUser.uid, updatedData);
        
        // Catatan: Di masa depan ganti alert dengan modal/toast
        alert("E-Sports CV berhasil diperbarui!"); 
        router.push('/profile'); // Arahkan kembali ke halaman profil
    } catch (err) {
        console.error("Gagal menyimpan profil:", err);
        setError("Gagal menyimpan perubahan. Coba lagi.");
    } finally {
        setIsSaving(false);
    }
  };

  // Tampilan loading/error
  if (authLoading || dataLoading) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <p className="text-xl text-coc-gold font-supercell">Memuat Editor CV...</p>
        </div>
    );
  }

  // Handle kasus jika terjadi error fatal atau pengguna belum login
  if (!currentUser) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="card-stone p-8 max-w-md text-center">
              <h2 className="text-2xl text-coc-red mb-4 font-supercell">Akses Ditolak</h2>
              <p className="text-gray-400 mb-6">Anda harus login untuk mengedit profil.</p>
              <Button onClick={() => router.push('/auth')} variant="primary">Login Sekarang</Button>
            </div>
        </div>
    );
  }

  // Tampilan utama form
  return (
    <main className="container mx-auto p-4 md:p-8 mt-10">
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="card-stone p-8 space-y-8">
          <h1 className="text-3xl md:text-4xl text-center mb-6">
              <UserCircleIcon className="inline h-8 w-8 mr-2 text-coc-gold"/>
              Edit E-Sports CV
          </h1>
          
          {error && <p className="bg-coc-red/20 text-red-400 text-center text-sm p-3 rounded-md mb-4">{error}</p>}

          {/* Bagian 1: Informasi Dasar */}
          <h3 className="text-xl font-supercell text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
              <InfoIcon className="h-5 w-5"/> Informasi Dasar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="form-group">
                  <label htmlFor="displayName" className="block text-sm font-bold text-gray-300 mb-2">Nama Tampilan</label>
                  <input
                      type="text"
                      id="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      placeholder="Contoh: Lord Z"
                      required
                      className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold"
                  />
              </div>
              <div className="form-group">
                  <label htmlFor="playerTag" className="block text-sm font-bold text-gray-300 mb-2">Player Tag (Tidak Dapat Diubah)</label>
                  <input
                      type="text"
                      id="playerTag"
                      value={formData.playerTag}
                      readOnly
                      disabled
                      className="w-full bg-coc-stone/30 border border-gray-500 rounded-md px-4 py-2 text-gray-400"
                  />
              </div>
          </div>
          <div className="form-group">
              <label htmlFor="bio" className="block text-sm font-bold text-gray-300 mb-2">Bio & Visi (Maks 500 karakter)</label>
              <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Jelaskan gaya bermain, role, dan tim seperti apa yang Anda cari..."
                  rows={4}
                  maxLength={500}
                  className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold resize-y"
              />
          </div>
          
          {/* Bagian 2: Preferensi Game */}
          <h3 className="text-xl font-supercell text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2 flex items-center gap-2">
              <CogsIcon className="h-5 w-5"/> Preferensi Game
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                  <label htmlFor="thLevel" className="block text-sm font-bold text-gray-300 mb-2">Level Town Hall</label>
                  <select
                      id="thLevel"
                      value={formData.thLevel || 0}
                      onChange={handleInputChange}
                      required
                      className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
                  >
                      <option value="0">-- Pilih TH Level --</option>
                      {thOptions.map(th => (
                          <option key={th} value={th}>Town Hall {th}</option>
                      ))}
                  </select>
              </div>
              <div className="form-group">
                  <label htmlFor="playStyle" className="block text-sm font-bold text-gray-300 mb-2">Role Favorit</label>
                  <select
                      id="playStyle"
                      value={formData.playStyle || ""} 
                      onChange={handleInputChange}
                      className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
                  >
                      <option value="">-- Pilih Role --</option>
                      {playStyleOptions.map(role => (
                          <option key={role} value={role}>{role}</option>
                      ))}
                  </select>
              </div>
          </div>
          <div className="form-group">
              <label htmlFor="activeHours" className="block text-sm font-bold text-gray-300 mb-2">Jam Aktif (Contoh: 20:00 - 23:00 WIB)</label>
              <input
                  type="text"
                  id="activeHours"
                  value={formData.activeHours}
                  onChange={handleInputChange}
                  placeholder="Contoh: 19:00 - 22:00 WIB"
                  className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold"
              />
          </div>


          {/* Tombol Aksi */}
          <div className="flex flex-col sm:flex-row justify-end items-center gap-4 pt-6 border-t border-coc-gold-dark/20">
              <Button href="/profile" variant="secondary" className="w-full sm:w-auto">
                  <XIcon className="inline h-5 w-5 mr-2"/>
                  Batal
              </Button>
              <Button type="submit" variant="primary" className="w-full sm:w-auto" disabled={isSaving}>
                  <SaveIcon className="inline h-5 w-5 mr-2"/>
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
              </Button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default EditProfilePage;
