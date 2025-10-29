'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import { SaveIcon, PaperPlaneIcon, EditIcon, XIcon, InfoIcon, CogsIcon } from '@/app/components/icons';
import { POST_CATEGORIES } from '@/lib/knowledge-hub-utils';
import { PostCategory } from '@/lib/types';
import { useAuth } from '@/app/context/AuthContext';
import { createPost, getUserProfile } from '@/lib/firestore'; // Impor fungsi Firestore
import { UserProfile } from '@/lib/types';
import Notification, { NotificationProps } from '@/app/components/ui/Notification';

// Opsi kategori yang tersedia (difilter agar tidak termasuk 'Semua Diskusi')
const CATEGORY_OPTIONS: PostCategory[] = POST_CATEGORIES.filter(c => c !== 'Semua Diskusi') as PostCategory[];

interface PostFormProps {
    // Digunakan untuk mode edit di masa depan
    initialData?: {
        title: string;
        content: string;
        category: PostCategory;
        tags: string[];
    };
    // Menerima className dari parent (page.tsx)
    className?: string;
}

// --- Inline Component: FormGroup (untuk tampilan error yang konsisten) ---
const FormGroup: React.FC<{ children: ReactNode, error?: string | null, label: string, htmlFor: string }> = ({ children, error, label, htmlFor }) => (
    <div className="space-y-2">
        <label htmlFor={htmlFor} className="block text-sm font-bold text-gray-200">
            {label}
        </label>
        {children}
        {error && <p id={`${htmlFor}-error`} className="text-xs text-red-400 mt-1 font-sans">{error}</p>}
    </div>
);
// --- End Inline Component ---


// Komponen form client-side
const PostForm = ({ initialData, className = '' }: PostFormProps) => {
    const router = useRouter();
    const { currentUser } = useAuth();

    const [formData, setFormData] = useState({
        title: initialData?.title || '',
        content: initialData?.content || '',
        category: initialData?.category || CATEGORY_OPTIONS[0],
        tags: initialData?.tags.join(', ') || '',
        // BARU: Tambahkan field khusus untuk Strategi Serangan
        troopLink: '', // URL Coc Link (coc://...)
        videoUrl: '', // URL Video YouTube
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [notification, setNotification] = useState<NotificationProps | null>(null);

    // --- State Validasi Sederhana ---
    const [isFormValid, setIsFormValid] = useState(false);
    // --- End State Validasi ---

    // Flag untuk menentukan kapan menampilkan field kustom
    const isStrategyPost = formData.category === 'Strategi Serangan';

    // --- Efek Validasi Real-time ---
    useEffect(() => {
        const isTitleValid = formData.title.trim().length > 0;
        const isContentValid = formData.content.trim().length > 0;
        
        // Aturan Tambahan: Jika postingan strategi, minimal satu link (troopLink atau videoUrl) harus diisi.
        let isStrategyLinkValid = true;
        if (isStrategyPost) {
            isStrategyLinkValid = formData.troopLink.trim().length > 0 || formData.videoUrl.trim().length > 0;
        }

        setIsFormValid(isTitleValid && isContentValid && isStrategyLinkValid);

        // Bersihkan error jika kriteria terpenuhi
        if (isTitleValid && isContentValid && isStrategyLinkValid) {
            setFormError(null);
        }
        
    }, [formData.title, formData.content, formData.category, formData.troopLink, formData.videoUrl, isStrategyPost]);
    // --- End Efek Validasi ---

    // Helper untuk menampilkan notifikasi
    const showNotification = (message: string, type: NotificationProps['type']) => {
        setNotification({ message, type, onClose: () => setNotification(null) });
    };

    // --- Style input yang disempurnakan (dari auth/page.tsx) ---
    const inputClasses = (hasError: boolean) => (
        `w-full bg-coc-stone/50 border rounded-md px-4 py-2.5 text-white placeholder-gray-500 transition-colors duration-200
         font-sans disabled:opacity-50 disabled:cursor-not-allowed
         hover:border-coc-gold/70
         focus:ring-2 focus:ring-coc-gold focus:border-coc-gold focus:outline-none
         ${hasError
             ? 'border-coc-red focus:border-coc-red focus:ring-coc-red/50' // Error state
             : 'border-coc-gold-dark/50' // Default state
         }`
    );
    // --- End Style input ---

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormError(null); // Reset error on input change

        // Khusus untuk category, reset field kustom jika kategori berubah dari 'Strategi Serangan'
        if (id === 'category') {
             // Jika kategori baru BUKAN strategi serangan, hapus data kustom
             if (value !== 'Strategi Serangan') {
                 setFormData(prev => ({
                     ...prev,
                     [id]: value as PostCategory,
                     troopLink: '',
                     videoUrl: '',
                 }));
                 return; // Keluar dari handler
             }
        }
        
        setFormData(prev => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Cek validitas form di sini juga
        if (!isFormValid) {
            let errorMsg = "Judul dan Konten wajib diisi.";
             if (isStrategyPost && !formData.troopLink.trim() && !formData.videoUrl.trim()) {
                 errorMsg = "Untuk kategori Strategi Serangan, minimal salah satu dari 'Troop Link' atau 'Video URL' wajib diisi.";
             }
            setFormError(errorMsg);
            return;
        }

        if (isSubmitting || !currentUser) {
            setFormError("Anda harus login untuk membuat postingan.");
            return;
        }

        setIsSubmitting(true);
        setFormError(null);

        try {
            const authorProfile = await getUserProfile(currentUser.uid);
            
            const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
            
            // Sertakan field kustom secara opsional
            const postData: Parameters<typeof createPost>[0] = {
                title: formData.title,
                content: formData.content,
                category: formData.category as PostCategory,
                tags: tagsArray,
                // Sertakan field baru hanya jika isStrategyPost
                troopLink: isStrategyPost ? (formData.troopLink.trim() || null) : null,
                videoUrl: isStrategyPost ? (formData.videoUrl.trim() || null) : null,
            };

            if (!authorProfile) {
                throw new Error("Gagal memuat profil penulis.");
            }

            const postId = await createPost(postData, authorProfile as UserProfile);

            showNotification("Postingan berhasil dipublikasikan! Mengalihkan...", 'success');

            setTimeout(() => {
                router.push(`/knowledge-hub/${postId}`);
            }, 1000);


        } catch (err) {
            console.error("Gagal memublikasikan postingan:", err);
            const errorMessage = (err as Error).message || "Gagal menyimpan postingan ke database.";

            if (errorMessage.includes("E-Sports CV Anda belum lengkap")) {
                setFormError(errorMessage + " Silakan klik Batal dan lengkapi CV Anda.");
                showNotification("Aksi diblokir: Profil belum lengkap.", 'warning');
            } else {
                setFormError("Terjadi kesalahan server saat memublikasikan.");
                showNotification(errorMessage, 'error');
            }

        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        // Wrapper <main> dipindahkan ke page.tsx
        // Form sekarang menerima className dari parent
        <>
            {/* Render Komponen Notifikasi (di luar form) */}
            <Notification notification={notification ?? undefined} />

            <form onSubmit={handleSubmit} className={`${className} max-w-4xl mx-auto`}>
                <h1 className="text-3xl md:text-4xl text-center mb-6 font-clash flex items-center justify-center">
                    <EditIcon className="inline h-7 w-7 mr-3 text-coc-gold" />
                    {initialData ? 'Edit Postingan' : 'Buat Postingan Baru'}
                </h1>

                {formError && <p className="bg-coc-red/20 text-red-400 text-center text-sm p-3 rounded-md mb-4 border border-coc-red font-sans">{formError}</p>}

                {/* Judul */}
                <FormGroup label="Judul Postingan (Wajib)" htmlFor="title" error={!formData.title.trim() && isFormValid === false ? "Judul wajib diisi" : null}>
                    <input
                        type="text"
                        id="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        placeholder="Contoh: Strategi War TH 16 Terbaik Musim Ini..."
                        required
                        className={inputClasses(!formData.title.trim() && isFormValid === false)}
                    />
                </FormGroup>

                {/* Konten */}
                <FormGroup label="Isi Konten (Wajib)" htmlFor="content" error={!formData.content.trim() && isFormValid === false ? "Konten wajib diisi" : null}>
                    <textarea
                        id="content"
                        value={formData.content}
                        onChange={handleInputChange}
                        placeholder="Tulis konten panduan, pertanyaan, atau tempel Base Link di sini..."
                        required
                        rows={10}
                        className={inputClasses(!formData.content.trim() && isFormValid === false) + ' resize-y min-h-[150px]'}
                    />
                </FormGroup>

                {/* Kategori dan Tag (dalam satu baris) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormGroup label="Pilih Kategori" htmlFor="category">
                        <select
                            id="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                            className={inputClasses(false) + ' appearance-none'}
                        >
                            {CATEGORY_OPTIONS.map(cat => (
                                <option key={cat} value={cat} className="bg-coc-stone text-white font-sans">{cat}</option>
                            ))}
                        </select>
                    </FormGroup>

                    <FormGroup label="Tambahkan Tag (Pisahkan dengan koma)" htmlFor="tags">
                        <input
                            type="text"
                            id="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            placeholder="Contoh: TH16, Hybrid, CWL"
                            className={inputClasses(false)}
                        />
                    </FormGroup>
                </div>

                {/* START: FIELD KHUSUS STRATEGI SERANGAN */}
                {isStrategyPost && (
                    <div className="space-y-6 pt-6 border-t border-coc-gold-dark/20">
                         <h3 className="text-xl font-clash text-coc-gold-dark flex items-center">
                            <InfoIcon className="h-5 w-5 mr-2"/> Detail Tambahan Strategi (Minimal satu wajib diisi)
                         </h3>

                         <FormGroup label="Troop Link (COC API Link)" htmlFor="troopLink" error={!isFormValid && isStrategyPost && !formData.troopLink.trim() && !formData.videoUrl.trim() ? "Wajib diisi jika tidak ada Video URL" : null}>
                            <input
                                type="url"
                                id="troopLink"
                                value={formData.troopLink}
                                onChange={handleInputChange}
                                placeholder="Contoh: coc://open-troop-link?troop=..."
                                className={inputClasses(false)}
                            />
                            <p className='text-xs text-gray-500 font-sans mt-1'>Link untuk menyalin kombinasi pasukan langsung ke game (dimulai dengan `coc://`).</p>
                        </FormGroup>

                        <FormGroup label="Video URL (YouTube)" htmlFor="videoUrl" error={!isFormValid && isStrategyPost && !formData.troopLink.trim() && !formData.videoUrl.trim() ? "Wajib diisi jika tidak ada Troop Link" : null}>
                            <input
                                type="url"
                                id="videoUrl"
                                value={formData.videoUrl}
                                onChange={handleInputChange}
                                placeholder="Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                                className={inputClasses(false)}
                            />
                            <p className='text-xs text-gray-500 font-sans mt-1'>Link ke video YouTube yang menampilkan cara menggunakan strategi ini.</p>
                        </FormGroup>

                    </div>
                )}
                {/* END: FIELD KHUSUS STRATEGI SERANGAN */}

                {/* Tombol Aksi */}
                <div className="flex justify-end gap-4 pt-4 border-t border-coc-gold-dark/20 mt-6">
                    <Button
                        type="button"
                        variant="secondary"
                        href="/knowledge-hub"
                    >
                        <XIcon className="inline h-5 w-5 mr-2" /> Batal
                    </Button>
                    <Button type="submit" variant="primary" disabled={isSubmitting || !isFormValid}>
                        <PaperPlaneIcon className="inline h-5 w-5 mr-2" />
                        {isSubmitting ? 'Memublikasikan...' : 'Publikasikan'}
                    </Button>
                </div>
            </form>
        </>
    );
};

export default PostForm;
