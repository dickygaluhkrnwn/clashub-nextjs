'use client';

import React from 'react';
import { ArrowLeftIcon } from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import PostForm from '../components/PostForm';
import { Post } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface CreatePostClientProps {
  initialData: (Post & { id: string }) | null;
  isEditMode: boolean;
}

const CreatePostClient = ({ initialData, isEditMode }: CreatePostClientProps) => {
  const { t } = useLanguage();

  // Pilih judul berdasarkan mode
  const headerTitle = isEditMode 
    ? t.knowledgeHub.create.editTitle 
    : t.knowledgeHub.create.title;

  return (
    <div className="container mx-auto p-4 md:p-8 mt-10">
      <div className="max-w-4xl mx-auto mb-6">
        {/* Tampilkan judul di luar form untuk SEO dan aksesibilitas */}
        <h1 className="text-3xl font-clash text-white mb-4">{headerTitle}</h1>
        <Button href="/knowledge-hub" variant="secondary" size="md" className="flex items-center">
          <ArrowLeftIcon className="h-4 w-4 mr-2" /> 
          {t.knowledgeHub.create.backButton}
        </Button>
      </div>
      
      {/* Meneruskan initialData (bisa null untuk mode Create) */}
      <PostForm 
        className="card-stone p-8 space-y-8 rounded-lg" 
        initialData={initialData}
      />
    </div>
  );
};

export default CreatePostClient;