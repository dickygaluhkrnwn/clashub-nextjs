'use client';

import React, { useState, useEffect } from 'react';
import { 
  BookOpenIcon, 
  SearchIcon, 
  TrashIcon, 
  StarIcon, 
  RefreshCwIcon,
  FilterIcon,
  AlertTriangleIcon,
  EyeIcon, // [BARU] Import EyeIcon
  XIcon    // [BARU] Import XIcon untuk tutup modal
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

// Tipe Data Postingan (Sesuai API)
interface Post {
  id: string;
  title: string;
  content: string; // Bisa HTML atau Text
  authorName: string;
  category: string;
  createdAt: string;
  isFeatured?: boolean;
}

// Kata kunci untuk "Filter Cerdas" (Pelanggaran Aturan)
const SUSPICIOUS_KEYWORDS = [
  'hack', 'cheat', 'mod', 'free gems', 'grat', 'jual', 'beli', 
  'bot', 'phising', 'link', 'wa.me', '08'
];

export default function ContentManagerPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSmartFilterActive, setIsSmartFilterActive] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // [BARU] State untuk Modal Preview
  const [viewingPost, setViewingPost] = useState<Post | null>(null);

  useEffect(() => {
    fetchPosts();
  }, []);

  // Logika Filter (Search + Smart Filter)
  useEffect(() => {
    let result = posts;

    // 1. Filter Pencarian Manual
    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(post => 
        post.title.toLowerCase().includes(lowerTerm) || 
        post.authorName.toLowerCase().includes(lowerTerm) ||
        post.content.toLowerCase().includes(lowerTerm)
      );
    }

    // 2. Filter Cerdas (Pelanggaran)
    if (isSmartFilterActive) {
      result = result.filter(post => {
        const textToCheck = `${post.title} ${post.content}`.toLowerCase();
        return SUSPICIOUS_KEYWORDS.some(keyword => textToCheck.includes(keyword));
      });
    }

    setFilteredPosts(result);
  }, [searchTerm, isSmartFilterActive, posts]);

  const fetchPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/content/posts');
      const data = await res.json();
      if (Array.isArray(data)) {
        setPosts(data);
        setFilteredPosts(data);
      }
    } catch (error) {
      console.error("Gagal load posts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus postingan ini secara permanen? Tindakan ini tidak bisa dibatalkan.")) return;

    setProcessingId(id);
    try {
      const res = await fetch(`/api/admin/content/posts?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Gagal menghapus');

      // Update state
      setPosts(prev => prev.filter(p => p.id !== id));
      // Tutup modal jika sedang dibuka
      if (viewingPost?.id === id) setViewingPost(null);
    } catch (error) {
      alert("Gagal menghapus postingan.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleToggleFeatured = async (post: Post) => {
    setProcessingId(post.id);
    const newStatus = !post.isFeatured;

    try {
      const res = await fetch('/api/admin/content/posts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, isFeatured: newStatus }),
      });

      if (!res.ok) throw new Error('Gagal update status');

      // Update state
      setPosts(prev => prev.map(p => 
        p.id === post.id ? { ...p, isFeatured: newStatus } : p
      ));
      
      // Update modal state jika sedang dilihat
      if (viewingPost?.id === post.id) {
          setViewingPost({ ...viewingPost, isFeatured: newStatus });
      }

    } catch (error) {
      alert("Gagal mengubah status featured.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-clash text-white mb-2 flex items-center gap-3">
          <BookOpenIcon className="h-8 w-8 text-purple-400" />
          Content Moderator
        </h1>
        <p className="text-gray-400">
          Pantau dan kelola postingan komunitas di Knowledge Hub.
        </p>
      </div>

      {/* Control Panel */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between shadow-lg">
        
        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <SearchIcon className="absolute left-4 top-3.5 h-5 w-5 text-gray-500" />
          <input 
            type="text" 
            placeholder="Cari judul, penulis, atau isi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsSmartFilterActive(!isSmartFilterActive)}
            className={`
              flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all border
              ${isSmartFilterActive 
                ? 'bg-coc-red/10 text-coc-red border-coc-red/30 shadow-[0_0_15px_rgba(255,0,0,0.1)]' 
                : 'bg-white/5 text-gray-400 border-white/10 hover:text-white hover:bg-white/10'
              }
            `}
          >
            {isSmartFilterActive ? <AlertTriangleIcon className="h-4 w-4" /> : <FilterIcon className="h-4 w-4" />}
            {isSmartFilterActive ? 'Filter Aktif: Pelanggaran' : 'Cari Pelanggaran'}
          </button>

          <button 
            onClick={fetchPosts}
            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors border border-white/10"
            title="Refresh Data"
          >
            <RefreshCwIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-black/20 text-xs uppercase text-gray-500 font-bold">
              <tr>
                <th className="px-6 py-4">Konten</th>
                <th className="px-6 py-4">Penulis</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-center">Tanggal</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 animate-pulse">
                    Memuat konten komunitas...
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    {isSmartFilterActive 
                      ? "Bagus! Tidak ditemukan konten mencurigakan." 
                      : "Tidak ada postingan ditemukan."}
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 max-w-md">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 mt-1">
                           <BookOpenIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-white text-base line-clamp-1 group-hover:text-purple-400 transition-colors">
                            {post.title}
                          </p>
                          <p className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{post.category}</p>
                          <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                            {/* Strip HTML tags sederhana untuk preview */}
                            {post.content.replace(/<[^>]+>/g, '').substring(0, 100)}...
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                         <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] text-white font-bold">
                           {post.authorName.charAt(0)}
                         </div>
                         <span className="text-gray-300">{post.authorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {post.isFeatured ? (
                        <span className="inline-flex items-center gap-1 bg-coc-gold/10 text-coc-gold px-2 py-1 rounded text-[10px] font-bold border border-coc-gold/20 uppercase">
                          <StarIcon className="h-3 w-3 fill-coc-gold" /> Featured
                        </span>
                      ) : (
                        <span className="text-gray-600 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center text-xs text-gray-500 font-mono whitespace-nowrap">
                      {new Date(post.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {/* [BARU] Tombol Lihat Detail */}
                        <button 
                          onClick={() => setViewingPost(post)}
                          className="p-2 rounded-lg border border-coc-blue/30 text-coc-blue hover:bg-coc-blue/10 transition-colors"
                          title="Lihat Detail Postingan"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>

                        {/* Tombol Feature/Pin */}
                        <button 
                          onClick={() => handleToggleFeatured(post)}
                          disabled={processingId === post.id}
                          className={`p-2 rounded-lg border transition-all ${
                            post.isFeatured 
                              ? 'text-coc-gold border-coc-gold/30 hover:bg-coc-gold/10' 
                              : 'text-gray-500 border-white/10 hover:text-white hover:bg-white/10'
                          }`}
                          title={post.isFeatured ? "Unfeature Post" : "Feature Post (Highlight)"}
                        >
                          <StarIcon className={`h-4 w-4 ${post.isFeatured ? 'fill-coc-gold' : ''}`} />
                        </button>

                        {/* Tombol Hapus */}
                        <button 
                          onClick={() => handleDelete(post.id)}
                          disabled={processingId === post.id}
                          className="p-2 text-gray-500 border border-white/10 hover:border-red-500/30 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Hapus Konten (Banned)"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- [BARU] MODAL PREVIEW POSTINGAN --- */}
      {viewingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start bg-white/5 rounded-t-2xl">
              <div>
                <h3 className="text-xl md:text-2xl font-clash text-white mb-1">
                  {viewingPost.title}
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                  <span className="bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border border-purple-500/20">
                    {viewingPost.category}
                  </span>
                  <span>Oleh <span className="text-white font-bold">{viewingPost.authorName}</span></span>
                  <span>• {new Date(viewingPost.createdAt).toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</span>
                </div>
              </div>
              <button 
                onClick={() => setViewingPost(null)}
                className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-colors"
              >
                <XIcon className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content (Scrollable) */}
            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
               <div className="prose prose-invert max-w-none text-gray-300 whitespace-pre-wrap leading-relaxed">
                 {/* Jika konten berupa plain text, whitespace-pre-wrap akan menjaga format baris baru */}
                 {viewingPost.content}
               </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-white/5 rounded-b-2xl">
              <Button variant="secondary" onClick={() => setViewingPost(null)}>
                Tutup
              </Button>
              <Button 
                variant="danger" 
                onClick={() => handleDelete(viewingPost.id)}
                disabled={!!processingId}
              >
                <TrashIcon className="h-4 w-4 mr-2" /> Hapus Postingan
              </Button>
              <Button 
                variant="outline"
                className={`border-coc-gold/50 ${viewingPost.isFeatured ? 'bg-coc-gold/10 text-coc-gold' : 'text-gray-400'}`}
                onClick={() => handleToggleFeatured(viewingPost)}
                disabled={!!processingId}
              >
                <StarIcon className={`h-4 w-4 mr-2 ${viewingPost.isFeatured ? 'fill-coc-gold' : ''}`} /> 
                {viewingPost.isFeatured ? 'Unfeature' : 'Feature Post'}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}