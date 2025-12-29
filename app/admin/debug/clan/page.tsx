'use client';

import React, { useState } from 'react';
import { 
  SearchIcon, 
  RefreshCwIcon, 
  GlobeIcon, 
  ShieldIcon, 
  AlertTriangleIcon,
  CogsIcon 
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

export default function ClanInspectorPage() {
  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  // 1. Handler untuk Inspect Data (Panggil API Debug)
  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tagInput) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Hapus karakter # jika user mengetiknya, agar URL param bersih
      const cleanTag = tagInput.replace('#', '');
      const res = await fetch(`/api/admin/debug/clan?tag=${encodeURIComponent(cleanTag)}`);
      const result = await res.json();

      if (!res.ok) throw new Error(result.error || 'Gagal melakukan inspeksi');

      setData(result);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handler untuk Force Sync (Tindakan Perbaikan)
  const handleForceSync = async () => {
    if (!data?.clanId) return;
    if (!confirm("PERINGATAN: Ini akan memaksa sinkronisasi ulang data Basic, War, dan Log. Data cache lama akan ditimpa dengan data Live API. Lanjutkan?")) return;

    setSyncLoading(true);
    try {
      // Panggil urutan endpoint sync yang sama dengan di Frontend User
      // Kita panggil satu per satu untuk memastikan urutan
      await fetch(`/api/clan/manage/${data.clanId}/sync/basic`, { method: 'POST' });
      await fetch(`/api/clan/manage/${data.clanId}/sync/war`, { method: 'POST' });
      await fetch(`/api/clan/manage/${data.clanId}/sync/warlog`, { method: 'POST' });
      
      alert("Sinkronisasi paksa berhasil! Data database telah diperbarui.");
      
      // Auto re-inspect untuk melihat hasil terbaru
      const cleanTag = tagInput.replace('#', '');
      const res = await fetch(`/api/admin/debug/clan?tag=${encodeURIComponent(cleanTag)}`);
      const result = await res.json();
      setData(result);

    } catch (err) {
      alert("Gagal melakukan sync: " + (err as Error).message);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-clash text-white mb-2 flex items-center gap-3">
          <CogsIcon className="h-8 w-8 text-coc-gold" />
          Clan Inspector (Debugger)
        </h1>
        <p className="text-gray-400">
          Alat diagnosa tingkat lanjut untuk membandingkan data tersimpan (Firestore) vs data langsung (Supercell API).
        </p>
      </div>

      {/* Search Bar Panel */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-lg">
        <form onSubmit={handleInspect} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Masukkan Clan Tag (contoh: #2ABC...)"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-coc-gold/50 transition-colors font-mono"
            />
          </div>
          <Button 
            disabled={loading || !tagInput} 
            className="md:w-auto w-full justify-center min-w-[140px]"
          >
            {loading ? <RefreshCwIcon className="animate-spin h-5 w-5" /> : 'Inspect Data'}
          </Button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-coc-red/10 border border-coc-red/20 rounded-xl flex items-start gap-3">
            <AlertTriangleIcon className="h-5 w-5 text-coc-red flex-shrink-0 mt-0.5" />
            <p className="text-coc-red text-sm">{error}</p>
          </div>
        )}
      </div>

      {/* Inspection Results Area */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* KOLOM KIRI: Data Database (Firestore) */}
          <div className="flex flex-col h-[600px] bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <ShieldIcon className="h-5 w-5 text-coc-green" />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Firestore Database</h3>
              </div>
              <span className="text-[10px] bg-black/40 text-gray-400 px-2 py-1 rounded font-mono border border-white/5">
                Stored Data
              </span>
            </div>
            
            <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-black/20">
              {typeof data.comparison.firestore.main === 'string' ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <AlertTriangleIcon className="h-8 w-8 mb-2 opacity-50" />
                  <p>{data.comparison.firestore.main}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-coc-green mb-2 uppercase opacity-70">Main Document (managedClans)</h4>
                    <JsonViewer data={data.comparison.firestore.main} color="text-coc-green" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-coc-green mb-2 uppercase opacity-70">Cache Document (clanApiCache)</h4>
                    <JsonViewer data={data.comparison.firestore.cache} color="text-green-300" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* KOLOM KANAN: Data Live API (Supercell) */}
          <div className="flex flex-col h-[600px] bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <GlobeIcon className="h-5 w-5 text-coc-blue" />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Supercell API</h3>
              </div>
              
              <div className="flex gap-2">
                <span className="text-[10px] bg-black/40 text-gray-400 px-2 py-1 rounded font-mono border border-white/5">
                  Live Data
                </span>
                
                {/* Tombol Force Sync hanya muncul jika klan ada di DB (punya ID) */}
                {data.clanId && (
                  <button 
                    onClick={handleForceSync}
                    disabled={syncLoading}
                    className="flex items-center gap-1 text-[10px] bg-coc-blue/10 hover:bg-coc-blue/20 text-coc-blue px-3 py-1 rounded border border-coc-blue/20 transition-all disabled:opacity-50"
                    title="Paksa update database dengan data live ini"
                  >
                    <RefreshCwIcon className={`h-3 w-3 ${syncLoading ? 'animate-spin' : ''}`} />
                    {syncLoading ? 'Syncing...' : 'Force Sync'}
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-black/20">
              {data.comparison.liveApi.error ? (
                <div className="flex flex-col items-center justify-center h-full text-coc-red">
                  <AlertTriangleIcon className="h-8 w-8 mb-2 opacity-50" />
                  <p>API Error: {data.comparison.liveApi.error}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xs font-bold text-coc-blue mb-2 uppercase opacity-70">Response /clans/{'{tag}'}</h4>
                    <JsonViewer data={data.comparison.liveApi.data} color="text-coc-blue" />
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// Helper untuk menampilkan JSON dengan rapi dan berwarna
const JsonViewer = ({ data, color }: { data: any, color: string }) => (
  <pre className={`text-[10px] md:text-xs font-mono ${color} whitespace-pre-wrap break-all leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5`}>
    {JSON.stringify(data, null, 2)}
  </pre>
);