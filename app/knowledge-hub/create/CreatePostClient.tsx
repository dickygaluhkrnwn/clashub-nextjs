'use client';

import React from 'react';
import PostForm from '../components/PostForm';
import { Post } from '@/lib/types';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { EditIcon } from '@/app/components/icons';

interface CreatePostClientProps {
  initialData: (Post & { id: string }) | null;
}

const CreatePostClient = ({ initialData }: CreatePostClientProps) => {
  const { t } = useLanguage();
  const isEditMode = !!initialData;

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white font-clash relative overflow-x-hidden pb-20">
       {/* Background Ambience */}
       <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/5 via-transparent to-transparent pointer-events-none z-0" />
       <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-coc-gold/5 rounded-full blur-[150px] pointer-events-none z-0" />

       <main className="container mx-auto p-4 md:p-8 mt-6 relative z-10 max-w-4xl">
          {/* Header */}
          <header className="mb-10 text-center md:text-left">
             <div className="inline-flex items-center gap-3 mb-2 px-4 py-1.5 rounded-full bg-coc-gold/10 border border-coc-gold/20 text-coc-gold text-xs font-bold uppercase tracking-widest shadow-sm">
                <EditIcon className="h-4 w-4" />
                {isEditMode ? 'Update Operation' : 'New Operation'}
             </div>
             <h1 className="text-3xl md:text-5xl font-bold text-white uppercase tracking-wide drop-shadow-md mt-4">
                {isEditMode ? 'Edit Strategy' : 'Create Strategy'}
             </h1>
             <p className="text-gray-400 text-sm md:text-base font-sans mt-2 max-w-2xl leading-relaxed">
                Bagikan pengetahuan, strategi serangan, atau desain base terbaikmu kepada komunitas. Kontribusi Anda membangun pasukan yang lebih kuat.
             </p>
          </header>

          {/* Form Container */}
          <div className="bg-[#15171e]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-1 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-coc-gold via-coc-blue to-coc-gold opacity-50" />
              <div className="bg-[#0a0a0b]/50 rounded-[22px] p-6 md:p-8">
                 <PostForm initialData={initialData} />
              </div>
          </div>
       </main>
    </div>
  );
};

export default CreatePostClient;