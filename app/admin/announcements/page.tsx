'use client';

import React, { useState, useEffect } from 'react';
import { 
  MegaphoneIcon, 
  TrashIcon, 
  CheckCircleIcon, 
  PlusIcon,
  AlertTriangleIcon,
  InfoIcon,
  BanIcon
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import { 
  collection, 
  query, 
  orderBy, 
  getDocs, 
  Timestamp 
} from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger';
  isActive: boolean;
  createdAt: any;
  createdBy?: string;
}

export default function AnnouncementManagerPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'info' | 'warning' | 'danger'>('info');

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      // Read masih boleh pakai Client SDK (asalkan Rules mengizinkan Read Public)
      // Biasanya 'allow read: if true;' atau 'if request.auth != null' sudah cukup.
      const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const list: Announcement[] = [];
      snapshot.forEach(doc => {
        list.push({ id: doc.id, ...doc.data() } as Announcement);
      });
      setAnnouncements(list);
    } catch (error) {
      console.error("Gagal mengambil pengumuman:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- REVISI: Menggunakan API Route (Server-Side) ---
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, message, type }),
      });

      if (!res.ok) throw new Error('Gagal membuat pengumuman');

      // Reset form & Refresh list
      setTitle('');
      setMessage('');
      setType('info');
      fetchAnnouncements();
      alert('Pengumuman berhasil dibuat!');
    } catch (error) {
      console.error("Error creating announcement:", error);
      alert('Gagal membuat pengumuman. Pastikan Anda adalah Master Admin.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      // Optimistic update UI
      setAnnouncements(prev => prev.map(a => 
        a.id === id ? { ...a, isActive: !currentStatus } : a
      ));

      const res = await fetch('/api/admin/announcements', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus }),
      });

      if (!res.ok) {
        throw new Error('Gagal update status');
        // Revert jika gagal (opsional, tapi disarankan)
        fetchAnnouncements(); 
      }
    } catch (error) {
      console.error("Gagal update status:", error);
      alert("Gagal mengubah status pengumuman.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus pengumuman ini permanen?")) return;
    try {
      // Optimistic update
      setAnnouncements(prev => prev.filter(a => a.id !== id));

      const res = await fetch(`/api/admin/announcements?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Gagal menghapus');
        fetchAnnouncements(); // Revert
      }
    } catch (error) {
      console.error("Gagal hapus:", error);
      alert("Gagal menghapus pengumuman.");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-clash text-white mb-2 flex items-center gap-3">
          <MegaphoneIcon className="h-8 w-8 text-coc-gold" />
          Sistem Pengumuman Global
        </h1>
        <p className="text-gray-400">
          Buat banner pengumuman yang akan muncul di halaman utama semua pengguna. Gunakan untuk info maintenance atau update penting.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Buat Pengumuman */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 sticky top-24">
            <h3 className="text-lg font-clash text-white mb-4 flex items-center gap-2">
              <PlusIcon className="h-5 w-5 text-coc-green" /> Buat Pengumuman
            </h3>
            
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Judul</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Maintenance Server"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-coc-gold/50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Pesan</label>
                <textarea 
                  placeholder="Jelaskan detail pengumuman..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-coc-gold/50 transition-colors min-h-[100px]"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Tipe Alert</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setType('info')}
                    className={`p-2 rounded-lg text-xs font-bold border transition-all ${type === 'info' ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-gray-400'}`}
                  >
                    Info
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('warning')}
                    className={`p-2 rounded-lg text-xs font-bold border transition-all ${type === 'warning' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'bg-white/5 border-white/10 text-gray-400'}`}
                  >
                    Warning
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('danger')}
                    className={`p-2 rounded-lg text-xs font-bold border transition-all ${type === 'danger' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-white/10 text-gray-400'}`}
                  >
                    Danger
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  disabled={isSubmitting}
                  className="w-full justify-center"
                >
                  {isSubmitting ? 'Menerbitkan...' : 'Terbitkan Pengumuman'}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Daftar Pengumuman */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-clash text-white">Riwayat Pengumuman</h3>
              <span className="bg-white/5 px-3 py-1 rounded-full text-xs text-gray-400 border border-white/10">
                {announcements.length} Item
              </span>
            </div>

            <div className="divide-y divide-white/5">
              {isLoading ? (
                <div className="p-8 text-center text-gray-500">Memuat...</div>
              ) : announcements.length === 0 ? (
                <div className="p-8 text-center text-gray-500">Belum ada pengumuman.</div>
              ) : (
                announcements.map((item) => (
                  <div key={item.id} className="p-6 flex flex-col sm:flex-row gap-4 sm:items-start hover:bg-white/5 transition-colors">
                    {/* Icon Status */}
                    <div className="flex-shrink-0 mt-1">
                      {item.type === 'danger' ? (
                        <AlertTriangleIcon className="h-6 w-6 text-red-500" />
                      ) : item.type === 'warning' ? (
                        <AlertTriangleIcon className="h-6 w-6 text-yellow-500" />
                      ) : (
                        <InfoIcon className="h-6 w-6 text-blue-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h4 className="text-white font-bold text-lg">{item.title}</h4>
                        {item.isActive ? (
                          <span className="bg-green-500/10 text-green-400 text-[10px] font-bold px-2 py-0.5 rounded border border-green-500/20 uppercase tracking-wide">
                            Active
                          </span>
                        ) : (
                          <span className="bg-gray-500/10 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-500/20 uppercase tracking-wide">
                            Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-sm mb-3">{item.message}</p>
                      <p className="text-[10px] text-gray-600 font-mono">
                        Dibuat: {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleString() : 'Baru saja'}
                      </p>
                    </div>

                    <div className="flex sm:flex-col gap-2">
                      <button 
                        onClick={() => handleToggleActive(item.id, item.isActive)}
                        className={`p-2 rounded-lg border transition-colors ${item.isActive ? 'text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/10' : 'text-green-400 border-green-500/30 hover:bg-green-500/10'}`}
                        title={item.isActive ? "Matikan Pengumuman" : "Aktifkan Pengumuman"}
                      >
                        {item.isActive ? <BanIcon className="h-5 w-5" /> : <CheckCircleIcon className="h-5 w-5" />}
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-500 border border-white/10 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Hapus Permanen"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}