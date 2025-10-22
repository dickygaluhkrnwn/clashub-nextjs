import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/server-auth';
import PostForm from '../components/PostForm';
import { ArrowLeftIcon } from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';

export const metadata: Metadata = {
    title: "Clashub | Buat Postingan Baru",
    description: "Buat panduan, strategi, atau diskusi baru untuk Knowledge Hub komunitas Clash of Clans.",
};

/**
 * @component CreatePostPage (Server Component)
 * Menangani perlindungan rute dan menampilkan form pembuatan postingan.
 */
const CreatePostPage = async () => {
    
    // 1. Route Protection: Pastikan pengguna login
    const sessionUser = await getSessionUser();

    if (!sessionUser) {
        // Jika tidak ada sesi, alihkan pengguna ke halaman login
        redirect('/auth');
    }
    
    // Kita hanya perlu memastikan pengguna login. Logika validasi data CV
    // (misalnya, TH level) akan ditangani di sisi klien/Firestore.

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <div className="max-w-4xl mx-auto mb-6">
                <Button href="/knowledge-hub" variant="secondary" size="md" className="flex items-center">
                    <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Hub
                </Button>
            </div>
            {/* Meneruskan kontrol ke Client Component Form */}
            <PostForm />
        </main>
    );
};

export default CreatePostPage;
