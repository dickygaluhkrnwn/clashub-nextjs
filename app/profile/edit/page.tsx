'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import { UserProfile } from '@/lib/types';
import { getUserProfile, updateUserProfile } from '@/lib/firestore'; // Impor fungsi Read dan Update
import { UserCircleIcon, SaveIcon, XIcon, InfoIcon, CogsIcon } from '@/app/components/icons';

// Opsi statis untuk dropdown
const thOptions = [16, 15, 14, 13, 12, 11, 10, 9];
const playStyleOptions = ['Attacker Utama', 'Base Builder', 'Donatur', 'Strategist']; // Menggunakan playStyle dari lib/types.ts

const EditProfilePage = () => {
  const { currentUser, loading: authLoading } = useAuth();
  const router = useRouter();

  // State untuk menyimpan data profil dari Firestore
  const [profileData, setProfileData] = useState<Partial<UserProfile> | null>(null);

  // State untuk input form yang dapat diubah (Initial state diisi saat fetch)
  const [displayName, setDisplayName] = useState('');
  const [playerTag, setPlayerTag] = useState('');
  const [thLevel, setThLevel] = useState<number>(0);
  const [bio, setBio] = useState('');
  const [playStyle, setPlayStyle] = useState('');
  const [activeHours, setActiveHours] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Efek untuk Route Protection dan Memuat Data Profil (Read)
  useEffect(() => {
    // 1. Route Protection
    if (!authLoading && !currentUser) {
      router.push('/auth');
      return;
    }

    // 2. Load User Profile Data (Tugas 3.3 - Read)
    const fetchProfile = async () => {
      if (currentUser) {
        setDataLoading(true);
        try {
          const profile = await getUserProfile(currentUser.uid);
          if (profile) {
            setProfileData(profile);
            
            // Mengisi State Form dengan data yang ada di Firestore
            setDisplayName(profile.displayName || '');
            setPlayerTag(profile.playerTag || '');
            setThLevel(profile.thLevel || 1); 
            setBio(profile.bio || '');
            setPlayStyle(profile.playStyle || '');
            setActiveHours(profile.activeHours || '');
          } else {
            setError("Gagal menemukan data profil.");
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

  // Fungsi untuk menangani proses Submit (Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || isSaving) return;

    setIsSaving(true);
    setError(null);

    // Data yang akan dikirim ke Firestore
    const updatedData: Partial<UserProfile> = {
        displayName,
        // PlayerTag tidak dikirim karena ReadOnly dan tidak boleh diubah user
        thLevel: thLevel,
        bio,
        playStyle,
        activeHours,
        // Properti lain seperti role dan reputation tidak diubah dari sini
    };

    try {
        // Panggil fungsi Update ke Firestore (Tugas 3.3 - Update)
        await updateUserProfile(currentUser.uid, updatedData);
        
        // Alihkan pengguna ke halaman profil setelah berhasil
        // Catatan: Gunakan modal custom di masa depan, bukan alert
        alert("E-Sports CV berhasil diperbarui!"); 
        router.push('/profile');
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
            <p className="text-xl text-coc-gold">Memuat Editor CV...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="card-stone p-8 max-w-md text-center">
              <h2 className="text-2xl text-coc-red mb-4">Error Memuat Profil</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <Button onClick={() => router.push('/profile')} variant="secondary">Kembali ke Profil</Button>
            </div>
        </div>
    );
  }

  // Tampilan utama form
  if (currentUser) {
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
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
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
                        value={playerTag}
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
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
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
                        value={thLevel}
                        onChange={(e) => setThLevel(parseInt(e.target.value, 10))}
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
                        value={playStyle}
                        onChange={(e) => setPlayStyle(e.target.value)}
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
                    value={activeHours}
                    onChange={(e) => setActiveHours(e.target.value)}
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
  }

  return null;
};

export default EditProfilePage;
