'use client';

import React, { useState, useEffect } from 'react';
import { 
  RefreshCwIcon, 
  GlobeIcon, 
  CheckCircleIcon, 
  AlertTriangleIcon,
  PlayIcon,
  TrashIcon
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import { useAuth } from '@/app/context/AuthContext';
import { collection, query, orderBy, limit, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { firestore as db } from '@/lib/firebase'; // [FIX] Import 'firestore' dan alias menjadi 'db'
import { Video } from '@/lib/types'; // Pastikan path import benar

export default function YouTubeManagerPage() {
  const { userProfile } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<any>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);

  // Fetch Videos saat halaman dibuka
  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setIsLoadingVideos(true);
    try {
      const q = query(collection(db, 'videos'), orderBy('publishedAt', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const videoList: Video[] = [];
      querySnapshot.forEach((doc) => {
        // Kita gabungkan ID dokumen dengan data
        videoList.push({ id: doc.id, ...doc.data() } as Video);
      });
      setVideos(videoList);
    } catch (error) {
      console.error("Gagal mengambil daftar video:", error);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncLogs(null); // Reset logs

    try {
      // Panggil API Route Internal yang sudah kita buat tadi
      const response = await fetch('/api/admin/youtube/trigger', {
        method: 'POST',
      });

      const data = await response.json();
      setSyncLogs(data);

      if (response.ok) {
        // Jika sukses, refresh daftar video
        fetchVideos();
      }
    } catch (error) {
      console.error("Sync Error:", error);
      setSyncLogs({ error: 'Failed to connect to server', details: (error as Error).message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if(!confirm("Yakin ingin menghapus video ini dari database?")) return;

    try {
      await deleteDoc(doc(db, 'videos', videoId));
      setVideos(videos.filter(v => v.id !== videoId || v.videoId !== videoId));
      alert("Video dihapus.");
    } catch (error) {
      alert("Gagal menghapus: " + (error as Error).message);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-clash text-white mb-2 flex items-center gap-3">
            <GlobeIcon className="h-8 w-8 text-coc-red" />
            YouTube Manager
          </h1>
          <p className="text-gray-400">
            Kontrol sinkronisasi konten Supercell dan kelola video yang tampil di Knowledge Hub.
          </p>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sync Controls */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-clash text-white mb-4">Manual Sync Trigger</h3>
          <p className="text-sm text-gray-400 mb-6">
            Tekan tombol di bawah untuk memaksa sistem menarik data terbaru dari YouTube API sekarang juga. Berguna untuk debugging jika video tidak muncul otomatis.
          </p>
          
          <Button 
            onClick={handleManualSync}
            disabled={isSyncing}
            variant={isSyncing ? "secondary" : "danger"} // Merah ala YouTube
            className="w-full justify-center"
          >
            <RefreshCwIcon className={`h-5 w-5 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sedang Menarik Data...' : 'Sync YouTube Sekarang'}
          </Button>

          {/* Sync Status Indicator */}
          {syncLogs && (
            <div className={`mt-6 p-4 rounded-xl border ${syncLogs.error ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                {syncLogs.error ? (
                  <AlertTriangleIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                )}
                <span className={`font-bold ${syncLogs.error ? 'text-red-400' : 'text-green-400'}`}>
                  {syncLogs.error ? 'Sync Gagal' : 'Sync Selesai'}
                </span>
              </div>
              
              {/* JSON Viewer Sederhana */}
              <div className="bg-black/50 p-3 rounded-lg overflow-x-auto max-h-40 custom-scrollbar">
                <pre className="text-[10px] text-gray-300 font-mono whitespace-pre-wrap">
                  {JSON.stringify(syncLogs, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats (Placeholder) */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 flex flex-col justify-center">
           <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-white/5 rounded-xl">
                 <h4 className="text-2xl font-clash text-white">{videos.length}</h4>
                 <p className="text-xs text-gray-500 uppercase tracking-wider">Total Video</p>
              </div>
              <div className="p-4 bg-white/5 rounded-xl">
                 <h4 className="text-2xl font-clash text-coc-green">Auto</h4>
                 <p className="text-xs text-gray-500 uppercase tracking-wider">Mode Sync</p>
              </div>
           </div>
           <div className="mt-6 p-4 bg-coc-blue/10 border border-coc-blue/20 rounded-xl text-xs text-gray-300">
              <p className="font-bold text-coc-blue mb-1">Tips Debugging:</p>
              <ul className="list-disc list-inside space-y-1">
                 <li>Jika log menampilkan "Quota Exceeded", berarti kuota harian YouTube habis.</li>
                 <li>Pastikan ID Playlist di konfigurasi API sudah benar (Uploads Playlist).</li>
                 <li>Video baru mungkin butuh waktu 5-10 menit untuk muncul di API YouTube setelah upload.</li>
              </ul>
           </div>
        </div>

      </div>

      {/* Video List Table */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/10 flex justify-between items-center">
          <h3 className="text-lg font-clash text-white">Video Terakhir Diambil</h3>
          <button onClick={fetchVideos} className="text-sm text-coc-gold hover:underline">
            Refresh List
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/20 text-xs uppercase text-gray-500 font-bold">
              <tr>
                <th className="px-6 py-4">Thumbnail</th>
                <th className="px-6 py-4">Judul Video</th>
                <th className="px-6 py-4">Channel</th>
                <th className="px-6 py-4">Tanggal Publish</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-gray-300">
              {isLoadingVideos ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 animate-pulse">
                    Memuat data video...
                  </td>
                </tr>
              ) : videos.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Belum ada video di database. Silakan tekan tombol Sync.
                  </td>
                </tr>
              ) : (
                videos.map((video) => (
                  <tr key={video.id || video.videoId} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="h-10 w-16 bg-black rounded overflow-hidden relative">
                        {video.thumbnailUrl ? (
                          <img src={video.thumbnailUrl} alt="Thumb" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center bg-white/10">
                            <PlayIcon className="h-4 w-4 text-gray-500" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white line-clamp-1 max-w-xs" title={video.title}>
                        {video.title}
                      </p>
                      <p className="text-xs text-gray-500 font-mono mt-0.5">{video.videoId}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-white/5 px-2 py-1 rounded text-xs">
                        {video.channelTitle}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {video.publishedAt 
                        ? new Date(typeof video.publishedAt === 'string' ? video.publishedAt : (video.publishedAt as any).seconds * 1000).toLocaleDateString('id-ID') 
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => handleDeleteVideo(video.id || video.videoId)}
                        className="p-2 hover:bg-coc-red/20 text-gray-500 hover:text-coc-red rounded-lg transition-colors"
                        title="Hapus Video"
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
  );
}