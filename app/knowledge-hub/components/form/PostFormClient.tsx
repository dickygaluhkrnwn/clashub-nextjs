'use client';

import React from 'react';
import { EditIcon, AlertTriangleIcon } from '@/app/components/icons';
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

  return (
    <div className={`min-h-screen bg-coc-dark text-white font-clash relative overflow-x-hidden ${className}`}>
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed top-20 right-0 w-[300px] h-[300px] bg-coc-gold/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {notification && <Notification notification={notification ?? undefined} />}

      <main className="container mx-auto p-4 md:p-8 mt-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <header className="mb-8 flex items-center justify-center text-center">
            {/* Tombol Back telah dihapus */}
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center justify-center gap-2">
                <EditIcon className="h-6 w-6 text-coc-gold" />
                {isEditMode ? t.knowledgeHub.create.editTitle : t.knowledgeHub.create.title}
              </h1>
              <p className="text-gray-400 text-sm font-sans mt-1">
                {language === 'id' ? 'Bagikan pengetahuanmu dengan komunitas.' : 'Share your knowledge with the community.'}
              </p>
            </div>
          </header>

          <form 
            onSubmit={handleSubmit} 
            className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8"
          >
            {formError && (
              <div className="bg-red-500/10 text-red-200 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertTriangleIcon className="h-5 w-5 flex-shrink-0 mt-0.5" />
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
                <select
                  id="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  className={getInputClasses(false) + ' appearance-none'}
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat} value={cat} className="bg-coc-dark text-white font-sans py-2">
                      {getCategoryLabel(cat)}
                    </option>
                  ))}
                </select>
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
        </div>
      </main>
    </div>
  );
};

export default PostFormClient;