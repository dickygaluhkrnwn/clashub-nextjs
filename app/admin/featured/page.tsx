'use client';

import React, { useState, useEffect } from 'react';
import { 
  StarIcon, 
  TrashIcon, 
  PlusIcon, 
  ShieldIcon, 
  UserIcon, 
  SearchIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  AlertTriangleIcon
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

interface FeaturedItem {
  id: string;
  tag: string;
  type: 'clan' | 'player';
  title: string;
  description: string;
  gameData: {
    name: string;
    image: string;
    level: number;
  };
  isActive: boolean;
  createdAt: any;
}

export default function FeaturedManagerPage() {
  const [items, setItems] = useState<FeaturedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [tag, setTag] = useState('');
  const [type, setType] = useState<'clan' | 'player'>('clan');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Preview State
  const [previewData, setPreviewData] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkError, setCheckError] = useState<string | null>(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/featured');
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
    } catch (error) {
      console.error("Gagal load featured items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler: Cek Tag ke API Debugger (untuk Preview)
  const handleCheckTag = async () => {
    if (!tag) return;
    setIsChecking(true);
    setCheckError(null);
    setPreviewData(null);

    const cleanTag = tag.replace('#', '');
    const endpoint = type === 'clan' ? '/api/admin/debug/clan' : '/api/admin/debug/user';

    try {
      const res = await fetch(`${endpoint}?tag=${encodeURIComponent(cleanTag)}&q=${encodeURIComponent(cleanTag)}`);
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Data tidak ditemukan');

      // Normalisasi data preview dari respon API Debugger
      const liveData = result.comparison.liveApi.data;
      if (!liveData) throw new Error('Data Live API tidak tersedia');

      setPreviewData({
        name: liveData.name,
        // Adaptasi struktur data Clan vs Player
        image: type === 'clan' ? liveData.badgeUrls?.medium : (liveData.league?.iconUrls?.medium || ''),
        level: type === 'clan' ? liveData.clanLevel : liveData.townHallLevel,
        role: type === 'player' ? liveData.role : null
      });

    } catch (err) {
      setCheckError((err as Error).message);
    } finally {
      setIsChecking(false);
    }
  };

  // Handler: Simpan ke Database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewData) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/featured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag, type, title, description })
      });

      if (!res.ok) throw new Error('Gagal menyimpan');

      alert("Berhasil menambahkan ke etalase!");
      setTag('');
      setTitle('');
      setDescription('');
      setPreviewData(null);
      fetchItems();
    } catch (error) {
      alert("Error: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus item ini dari etalase?")) return;
    try {
      await fetch(`/api/admin/featured?id=${id}`, { method: 'DELETE' });
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (error) {
      alert("Gagal menghapus");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-clash text-white mb-2 flex items-center gap-3">
          <StarIcon className="h-8 w-8 text-coc-gold" />
          Featured Manager
        </h1>
        <p className="text-gray-400">
          Kelola etalase "Spotlight" di halaman depan. Pajang klan atau pemain terbaik.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Input */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 sticky top-24">
            <h3 className="text-lg font-clash text-white mb-4 flex items-center gap-2">
              <PlusIcon className="h-5 w-5 text-coc-green" /> Tambah Spotlight
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Pilihan Tipe */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl">
                <button
                  type="button"
                  onClick={() => { setType('clan'); setPreviewData(null); }}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${type === 'clan' ? 'bg-coc-gold text-black shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  Clan
                </button>
                <button
                  type="button"
                  onClick={() => { setType('player'); setPreviewData(null); }}
                  className={`py-2 rounded-lg text-sm font-bold transition-all ${type === 'player' ? 'bg-coc-gold text-black shadow' : 'text-gray-400 hover:text-white'}`}
                >
                  Player
                </button>
              </div>

              {/* Input Tag & Check */}
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Game Tag</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="#ABC1234"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-coc-gold/50 transition-colors font-mono uppercase"
                  />
                  <button 
                    type="button"
                    onClick={handleCheckTag}
                    disabled={!tag || isChecking}
                    className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition-colors disabled:opacity-50"
                  >
                    {isChecking ? <RefreshCwIcon className="h-5 w-5 animate-spin" /> : <SearchIcon className="h-5 w-5" />}
                  </button>
                </div>
                {checkError && <p className="text-xs text-coc-red mt-2">{checkError}</p>}
              </div>

              {/* Preview Box */}
              {previewData && (
                <div className="bg-coc-gold/5 border border-coc-gold/20 rounded-xl p-4 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                   <div className="h-12 w-12 relative flex-shrink-0">
                     <img src={previewData.image} alt="Preview" className="w-full h-full object-contain drop-shadow-md" />
                   </div>
                   <div className="flex-1 min-w-0">
                     <h4 className="font-bold text-white text-sm truncate">{previewData.name}</h4>
                     <p className="text-xs text-coc-gold">
                       {type === 'clan' ? `Level ${previewData.level}` : `TH ${previewData.level}`}
                       {previewData.role && ` • ${previewData.role}`}
                     </p>
                     <div className="flex items-center gap-1 mt-1 text-[10px] text-green-400">
                       <CheckCircleIcon className="h-3 w-3" /> Data Valid
                     </div>
                   </div>
                </div>
              )}

              {/* Detail Input (Hanya muncul jika preview valid) */}
              {previewData && (
                <div className="space-y-4 pt-2 border-t border-white/5 animate-in fade-in">
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Judul Promo</label>
                        <input 
                        type="text" 
                        placeholder={type === 'clan' ? "Clan of the Week" : "Top Player"}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-coc-gold/50 transition-colors"
                        required
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Deskripsi Singkat</label>
                        <textarea 
                        placeholder="Kenapa item ini di-feature?"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-coc-gold/50 transition-colors h-24"
                        required
                        />
                    </div>

                    <Button 
                        disabled={isSubmitting}
                        className="w-full justify-center"
                    >
                        {isSubmitting ? 'Menyimpan...' : 'Simpan ke Etalase'}
                    </Button>
                </div>
              )}

            </form>
          </div>
        </div>

        {/* List Items */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h3 className="text-lg font-clash text-white">Item Sedang Tayang</h3>
              <span className="bg-white/5 px-3 py-1 rounded-full text-xs text-gray-400 border border-white/10">
                {items.length} Item
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              {isLoading ? (
                <div className="col-span-2 text-center py-10 text-gray-500">Memuat...</div>
              ) : items.length === 0 ? (
                <div className="col-span-2 text-center py-10 text-gray-500 bg-white/5 rounded-xl border border-white/5 border-dashed">
                  Belum ada item featured.
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="bg-black/30 border border-white/5 rounded-xl p-4 flex gap-4 hover:border-coc-gold/30 transition-all group relative">
                    {/* Delete Btn */}
                    <button 
                       onClick={() => handleDelete(item.id)}
                       className="absolute top-4 right-4 text-gray-600 hover:text-coc-red transition-colors opacity-0 group-hover:opacity-100"
                       title="Hapus dari Featured"
                    >
                        <TrashIcon className="h-5 w-5" />
                    </button>

                    <div className="flex-shrink-0">
                       <div className="h-16 w-16 bg-black/40 rounded-xl flex items-center justify-center border border-white/10 p-1">
                          <img src={item.gameData.image} alt={item.gameData.name} className="max-h-full max-w-full object-contain" />
                       </div>
                       <div className={`mt-2 text-center text-[10px] font-bold uppercase py-0.5 rounded border ${
                           item.type === 'clan' ? 'bg-coc-gold/10 text-coc-gold border-coc-gold/20' : 'bg-coc-blue/10 text-coc-blue border-coc-blue/20'
                       }`}>
                           {item.type}
                       </div>
                    </div>

                    <div className="flex-1 min-w-0 pr-6">
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                            {item.title}
                        </span>
                        <h4 className="text-lg font-clash text-white leading-tight mb-1 truncate">
                            {item.gameData.name}
                        </h4>
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-2">
                            {item.description}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                            <span className="bg-white/5 px-1.5 py-0.5 rounded">
                                {item.type === 'clan' ? `Lvl ${item.gameData.level}` : `TH ${item.gameData.level}`}
                            </span>
                            <span>{item.tag}</span>
                        </div>
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