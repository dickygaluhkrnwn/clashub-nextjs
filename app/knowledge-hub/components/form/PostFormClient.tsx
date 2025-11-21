'use client';

import React from 'react';
import { EditIcon } from '@/app/components/icons';
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
  const { t } = useLanguage();
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

  // Helper untuk label kategori
  const getCategoryLabel = (cat: string) => {
    if (cat === 'Strategi Serangan') return t.knowledgeHub.form.options.types.attackStrategy;
    if (cat === 'Base Building') return t.knowledgeHub.form.options.types.baseBuilding;
    return cat;
  };

  return (
    <>
      <Notification notification={notification ?? undefined} />

      <form onSubmit={handleSubmit} className={`${className} max-w-4xl mx-auto`}>
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
            rows={10}
            className={getInputClasses(!formData.content.trim() && isFormValid === false) + ' resize-y min-h-[150px]'}
          />
        </FormGroup>

        {/* Kategori & Tags */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormGroup label={t.knowledgeHub.form.labels.type} htmlFor="category">
            <select
              id="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              className={getInputClasses(false) + ' appearance-none'}
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat} className="bg-coc-stone text-white font-sans">
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </FormGroup>

          <FormGroup label={t.knowledgeHub.form.labels.tags} htmlFor="tags">
            <input
              type="text"
              id="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder={t.knowledgeHub.form.placeholders.tags}
              className={getInputClasses(false)}
            />
          </FormGroup>
        </div>

        {/* Field Dinamis */}
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