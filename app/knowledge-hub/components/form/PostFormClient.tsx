'use client';

import React from 'react';
import { AlertTriangleIcon } from '@/app/components/icons';
import { Post } from '@/lib/types';
import Notification from '@/app/components/ui/Notification';
import { useLanguage } from '@/lib/hooks/useLanguage';

// Import Sub-components & Hook
import { usePostForm, CATEGORY_OPTIONS } from './usePostForm';
import { FormGroup, getInputClasses } from './PostFormGroup';
import BaseBuildingFields from './BaseBuildingFields';
import StrategyFields from './StrategyFields';
import FormActions from './FormActions';

interface PostFormClientProps {
  initialData?: (Post & { id: string }) | null;
  className?: string;
}

const PostFormClient = ({ initialData, className = '' }: PostFormClientProps) => {
  const { t, language } = useLanguage();
  const {
    formData,
    handleInputChange,
    handleSubmit,
    isSubmitting,
    formError,
    isFormValid,
    notification,
    isEditMode,
    isStrategyPost,
    isBaseBuildingPost
  } = usePostForm({ initialData });

  const getCategoryLabel = (cat: string) => {
    if (cat === 'Strategi Serangan') return t.knowledgeHub.form.options.types.attackStrategy;
    if (cat === 'Base Building') return t.knowledgeHub.form.options.types.baseBuilding;
    return cat;
  };

  // REVISI TOTAL: 
  // Menghapus wrapper div min-h-screen, background, header ganda, dan container.
  // Sekarang hanya merender Notification (jika ada) dan Form itu sendiri.
  return (
    <>
      {notification && <Notification notification={notification ?? undefined} />}

      <form 
        onSubmit={handleSubmit} 
        className={`space-y-8 ${className}`}
      >
        {formError && (
          <div className="bg-red-500/10 text-red-200 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 shadow-lg shadow-red-900/10">
            <AlertTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5 text-coc-red" />
            <p className="text-sm font-sans">{formError}</p>
          </div>
        )}

        {/* Judul & Kategori (Grid) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup
            label={t.knowledgeHub.form.labels.title + " *"}
            htmlFor="title"
            error={!formData.title.trim() && isFormValid === false ? t.knowledgeHub.form.validation.titleRequired : null}
          >
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder={t.knowledgeHub.form.placeholders.title}
              required
              className={getInputClasses(!formData.title.trim() && isFormValid === false)}
            />
          </FormGroup>

          <FormGroup label={t.knowledgeHub.form.labels.type} htmlFor="category">
            <div className="relative">
                <select
                  id="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className={getInputClasses(false) + ' appearance-none cursor-pointer'}
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#0a0a0b] text-white font-sans py-2">
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
            </div>
          </FormGroup>
        </div>

        {/* Konten */}
        <FormGroup
          label={t.knowledgeHub.form.labels.description + " *"}
          htmlFor="content"
          error={!formData.content.trim() && isFormValid === false ? t.knowledgeHub.form.validation.descriptionRequired : null}
        >
          <textarea
            id="content"
            value={formData.content}
            onChange={handleInputChange}
            placeholder={t.knowledgeHub.form.placeholders.description}
            required
            rows={8}
            className={getInputClasses(!formData.content.trim() && isFormValid === false) + ' resize-y min-h-[150px]'}
          />
        </FormGroup>

        {/* Tags */}
        <FormGroup label={t.knowledgeHub.form.labels.tags} htmlFor="tags" helperText="Pisahkan dengan koma (contoh: th12, war, hybrid)">
          <input
            type="text"
            id="tags"
            value={formData.tags}
            onChange={handleInputChange}
            placeholder={t.knowledgeHub.form.placeholders.tags}
            className={getInputClasses(false)}
          />
        </FormGroup>

        {/* Field Dinamis */}
        <div className="bg-[#0a0a0b]/30 rounded-2xl border border-white/5 overflow-hidden">
            <StrategyFields
              formData={formData}
              handleInputChange={handleInputChange}
              isFormValid={isFormValid}
              isStrategyPost={isStrategyPost}
            />

            <BaseBuildingFields
              formData={formData}
              handleInputChange={handleInputChange}
              isFormValid={isFormValid}
              isBaseBuildingPost={isBaseBuildingPost}
            />
        </div>

        {/* Tombol Aksi */}
        <FormActions 
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
          isFormValid={isFormValid}
          cancelHref={isEditMode ? `/knowledge-hub/${initialData!.id}` : '/knowledge-hub'}
        />
      </form>
    </>
  );
};

export default PostFormClient;