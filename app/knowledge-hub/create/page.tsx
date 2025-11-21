import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import { getPostById } from '@/lib/firestore'; 
import { Post } from '@/lib/types';
import CreatePostClient from './CreatePostClient';

// Metadata tetap bahasa Inggris untuk SEO global
export const metadata: Metadata = {
  title: "Clashub | Create New Post",
  description: "Create a new guide, strategy, or discussion for the Clash of Clans community Knowledge Hub.",
};

interface CreatePostPageProps {
  searchParams: {
    postId?: string; // ID postingan yang akan diedit
  };
}

/**
 * @component CreatePostPage (Server Component)
 * Menangani perlindungan rute, validasi data, dan memanggil Client Component.
 */
const CreatePostPage = async ({ searchParams }: CreatePostPageProps) => { 

  // 1. Route Protection: Pastikan pengguna login
  const sessionUser = await getSessionUser();
  
  if (!sessionUser) {
    redirect('/auth');
  }

  const postIdToEdit = searchParams.postId;
  let postData: (Post & { id: string }) | null = null;
  let isEditMode = false;

  // 2. Cek Mode Edit dan Ambil Data
  if (postIdToEdit) {
    const result = await getPostById(postIdToEdit);

    if (result) {
      // Validasi: Pastikan pengguna yang login adalah penulis postingan
      if (result.authorId !== sessionUser.uid) {
        // Jika bukan penulis, alihkan ke halaman detail atau tampilkan error
        redirect(`/knowledge-hub/${postIdToEdit}?error=unauthorized`);
      }
      postData = result;
      isEditMode = true;
    } else {
      // Jika postId ada tapi tidak ditemukan di DB
      redirect('/knowledge-hub?error=postNotFound');
    }
  }

  // 3. Render Client Component
  return (
    <CreatePostClient 
      initialData={postData} 
      isEditMode={isEditMode} 
    />
  );
};

export default CreatePostPage;