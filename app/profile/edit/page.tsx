'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';

const EditProfilePage = () => {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  // State untuk menyimpan nilai dari input form
  const [displayName, setDisplayName] = useState('');
  const [playerTag, setPlayerTag] = useState('');
  const [thLevel, setThLevel] = useState('');

  // Route Protection: Sama seperti halaman profil
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/auth');
    }
  }, [currentUser, loading, router]);

  // Fungsi yang akan dijalankan saat form di-submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah halaman refresh
    
    const profileData = {
        displayName,
        playerTag,
        thLevel,
    };

    // Sesuai roadmap Sprint 2, kita hanya menampilkan data di console untuk saat ini.
    console.log("Data Profil untuk disimpan:", profileData);

    alert("Data profil telah disimpan ke console! (Penyimpanan ke database akan diimplementasikan di Sprint 3)");
    router.push('/profile'); // Arahkan kembali ke halaman profil setelah submit
  };

  // Tampilan loading
  if (loading) {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <p className="text-xl text-coc-gold">Memuat...</p>
        </div>
    );
  }

  // Tampilan utama jika pengguna sudah login
  if (currentUser) {
    return (
      <main className="container mx-auto p-4 md:p-8 mt-10">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSubmit} className="card-stone p-8 space-y-6">
            <h1 className="text-3xl md:text-4xl text-center mb-6">Edit E-Sports CV</h1>

            {/* Input untuk Nama Tampilan */}
            <div>
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

            {/* Input untuk Player Tag */}
            <div>
              <label htmlFor="playerTag" className="block text-sm font-bold text-gray-300 mb-2">Player Tag</label>
              <input
                type="text"
                id="playerTag"
                value={playerTag}
                onChange={(e) => setPlayerTag(e.target.value)}
                placeholder="Contoh: #P20C8Y9L"
                required
                className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold"
              />
            </div>

            {/* Input untuk Level Town Hall */}
            <div>
              <label htmlFor="thLevel" className="block text-sm font-bold text-gray-300 mb-2">Level Town Hall</label>
              <select
                id="thLevel"
                value={thLevel}
                onChange={(e) => setThLevel(e.target.value)}
                required
                className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
              >
                <option value="">-- Pilih Level Town Hall --</option>
                <option value="16">Town Hall 16</option>
                <option value="15">Town Hall 15</option>
                <option value="14">Town Hall 14</option>
                <option value="13">Town Hall 13</option>
                <option value="12">Town Hall 12</option>
              </select>
            </div>

            {/* Tombol Aksi */}
            <div className="flex justify-end items-center gap-4 pt-6 border-t border-coc-gold-dark/20">
                <Button href="/profile" variant="secondary">
                    Batal
                </Button>
                <Button type="submit" variant="primary">
                    Simpan Perubahan
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
