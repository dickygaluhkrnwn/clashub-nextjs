'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Post, PostCategory } from '@/lib/types';
import { POST_CATEGORIES } from '@/lib/knowledge-hub-utils';
import { NotificationProps } from '@/app/components/ui/Notification';
// --- ICON IMPORTS ---
// Mengimpor ikon secara langsung agar JSX di bawah dikenali.
import { SaveIcon, PaperPlaneIcon, RefreshCwIcon } from '@/app/components/icons'; 
// --------------------

// --- Interface Data Form ---
export interface PostFormData {
  title: string;
  content: string;
  category: PostCategory;
  tags: string; // Koma-separated string
  troopLink: string;
  videoUrl: string;
  baseImageUrl: string;
  baseLinkUrl: string;
}

// --- Interface Return Hook ---
interface UsePostFormReturn {
  formData: PostFormData;
  isSubmitting: boolean;
  formError: string | null;
  notification: NotificationProps | null;
  isFormValid: boolean;
  isEditMode: boolean;
  isStrategyPost: boolean;
  isBaseBuildingPost: boolean;
  submitText: string;
  submitIcon: React.ReactNode;
  handleInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  showNotification: (
    message: string,
    type: NotificationProps['type']
  ) => void;
  CATEGORY_OPTIONS: PostCategory[];
}

interface PostFormHookProps {
  initialData?: (Post & { id: string }) | null;
}

// Opsi kategori yang tersedia (difilter agar tidak termasuk 'Semua Diskusi')
const CATEGORY_OPTIONS: PostCategory[] = POST_CATEGORIES.filter(
  (c) => c !== 'Semua Diskusi'
) as PostCategory[];

/**
 * Custom Hook untuk mengelola semua state dan logika form Postingan.
 * @param initialData - Data postingan jika dalam mode edit.
 */
export const usePostForm = ({ initialData }: PostFormHookProps): UsePostFormReturn => {
  const router = useRouter();
  const { currentUser } = useAuth();

  const isEditMode = !!initialData;
  const initialTagsString = initialData?.tags?.join(', ') || '';

  const [formData, setFormData] = useState<PostFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    category: initialData?.category || CATEGORY_OPTIONS[0],
    tags: initialTagsString,
    troopLink: initialData?.troopLink || '',
    videoUrl: initialData?.videoUrl || '',
    baseImageUrl: initialData?.baseImageUrl || '',
    baseLinkUrl: initialData?.baseLinkUrl || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);

  // Flag untuk menentukan kapan menampilkan field kustom (dihitung ulang dengan useMemo)
  const isStrategyPost = useMemo(() => formData.category === 'Strategi Serangan', [formData.category]);
  const isBaseBuildingPost = useMemo(() => formData.category === 'Base Building', [formData.category]);

  // Helper untuk menampilkan notifikasi
  const showNotification = (
    message: string,
    type: NotificationProps['type']
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };


  // --- Efek Validasi Real-time ---
  useEffect(() => {
    const isTitleValid = formData.title.trim().length > 0;
    const isContentValid = formData.content.trim().length > 0;

    // Validasi kondisional untuk Strategi Serangan
    let isStrategyLinkValid = true;
    if (isStrategyPost) {
      isStrategyLinkValid =
        formData.troopLink.trim().length > 0 ||
        formData.videoUrl.trim().length > 0;
    }

    // Validasi kondisional untuk Base Building
    let isBaseBuildingLinkValid = true;
    if (isBaseBuildingPost) {
      isBaseBuildingLinkValid =
        formData.baseImageUrl.trim().length > 0 ||
        formData.baseLinkUrl.trim().length > 0;
    }

    const isValid = isTitleValid && isContentValid && isStrategyLinkValid && isBaseBuildingLinkValid;
    
    setIsFormValid(isValid);

    // Bersihkan error jika kriteria terpenuhi dan error yang ditampilkan adalah error validasi
    if (isValid && formError !== null && !formError.includes('login') && !formError.includes('Terjadi kesalahan')) {
      setFormError(null);
    }
  }, [
    formData.title,
    formData.content,
    formData.category,
    formData.troopLink,
    formData.videoUrl,
    formData.baseImageUrl,
    formData.baseLinkUrl,
    isStrategyPost,
    isBaseBuildingPost,
    formError,
  ]);
  // --- End Efek Validasi ---

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { id, value } = e.target;
    setFormError(null); // Reset error on input change

    // Reset field kustom saat kategori berubah
    if (id === 'category') {
      const newCategory = value as PostCategory;
      setFormData((prev) => ({
        ...prev,
        [id]: newCategory,
        // Reset field jika kategori BUKAN yang sesuai
        troopLink:
          newCategory === 'Strategi Serangan' ? prev.troopLink : '',
        videoUrl: newCategory === 'Strategi Serangan' ? prev.videoUrl : '',
        baseImageUrl:
          newCategory === 'Base Building' ? prev.baseImageUrl : '',
        baseLinkUrl:
          newCategory === 'Base Building' ? prev.baseLinkUrl : '',
      }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Cek validitas form di sini juga (client-side validation check)
    if (!isFormValid) {
      let errorMsg = 'Judul dan Konten wajib diisi.';
      if (
        isStrategyPost &&
        !formData.troopLink.trim() &&
        !formData.videoUrl.trim()
      ) {
        errorMsg =
          "Untuk kategori Strategi Serangan, minimal salah satu dari 'Troop Link' atau 'Video URL' wajib diisi.";
      } else if (
        isBaseBuildingPost &&
        !formData.baseImageUrl.trim() &&
        !formData.baseLinkUrl.trim()
      ) {
        errorMsg =
          "Untuk kategori Base Building, minimal salah satu dari 'Base Image URL' atau 'Base Link URL' wajib diisi.";
      }
      setFormError(errorMsg);
      return;
    }

    if (isSubmitting || !currentUser) {
      setFormError('Anda harus login untuk membuat postingan.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      // --- Logika "Jalan Tengah" untuk imageUrl ---
      let autoImageUrl: string | null = null;
      if (isStrategyPost && formData.videoUrl.trim()) {
        const videoIdRegex =
          /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)(\w+)/i;
        const match = formData.videoUrl.trim().match(videoIdRegex);
        if (match && match[1]) {
          // Ambil thumbnail kualitas tinggi dari YouTube
          autoImageUrl = `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`; 
        }
      } else if (isBaseBuildingPost && formData.baseImageUrl.trim()) {
        autoImageUrl = formData.baseImageUrl.trim();
      }
      // --- AKHIR LOGIKA AUTO IMAGE ---

      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // Data yang akan dikirim (Common structure for create and update)
      const postDataPayload: Partial<Post> = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: tagsArray,
        imageUrl: autoImageUrl,
        troopLink: isStrategyPost
          ? formData.troopLink.trim() || null
          : null,
        videoUrl: isStrategyPost
          ? formData.videoUrl.trim() || null
          : null,
        baseImageUrl: isBaseBuildingPost
          ? formData.baseImageUrl.trim() || null
          : null,
        baseLinkUrl: isBaseBuildingPost
          ? formData.baseLinkUrl.trim() || null
          : null,
      };

      let postId: string;
      let response;
      let result;

      if (isEditMode) {
        // --- MODE EDIT (Memanggil API PUT) ---
        postId = initialData!.id;
        showNotification('Memperbarui postingan...', 'info');

        response = await fetch(`/api/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postDataPayload),
        });
        result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'Gagal memperbarui postingan.');
        }

        showNotification(
          'Postingan berhasil diperbarui! Mengalihkan...',
          'success'
        );
      } else {
        // --- MODE CREATE (Memanggil API /api/posts) ---
        showNotification('Memublikasikan postingan...', 'info');

        response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postDataPayload),
        });
        result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Gagal memublikasikan postingan.');
        }

        // Ambil postId dari data yang dikembalikan API
        postId = result.id;

        showNotification(
          'Postingan berhasil dipublikasikan! Mengalihkan...',
          'success'
        );
      }

      // Redirect ke halaman detail setelah sukses
      setTimeout(() => {
        router.push(`/knowledge-hub/${postId}`);
      }, 1000);
    } catch (err) {
      console.error('Gagal memublikasikan/memperbarui postingan:', err);
      const errorMessage =
        (err as Error).message ||
        `Gagal ${
          isEditMode ? 'memperbarui' : 'memublikasikan'
        } postingan ke database.`;

      if (errorMessage.includes('E-Sports CV Anda belum lengkap')) {
        setFormError(
          errorMessage + ' Silakan klik Batal dan lengkapi CV Anda.'
        );
        showNotification('Aksi diblokir: Profil belum lengkap.', 'warning');
      } else {
        setFormError(`Terjadi kesalahan: ${errorMessage}`);
        showNotification(errorMessage, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Teks tombol submit dinamis
  const submitText = isEditMode
    ? isSubmitting
      ? 'Menyimpan...'
      : 'Simpan Perubahan'
    : isSubmitting
    ? 'Memublikasikan...'
    : 'Publikasikan';
    
  // Ikon tombol submit dinamis
  const submitIcon = useMemo(() => {
    if (isEditMode) {
      return isSubmitting ? (
        <RefreshCwIcon className="inline h-5 w-5 mr-2 animate-spin" />
      ) : (
        <SaveIcon className="inline h-5 w-5 mr-2" />
      );
    }
    return isSubmitting ? (
      <RefreshCwIcon className="inline h-5 w-5 mr-2 animate-spin" />
    ) : (
      <PaperPlaneIcon className="inline h-5 w-5 mr-2" />
    );
  }, [isEditMode, isSubmitting]);


  return {
    formData,
    isSubmitting,
    formError,
    notification,
    isFormValid,
    isEditMode,
    isStrategyPost,
    isBaseBuildingPost,
    submitText,
    submitIcon,
    handleInputChange,
    handleSubmit,
    showNotification,
    CATEGORY_OPTIONS,
  };
};

export default usePostForm;