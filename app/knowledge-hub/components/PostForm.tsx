'use client';

import React, { useState, useEffect, ReactNode, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import {
  SaveIcon,
  PaperPlaneIcon,
  EditIcon,
  XIcon,
  InfoIcon,
  CogsIcon,
  RefreshCwIcon,
} from '@/app/components/icons';
import { POST_CATEGORIES } from '@/lib/knowledge-hub-utils';
import { PostCategory, Post } from '@/lib/types';
import { useAuth } from '@/app/context/AuthContext';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import { useLanguage } from '@/lib/hooks/useLanguage';

// Opsi kategori yang tersedia (difilter agar tidak termasuk 'Semua Diskusi')
const CATEGORY_OPTIONS: PostCategory[] = POST_CATEGORIES.filter(
  (c) => c !== 'Semua Diskusi'
) as PostCategory[];

interface PostFormProps {
  // Digunakan untuk mode edit di masa depan
  initialData?: (Post & { id: string }) | null;
  // Menerima className dari parent (page.tsx)
  className?: string;
}

// --- Inline Component: FormGroup (untuk tampilan error yang konsisten) ---
const FormGroup: React.FC<{
  children: ReactNode;
  error?: string | null;
  label: string;
  htmlFor: string;
  helperText?: ReactNode;
}> = ({ children, error, label, htmlFor, helperText }) => (
  <div className="space-y-2">
    <label
      htmlFor={htmlFor}
      className="block text-sm font-bold text-gray-200"
    >
      {label}
    </label>
    {children}
    {helperText}
    {error && (
      <p id={`${htmlFor}-error`} className="text-xs text-red-400 mt-1 font-sans">
        {error}
      </p>
    )}
  </div>
);
// --- End Inline Component ---

// Komponen form client-side
const PostForm = ({ initialData, className = '' }: PostFormProps) => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();

  // Tentukan mode: EDIT atau CREATE
  const isEditMode = !!initialData;
  const initialTagsString = initialData?.tags?.join(', ') || '';

  const [formData, setFormData] = useState({
    title: initialData?.title || '',
    content: initialData?.content || '',
    category: initialData?.category || CATEGORY_OPTIONS[0],
    tags: initialTagsString,
    // Field khusus untuk Strategi Serangan
    troopLink: initialData?.troopLink || '',
    videoUrl: initialData?.videoUrl || '',
    // Field khusus untuk Base Building
    baseImageUrl: initialData?.baseImageUrl || '',
    baseLinkUrl: initialData?.baseLinkUrl || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationProps | null>(
    null
  );

  // Flag untuk menentukan kapan menampilkan field kustom
  const isStrategyPost = formData.category === 'Strategi Serangan';
  const isBaseBuildingPost = formData.category === 'Base Building';

  // --- State Validasi Sederhana ---
  const [isFormValid, setIsFormValid] = useState(false);
  // --- End State Validasi ---

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

    // Form valid jika field dasar valid DAN field kondisional (jika relevan) juga valid
    setIsFormValid(
      isTitleValid &&
        isContentValid &&
        isStrategyLinkValid &&
        isBaseBuildingLinkValid
    );

    // Bersihkan error jika kriteria terpenuhi
    if (
      isTitleValid &&
      isContentValid &&
      isStrategyLinkValid &&
      isBaseBuildingLinkValid
    ) {
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
  ]);
  // --- End Efek Validasi ---

  // Helper untuk menampilkan notifikasi
  const showNotification = (
    message: string,
    type: NotificationProps['type']
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  // --- Style input yang disempurnakan (dari auth/page.tsx) ---
  const inputClasses = (hasError: boolean) =>
    `w-full bg-coc-stone/50 border rounded-md px-4 py-2.5 text-white placeholder-gray-500 transition-colors duration-200
       font-sans disabled:opacity-50 disabled:cursor-not-allowed
       hover:border-coc-gold/70
       focus:ring-2 focus:ring-coc-gold focus:border-coc-gold focus:outline-none
       ${
         hasError
           ? 'border-coc-red focus:border-coc-red focus:ring-coc-red/50' // Error state
           : 'border-coc-gold-dark/50' // Default state
       }`;
  // --- End Style input ---

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
      return; // Keluar dari handler setelah update state kategori
    }

    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Cek validitas form di sini juga
    if (!isFormValid) {
      let errorMsg = t.knowledgeHub.form.validation.titleRequired;
      if (
        isStrategyPost &&
        !formData.troopLink.trim() &&
        !formData.videoUrl.trim()
      ) {
        errorMsg = language === 'id' 
          ? "Untuk kategori Strategi Serangan, minimal salah satu dari 'Troop Link' atau 'Video URL' wajib diisi."
          : "For Attack Strategy, at least one of 'Troop Link' or 'Video URL' is required.";
      } else if (
        isBaseBuildingPost &&
        !formData.baseImageUrl.trim() &&
        !formData.baseLinkUrl.trim()
      ) {
        errorMsg = language === 'id'
          ? "Untuk kategori Base Building, minimal salah satu dari 'Base Image URL' atau 'Base Link URL' wajib diisi."
          : "For Base Building, at least one of 'Base Image URL' or 'Base Link URL' is required.";
      }
      setFormError(errorMsg);
      return;
    }

    if (isSubmitting || !currentUser) {
      setFormError(
        language === 'id' 
          ? 'Anda harus login untuk membuat postingan.' 
          : 'You must be logged in to create a post.'
      );
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
        category: formData.category as PostCategory,
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
        showNotification(t.knowledgeHub.create.submitting, 'info');

        // Panggil API PUT
        response = await fetch(`/api/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postDataPayload),
        });
        result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || t.knowledgeHub.form.messages.createError);
        }

        showNotification(
          language === 'id' ? 'Postingan berhasil diperbarui!' : 'Post updated successfully!',
          'success'
        );
      } else {
        // --- MODE CREATE (Memanggil API /api/posts) ---
        showNotification(t.knowledgeHub.create.submitting, 'info');

        response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postDataPayload),
        });
        result = await response.json();

        if (!response.ok) {
          // Ambil error dari API
          throw new Error(result.error || t.knowledgeHub.form.messages.createError);
        }

        // Ambil postId dari data yang dikembalikan API
        postId = result.id;

        showNotification(
          t.knowledgeHub.form.messages.createSuccess,
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
        t.knowledgeHub.form.messages.createError;

      if (errorMessage.includes('E-Sports CV')) {
        // Pesan spesifik backend ini kita biarkan dinamis dari server, atau handle khusus
        setFormError(errorMessage);
        showNotification(
          language === 'id' ? 'Aksi diblokir: Profil belum lengkap.' : 'Action blocked: Profile incomplete.', 
          'warning'
        );
      } else {
        setFormError(errorMessage);
        showNotification(errorMessage, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper untuk mendapatkan label kategori yang diterjemahkan
  const getCategoryLabel = (cat: PostCategory) => {
    if (cat === 'Strategi Serangan') return t.knowledgeHub.form.options.types.attackStrategy;
    if (cat === 'Base Building') return t.knowledgeHub.form.options.types.baseBuilding;
    // Fallback untuk kategori lain yang mungkin belum ada di kamus
    return cat;
  };

  // Teks tombol submit dinamis
  const submitText = isEditMode
    ? isSubmitting
      ? t.knowledgeHub.create.submitting
      : (language === 'id' ? 'Simpan Perubahan' : 'Save Changes')
    : isSubmitting
    ? t.knowledgeHub.create.submitting
    : t.knowledgeHub.create.submitButton;

  // Ikon tombol submit dinamis
  const submitIcon = isSubmitting ? (
    <RefreshCwIcon className="inline h-5 w-5 mr-2 animate-spin" />
  ) : isEditMode ? (
    <SaveIcon className="inline h-5 w-5 mr-2" />
  ) : (
    <PaperPlaneIcon className="inline h-5 w-5 mr-2" />
  );

  return (
    <>
      {/* Render Komponen Notifikasi (di luar form) */}
      <Notification notification={notification ?? undefined} />

      <form
        onSubmit={handleSubmit}
        className={`${className} max-w-4xl mx-auto`}
      >
        <h1 className="text-3xl md:text-4xl text-center mb-6 font-clash flex items-center justify-center text-white">
          <EditIcon className="inline h-7 w-7 mr-3 text-coc-gold" />
          {isEditMode ? t.knowledgeHub.create.editTitle : t.knowledgeHub.create.title}
        </h1>

        {formError && (
          <p className="bg-coc-red/20 text-red-400 text-center text-sm p-3 rounded-md mb-4 border border-coc-red font-sans">
            {formError}
          </p>
        )}

        {/* Judul */}
        <FormGroup
          label={t.knowledgeHub.form.labels.title + " *"}
          htmlFor="title"
          error={
            !formData.title.trim() && isFormValid === false
              ? t.knowledgeHub.form.validation.titleRequired
              : null
          }
        >
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder={t.knowledgeHub.form.placeholders.title}
            required
            className={inputClasses(
              !formData.title.trim() && isFormValid === false
            )}
          />
        </FormGroup>

        {/* Konten */}
        <FormGroup
          label={t.knowledgeHub.form.labels.description + " *"}
          htmlFor="content"
          error={
            !formData.content.trim() && isFormValid === false
              ? t.knowledgeHub.form.validation.descriptionRequired
              : null
          }
        >
          <textarea
            id="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder={t.knowledgeHub.form.placeholders.description}
            required
            rows={10}
            className={
              inputClasses(!formData.content.trim() && isFormValid === false) +
              ' resize-y min-h-[150px]'
            }
          />
        </FormGroup>

        {/* Kategori dan Tag (dalam satu baris) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup label={t.knowledgeHub.form.labels.type} htmlFor="category">
            <select
              id="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className={inputClasses(false) + ' appearance-none'}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option
                  key={cat}
                  value={cat}
                  className="bg-coc-stone text-white font-sans"
                >
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup
            label={t.knowledgeHub.form.labels.tags}
            htmlFor="tags"
          >
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder={t.knowledgeHub.form.placeholders.tags}
              className={inputClasses(false)}
            />
          </FormGroup>
        </div>

        {/* START: FIELD KHUSUS STRATEGI SERANGAN */}
        {isStrategyPost && (
          <div className="space-y-6 pt-6 border-t border-coc-gold-dark/20 mt-6">
            <h3 className="text-xl font-clash text-coc-gold-dark flex items-center">
              <InfoIcon className="h-5 w-5 mr-2" /> 
              {language === 'id' ? 'Detail Tambahan' : 'Strategy Details'}
            </h3>
            <FormGroup
              label="Troop Link (COC API Link)"
              htmlFor="troopLink"
              helperText={
                <p className="text-xs text-gray-500 font-sans mt-1">
                  {language === 'id' 
                    ? 'Link untuk menyalin kombinasi pasukan langsung ke game (dimulai dengan `coc://`).'
                    : 'Link to copy army composition directly to game (starts with `coc://`).'}
                </p>
              }
              error={
                !isFormValid &&
                isStrategyPost &&
                !formData.troopLink.trim() &&
                !formData.videoUrl.trim()
                  ? (language === 'id' ? 'Wajib diisi jika tidak ada Video URL' : 'Required if no Video URL')
                  : null
              }
            >
              <input
                type="url"
                id="troopLink"
                value={formData.troopLink}
                onChange={handleInputChange}
                placeholder="Contoh: coc://open-troop-link?troop=..."
                className={inputClasses(false)}
              />
            </FormGroup>
            <FormGroup
              label={t.knowledgeHub.form.labels.youtubeUrl}
              htmlFor="videoUrl"
              helperText={
                <p className="text-xs text-gray-500 font-sans mt-1">
                  {language === 'id' 
                    ? 'Link ke video YouTube yang menampilkan cara menggunakan strategi ini.'
                    : 'Link to a YouTube video showing this strategy in action.'}
                </p>
              }
              error={
                !isFormValid &&
                isStrategyPost &&
                !formData.troopLink.trim() &&
                !formData.videoUrl.trim()
                  ? (language === 'id' ? 'Wajib diisi jika tidak ada Troop Link' : 'Required if no Troop Link')
                  : null
              }
            >
              <input
                type="url"
                id="videoUrl"
                value={formData.videoUrl}
                onChange={handleInputChange}
                placeholder={t.knowledgeHub.form.placeholders.youtubeUrl}
                className={inputClasses(false)}
              />
            </FormGroup>
          </div>
        )}
        {/* END: FIELD KHUSUS STRATEGI SERANGAN */}

        {/* --- FIELD KHUSUS BASE BUILDING --- */}
        {isBaseBuildingPost && (
          <div className="space-y-6 pt-6 border-t border-coc-gold-dark/20 mt-6">
            <h3 className="text-xl font-clash text-coc-gold-dark flex items-center">
              <CogsIcon className="h-5 w-5 mr-2" /> 
              {language === 'id' ? 'Detail Base' : 'Base Details'}
            </h3>
            <FormGroup
              label={language === 'id' ? "URL Gambar Base (Imgur)" : "Base Image URL (Imgur)"}
              htmlFor="baseImageUrl"
              helperText={
                <p className="text-xs text-gray-500 font-sans mt-1">
                  {language === 'id' 
                    ? 'URL gambar base dari Imgur (format: .png, .jpg).'
                    : 'Direct image URL from Imgur (format: .png, .jpg).'}
                </p>
              }
              error={
                !isFormValid &&
                isBaseBuildingPost &&
                !formData.baseImageUrl.trim() &&
                !formData.baseLinkUrl.trim()
                  ? (language === 'id' ? 'Wajib diisi jika tidak ada Base Link URL' : 'Required if no Base Link URL')
                  : null
              }
            >
              <input
                type="url"
                id="baseImageUrl"
                value={formData.baseImageUrl}
                onChange={handleInputChange}
                placeholder="https://i.imgur.com/..."
                className={inputClasses(false)}
              />
            </FormGroup>
            <FormGroup
              label={language === 'id' ? "Link Salin Base" : "Base Copy Link"}
              htmlFor="baseLinkUrl"
              helperText={
                <p className="text-xs text-gray-500 font-sans mt-1">
                  {language === 'id' 
                    ? 'Link base dari Clash of Clans (dimulai dengan `https://link.clashofclans.com/`).'
                    : 'Clash of Clans base link (starts with `https://link.clashofclans.com/`).'}
                </p>
              }
              error={
                !isFormValid &&
                isBaseBuildingPost &&
                !formData.baseImageUrl.trim() &&
                !formData.baseLinkUrl.trim()
                  ? (language === 'id' ? 'Wajib diisi jika tidak ada Base Image URL' : 'Required if no Base Image URL')
                  : null
              }
            >
              <input
                type="url"
                id="baseLinkUrl"
                value={formData.baseLinkUrl}
                onChange={handleInputChange}
                placeholder="https://link.clashofclans.com/en?action=OpenLayout..."
                className={inputClasses(false)}
              />
            </FormGroup>
          </div>
        )}
        {/* --- AKHIR FIELD BASE BUILDING --- */}

        {/* Tombol Aksi */}
        <div className="flex justify-end gap-4 pt-4 border-t border-coc-gold-dark/20 mt-6">
          <Button
            type="button"
            variant="secondary"
            href={
              isEditMode ? `/knowledge-hub/${initialData!.id}` : '/knowledge-hub'
            }
          >
            <XIcon className="inline h-5 w-5 mr-2" /> 
            {t.knowledgeHub.create.cancelButton}
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting || !isFormValid}
          >
            {submitIcon}
            {submitText}
          </Button>
        </div>
      </form>
    </>
  );
};

export default PostForm;