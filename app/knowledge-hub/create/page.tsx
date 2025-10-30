import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
// Import fungsi untuk mengambil postingan berdasarkan ID
import { getPostById } from '@/lib/firestore'; 
import PostForm from '../components/PostForm';
import { ArrowLeftIcon } from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import { Post } from '@/lib/types'; // Import tipe Post

export const metadata: Metadata = {
    title: "Clashub | Buat Postingan Baru",
    description: "Buat panduan, strategi, atau diskusi baru untuk Knowledge Hub komunitas Clash of Clans.",
};

// Tambahkan tipe untuk props yang diterima dari Next.js (URL search params)
interface CreatePostPageProps {
    searchParams: {
        postId?: string; // ID postingan yang akan diedit
    };
}

/**
 * @component CreatePostPage (Server Component)
 * Menangani perlindungan rute dan menampilkan form pembuatan atau pengeditan postingan.
 */
const CreatePostPage = async ({ searchParams }: CreatePostPageProps) => { // Terima searchParams

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

    // Tentukan judul header
    const headerTitle = isEditMode ? 'Edit Postingan Anda' : 'Buat Postingan Baru';

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <div className="max-w-4xl mx-auto mb-6">
                {/* Tampilkan judul di luar form untuk SEO dan aksesibilitas */}
                <h1 className="text-3xl font-clash text-white mb-4">{headerTitle}</h1>
                <Button href="/knowledge-hub" variant="secondary" size="md" className="flex items-center">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Hub
                </Button>
            </div>
            
            {/* Meneruskan initialData (bisa null untuk mode Create) */}
            <PostForm 
                className="card-stone p-8 space-y-8 rounded-lg" 
                initialData={postData}
            />
        </main>
    );
};

export default CreatePostPage;
