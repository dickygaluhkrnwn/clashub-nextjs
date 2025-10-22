'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { SaveIcon, PaperPlaneIcon, EditIcon, XIcon } from '@/app/components/icons'; // FIX: Tambahkan XIcon
import { POST_CATEGORIES } from '@/lib/knowledge-hub-utils';
import { PostCategory } from '@/lib/types';
import { useAuth } from '@/app/context/AuthContext';
import { createPost, getUserProfile } from '@/lib/firestore'; // Impor fungsi Firestore
import { UserProfile } from '@/lib/types';

// Opsi kategori yang tersedia (difilter agar tidak termasuk 'Semua Diskusi')
const CATEGORY_OPTIONS: PostCategory[] = POST_CATEGORIES.filter(c => c !== 'Semua Diskusi') as PostCategory[];

interface PostFormProps {
    // Digunakan untuk mode edit di masa depan, saat ini hanya untuk mode create.
    initialData?: {
        title: string;
        content: string;
        category: PostCategory;
        tags: string[];
    };
}

// Komponen form client-side
const PostForm = ({ initialData }: PostFormProps) => {
    const router = useRouter();
    const { currentUser } = useAuth(); // Menggunakan AuthContext untuk mendapatkan user
    
    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        content: initialData?.content || '',
        category: initialData?.category || CATEGORY_OPTIONS[0],
        tags: initialData?.tags.join(', ') || '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        
        setFormData(prev => ({
            ...prev,
            [id]: id === 'thLevel' ? parseInt(value, 10) || 0 : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isSubmitting || !currentUser) {
            setError("Anda harus login untuk membuat postingan.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            // 1. Dapatkan profil lengkap pengguna (untuk data author)
            const authorProfile = await getUserProfile(currentUser.uid);
            
            if (!authorProfile) {
                 throw new Error("Profil E-Sports CV tidak ditemukan. Lengkapi profil Anda terlebih dahulu.");
            }

            // 2. Siapkan data postingan
            const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            
            const postData = {
                title: formData.title,
                content: formData.content,
                category: formData.category as PostCategory,
                tags: tagsArray,
            };

            // 3. Panggil fungsi createPost di Firestore
            const postId = await createPost(postData, authorProfile as UserProfile);

            alert("Postingan berhasil dipublikasikan!");
            
            // 4. Redirect ke halaman detail postingan yang baru
            router.push(`/knowledge-hub/${postId}`);

        } catch (err) {
            console.error("Gagal memublikasikan postingan:", err);
            setError((err as Error).message || "Gagal menyimpan postingan ke database.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="card-stone p-8 space-y-6 max-w-4xl mx-auto">
            <h1 className="text-3xl text-center mb-6 flex items-center justify-center">
                <EditIcon className="inline h-7 w-7 mr-3 text-coc-gold"/> 
                {initialData ? 'Edit Postingan' : 'Buat Postingan Baru'}
            </h1>
            
            {error && <p className="bg-coc-red/20 text-red-400 text-center text-sm p-3 rounded-md">{error}</p>}
            
            {/* Judul */}
            <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-bold text-gray-300">Judul Postingan</label>
                <input 
                    type="text" 
                    id="title" 
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Contoh: Strategi War TH 16 Terbaik Musim Ini..." 
                    required 
                    className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold"
                />
            </div>

            {/* Konten */}
            <div className="space-y-2">
                <label htmlFor="content" className="block text-sm font-bold text-gray-300">Isi Konten (Strategi, Teks, Base Link)</label>
                <textarea 
                    id="content" 
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Tulis konten panduan atau pertanyaan Anda di sini... (Anda dapat menggunakan Markdown sederhana)" 
                    required 
                    rows={10} 
                    className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold resize-y"
                />
            </div>
            
            {/* Kategori dan Tag (dalam satu baris) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label htmlFor="category" className="block text-sm font-bold text-gray-300">Pilih Kategori</label>
                    <select 
                        id="category" 
                        value={formData.category}
                        onChange={handleInputChange}
                        required
                        className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-3 py-2 text-white focus:ring-coc-gold focus:border-coc-gold"
                    >
                        {CATEGORY_OPTIONS.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="tags" className="block text-sm font-bold text-gray-300">Tambahkan Tag (Pisahkan dengan koma)</label>
                    <input 
                        type="text" 
                        id="tags" 
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="Contoh: TH16, Hybrid, CWL" 
                        className="w-full bg-coc-stone/50 border border-coc-gold-dark/50 rounded-md px-4 py-2 text-white placeholder-gray-500 focus:ring-coc-gold focus:border-coc-gold"
                    />
                </div>
            </div>

            {/* Tombol Aksi */}
            <div className="flex justify-end gap-4 pt-4 border-t border-coc-gold-dark/20">
                <Button type="button" variant="secondary" onClick={() => router.push('/knowledge-hub')} disabled={isSubmitting}>
                    <XIcon className="inline h-5 w-5 mr-2"/> Batal
                </Button>
                <Button type="submit" variant="primary" disabled={isSubmitting}>
                    <PaperPlaneIcon className="inline h-5 w-5 mr-2"/> 
                    {isSubmitting ? 'Memublikasikan...' : 'Publikasikan'}
                </Button>
            </div>
        </form>
    );
};

export default PostForm;
