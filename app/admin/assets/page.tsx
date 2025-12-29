'use client';

import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  TrashIcon, 
  SearchIcon, 
  ImageIcon, 
  RefreshCwIcon,
  CheckCircleIcon
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

interface GameAsset {
  id: string;
  name: string;
  type: string;
  slug: string;
  imageUrl: string;
}

// [UPDATE] Menambahkan 'town-hall' ke dalam tipe aset
const ASSET_TYPES = ['troop', 'hero', 'spell', 'pet', 'equipment', 'town-hall', 'league'];

export default function AssetManagerPage() {
  const [assets, setAssets] = useState<GameAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Form State
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('troop');
  const [formUrl, setFormUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  const fetchAssets = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/assets');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAssets(data);
      }
    } catch (error) {
      console.error("Gagal load assets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formUrl) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName,
          type: formType,
          imageUrl: formUrl
        })
      });

      if (!res.ok) throw new Error("Gagal menyimpan");

      alert("Aset berhasil disimpan!");
      setFormName('');
      setFormUrl('');
      fetchAssets(); // Refresh list
    } catch (error) {
      alert((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus aset ini?")) return;
    try {
      await fetch(`/api/admin/assets?id=${id}`, { method: 'DELETE' });
      setAssets(prev => prev.filter(a => a.id !== id));
    } catch (error) {
      alert("Gagal menghapus");
    }
  };

  // Filter Logic
  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-clash text-white mb-2 flex items-center gap-3">
          <ImageIcon className="h-8 w-8 text-coc-blue" />
          Game Asset Manager
        </h1>
        <p className="text-gray-400">
          Kelola gambar Troops, Heroes, Spells, dan Town Hall secara dinamis. Update gambar tanpa perlu deploy ulang website.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Form Input */}
        <div className="lg:col-span-1">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 sticky top-24">
            <h3 className="text-lg font-clash text-white mb-4 flex items-center gap-2">
              <PlusIcon className="h-5 w-5 text-coc-green" /> Tambah / Update Aset
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Nama Aset (Inggris)</label>
                <input 
                  type="text" 
                  placeholder="Contoh: Town Hall 16"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-coc-gold/50 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Tipe</label>
                <select 
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-coc-gold/50 transition-colors appearance-none"
                >
                  {ASSET_TYPES.map(t => (
                    <option key={t} value={t} className="bg-[#1a1a1a] text-white uppercase">{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">URL Gambar</label>
                <input 
                  type="url" 
                  placeholder="https://..."
                  value={formUrl}
                  onChange={(e) => setFormUrl(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-xl py-2.5 px-4 text-white focus:outline-none focus:border-coc-gold/50 transition-colors text-xs font-mono"
                  required
                />
                <p className="text-[10px] text-gray-500 mt-2">
                  *Gunakan link langsung ke gambar (png/jpg/webp). Disarankan background transparan.
                </p>
              </div>

              {/* Preview */}
              {formUrl && (
                <div className="bg-black/40 p-4 rounded-xl border border-white/5 flex flex-col items-center">
                  <p className="text-xs text-gray-500 mb-2">Preview:</p>
                  <img src={formUrl} alt="Preview" className="h-20 object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                </div>
              )}

              <Button 
                disabled={isSubmitting}
                className="w-full justify-center"
              >
                {isSubmitting ? <RefreshCwIcon className="animate-spin h-5 w-5" /> : 'Simpan Aset'}
              </Button>
            </form>
          </div>
        </div>

        {/* List Aset */}
        <div className="lg:col-span-2">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden min-h-[500px] flex flex-col">
            
            {/* Toolbar Filter */}
            <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/5">
              <div className="relative w-full sm:w-64">
                <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Cari aset..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-9 pr-4 text-sm text-white focus:outline-none focus:border-coc-blue/50"
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto max-w-full pb-1 sm:pb-0 no-scrollbar">
                <button 
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${filterType === 'all' ? 'bg-white text-black' : 'bg-black/30 text-gray-400 hover:text-white'}`}
                >
                  ALL
                </button>
                {ASSET_TYPES.map(t => (
                  <button 
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap uppercase transition-colors ${filterType === t ? 'bg-coc-gold text-black' : 'bg-black/30 text-gray-400 hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid Items */}
            <div className="flex-1 p-6">
              {isLoading ? (
                <div className="text-center py-20 text-gray-500">Memuat Aset...</div>
              ) : filteredAssets.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  {searchTerm ? 'Tidak ada aset yang cocok.' : 'Belum ada aset tersimpan.'}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredAssets.map((asset) => (
                    <div key={asset.id} className="bg-black/30 border border-white/5 rounded-xl p-3 flex flex-col items-center group relative hover:border-coc-gold/30 transition-all">
                      
                      {/* Delete Button (Hover) */}
                      <button 
                        onClick={() => handleDelete(asset.id)}
                        className="absolute top-2 right-2 p-1.5 bg-red-500/20 text-red-400 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 hover:text-white"
                        title="Hapus"
                      >
                        <TrashIcon className="h-3 w-3" />
                      </button>

                      <div className="h-16 w-16 mb-3 flex items-center justify-center">
                        <img src={asset.imageUrl} alt={asset.name} className="max-h-full max-w-full object-contain drop-shadow-lg" />
                      </div>
                      
                      <p className="text-xs font-bold text-white text-center line-clamp-1 w-full" title={asset.name}>
                        {asset.name}
                      </p>
                      <span className="text-[9px] text-gray-500 uppercase tracking-wider mt-1 bg-white/5 px-2 py-0.5 rounded">
                        {asset.type}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}