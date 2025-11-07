'use client';

import React from 'react';
import { EditIcon } from '@/app/components/icons';
import Notification from '@/app/components/ui/Notification';
import { Post } from '@/lib/types';
// Import semua komponen modular yang sudah dibuat
import usePostForm from './usePostForm';
import { FormGroup, getInputClasses } from './PostFormGroup';
import StrategyFields from './StrategyFields';
import BaseBuildingFields from './BaseBuildingFields';
import FormActions from './FormActions';

// Interface PostFormProps asli
interface PostFormProps {
  initialData?: (Post & { id: string }) | null;
  className?: string;
}

/**
 * Komponen Utama untuk PostForm (Client-side UI).
 * Menggunakan usePostForm untuk semua logika dan state.
 */
const PostFormClient: React.FC<PostFormProps> = ({ initialData, className = '' }) => {
  // --- Hubungkan ke Custom Hook ---
  const {
    formData,
    isEditMode,
    isSubmitting,
    formError,
    notification,
    isFormValid,
    isStrategyPost,
    isBaseBuildingPost,
    submitIcon,
    submitText,
    handleInputChange,
    handleSubmit,
    CATEGORY_OPTIONS,
  } = usePostForm({ initialData });
  // ---------------------------------

  return (
    <>
      {/* Render Komponen Notifikasi (di luar form) */}
      <Notification notification={notification ?? undefined} />

      <form
        onSubmit={handleSubmit}
        className={`${className} max-w-4xl mx-auto`}
      >
        <h1 className="text-3xl md:text-4xl text-center mb-6 font-clash flex items-center justify-center">
          <EditIcon className="inline h-7 w-7 mr-3 text-coc-gold" />
          {isEditMode ? 'Edit Postingan' : 'Buat Postingan Baru'}
        </h1>

        {formError && (
          <p className="bg-coc-red/20 text-red-400 text-center text-sm p-3 rounded-md mb-4 border border-coc-red font-sans">
            {formError}
          </p>
        )}

        {/* Judul */}
        <FormGroup
          label="Judul Postingan (Wajib)"
          htmlFor="title"
          error={
            !formData.title.trim() && isFormValid === false
              ? 'Judul wajib diisi'
              : null
          }
        >
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Contoh: Strategi War TH 16 Terbaik Musim Ini..."
            required
            // Menggunakan helper class dari PostFormGroup
            className={getInputClasses(
              !formData.title.trim() && isFormValid === false
            )}
          />
        </FormGroup>

        {/* Konten */}
        <FormGroup
          label="Isi Konten (Wajib)"
          htmlFor="content"
          error={
            !formData.content.trim() && isFormValid === false
              ? 'Konten wajib diisi'
              : null
          }
        >
          <textarea
            id="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder="Tulis konten panduan, pertanyaan, atau tempel Base Link di sini..."
            required
            rows={10}
            // Menggunakan helper class dari PostFormGroup
            className={
              getInputClasses(!formData.content.trim() && isFormValid === false) +
              ' resize-y min-h-[150px]'
            }
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
              className={getInputClasses(false) + ' appearance-none'}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option
                  key={cat}
                  value={cat}
                  className="bg-coc-stone text-white font-sans"
                >
                  {cat}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup
            label="Tambahkan Tag (Pisahkan dengan koma)"
            htmlFor="tags"
          >
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="Contoh: TH16, Hybrid, CWL"
              className={getInputClasses(false)}
            />
          </FormGroup>
        </div>

        {/* START: FIELD KHUSUS STRATEGI SERANGAN (Modular Component) */}
        <StrategyFields 
          formData={formData}
          handleInputChange={handleInputChange}
          isFormValid={isFormValid}
          isStrategyPost={isStrategyPost}
        />
        {/* END: FIELD KHUSUS STRATEGI SERANGAN */}

        {/* --- FIELD KHUSUS BASE BUILDING (Modular Component) --- */}
        <BaseBuildingFields 
          formData={formData}
          handleInputChange={handleInputChange}
          isFormValid={isFormValid}
          isBaseBuildingPost={isBaseBuildingPost}
        />
        {/* --- AKHIR FIELD BASE BUILDING --- */}

        {/* Tombol Aksi (Modular Component) */}
        <FormActions 
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
          submitIcon={submitIcon}
          submitText={submitText}
          initialPostId={initialData?.id}
        />
      </form>
    </>
  );
};

export default PostFormClient;