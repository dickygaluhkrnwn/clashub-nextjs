'use client';

import React, { useState } from 'react';
import { 
  SearchIcon, 
  RefreshCwIcon, 
  UserCircleIcon, 
  AlertTriangleIcon,
  CogsIcon,
  UserIcon
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

export default function UserInspectorPage() {
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [syncLoading, setSyncLoading] = useState(false);

  // 1. Handler Inspect
  const handleInspect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(`/api/admin/debug/user?q=${encodeURIComponent(queryInput)}`);
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

  // 2. Handler Force Sync
  const handleForceSync = async () => {
    if (!data?.userId || !data?.playerTag) return;
    if (!confirm("PERINGATAN: Ini akan menimpa data level, trophy, dan nama di database dengan data langsung dari Supercell API. Lanjutkan?")) return;

    setSyncLoading(true);
    try {
      const res = await fetch('/api/admin/debug/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: data.userId, playerTag: data.playerTag })
      });
      
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      alert("Sync Berhasil! Data user telah diperbarui.");
      
      // Auto re-inspect
      const resRefresh = await fetch(`/api/admin/debug/user?q=${encodeURIComponent(data.playerTag)}`);
      const resultRefresh = await resRefresh.json();
      setData(resultRefresh);

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
          <UserIcon className="h-8 w-8 text-coc-green" />
          User Inspector (Debugger)
        </h1>
        <p className="text-gray-400">
          Analisis akun pemain. Masukkan Email, UID, atau Player Tag (CoC) untuk melihat detailnya.
        </p>
      </div>

      {/* Search Bar Panel */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 shadow-lg">
        <form onSubmit={handleInspect} className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Email / UID / Player Tag (#ABC...)"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-coc-green/50 transition-colors font-mono"
            />
          </div>
          <Button 
            disabled={loading || !queryInput} 
            className="md:w-auto w-full justify-center min-w-[140px]"
            variant="secondary"
          >
            {loading ? <RefreshCwIcon className="animate-spin h-5 w-5" /> : 'Inspect User'}
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
          
          {/* KOLOM KIRI: Data Database */}
          <div className="flex flex-col h-[600px] bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <UserCircleIcon className="h-5 w-5 text-coc-gold" />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Firestore Profile</h3>
              </div>
              <span className="text-[10px] bg-black/40 text-gray-400 px-2 py-1 rounded font-mono border border-white/5">
                Stored Data
              </span>
            </div>
            
            <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-black/20">
              {typeof data.comparison.firestore === 'string' ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <AlertTriangleIcon className="h-8 w-8 mb-2 opacity-50" />
                  <p>{data.comparison.firestore}</p>
                </div>
              ) : (
                <div className="space-y-4">
                   {data.comparison.firestore.isVerified ? (
                      <div className="bg-coc-green/10 border border-coc-green/20 p-3 rounded-lg text-coc-green text-xs font-bold text-center">
                        VERIFIED ACCOUNT
                      </div>
                   ) : (
                      <div className="bg-coc-red/10 border border-coc-red/20 p-3 rounded-lg text-coc-red text-xs font-bold text-center">
                        NOT VERIFIED
                      </div>
                   )}
                   <JsonViewer data={data.comparison.firestore} color="text-coc-gold" />
                </div>
              )}
            </div>
          </div>

          {/* KOLOM KANAN: Data Live API */}
          <div className="flex flex-col h-[600px] bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CogsIcon className="h-5 w-5 text-coc-blue" />
                <h3 className="font-bold text-white text-sm uppercase tracking-wider">Supercell API</h3>
              </div>
              
              <div className="flex gap-2">
                <span className="text-[10px] bg-black/40 text-gray-400 px-2 py-1 rounded font-mono border border-white/5">
                  Live Data
                </span>
                
                {data.userId && data.playerTag && !data.comparison.liveApi.error && (
                  <button 
                    onClick={handleForceSync}
                    disabled={syncLoading}
                    className="flex items-center gap-1 text-[10px] bg-coc-blue/10 hover:bg-coc-blue/20 text-coc-blue px-3 py-1 rounded border border-coc-blue/20 transition-all disabled:opacity-50"
                    title="Paksa update profil user dengan data game terbaru"
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
                  <p className="text-center px-4">API Error: {data.comparison.liveApi.error}</p>
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="bg-coc-blue/10 border border-coc-blue/20 p-3 rounded-lg text-coc-blue text-xs font-bold text-center">
                      LIVE GAME DATA
                   </div>
                   <JsonViewer data={data.comparison.liveApi.data} color="text-coc-blue" />
                </div>
              )}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

// Helper untuk menampilkan JSON
const JsonViewer = ({ data, color }: { data: any, color: string }) => (
  <pre className={`text-[10px] md:text-xs font-mono ${color} whitespace-pre-wrap break-all leading-relaxed bg-black/30 p-4 rounded-xl border border-white/5`}>
    {JSON.stringify(data, null, 2)}
  </pre>
);