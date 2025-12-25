'use client';

import React from 'react';
import PostForm from '../components/PostForm';
import { Post } from '@/lib/types';

interface CreatePostClientProps {
  initialData: (Post & { id: string }) | null;
}

const CreatePostClient = ({ initialData }: CreatePostClientProps) => {
  // Komponen ini sekarang sangat bersih.
  // Tidak ada lagi Judul ganda atau Tombol Back ganda.
  // PostForm (yang merupakan wrapper dari PostFormClient) sudah menangani
  // layout halaman penuh (Full Page Glass Layout), Header, dan Logika Form.
  
  return (
    <PostForm initialData={initialData} />
  );
};

export default CreatePostClient;