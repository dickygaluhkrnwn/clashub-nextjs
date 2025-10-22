import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPostById, getUserProfile } from '@/lib/firestore';
import { Post, UserProfile } from '@/lib/types';
// FIX: Tambahkan PaperPlaneIcon dan LinkIcon
import { ArrowLeftIcon, StarIcon, EditIcon, BookOpenIcon, UserCircleIcon, ClockIcon, PaperPlaneIcon, LinkIcon } from '@/app/components/icons'; 
import { Button } from '@/app/components/ui/Button';
// FIX: Import React untuk ContentRenderer dan CommentCard
import React from 'react'; 
// FIX: Pastikan date-fns dan locale diimpor jika sudah diinstal
import { format } from 'date-fns';
import { id } from 'date-fns/locale'; 
import { getSessionUser } from '@/lib/server-auth';

// Definisikan tipe untuk parameter rute dinamis
interface PostDetailPageProps {
    params: {
        postId: string;
    };
}

/**
 * @function generateMetadata
 * Membuat metadata dinamis untuk SEO di sisi Server.
 */
export async function generateMetadata({ params }: PostDetailPageProps): Promise<Metadata> {
    const postId = params.postId;
    const post = await getPostById(postId);

    if (!post) {
        return { title: "Postingan Tidak Ditemukan | Clashub" };
    }

    // Ambil 150 karakter pertama untuk deskripsi
    const description = post.content.substring(0, 150) + (post.content.length > 150 ? '...' : '');

    return {
        title: `Clashub | ${post.title}`,
        description: description,
    };
}

/**
 * @component PostDetailPage (Server Component)
 * Menampilkan detail lengkap sebuah postingan.
 */
const PostDetailPage = async ({ params }: PostDetailPageProps) => {
    const postId = params.postId;

    // Ambil data Postingan dan sesi pengguna secara paralel
    const [post, sessionUser] = await Promise.all([
        getPostById(postId),
        getSessionUser(),
    ]);
    
    if (!post) {
        notFound();
    }

    // Ambil data profil penulis
    const authorProfile: UserProfile | null = await getUserProfile(post.authorId);
    
    // Cek apakah pengguna saat ini adalah penulis postingan
    const isAuthor = sessionUser && sessionUser.uid === post.authorId;

    return (
        <main className="container mx-auto p-4 md:p-8 mt-10">
            <section className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* Kolom Kiri: Konten Postingan & Komentar */}
                <div className="lg:col-span-3">
                    <div className="mb-6">
                        <Button href="/knowledge-hub" variant="secondary" size="md" className="flex items-center">
                            <ArrowLeftIcon className="h-4 w-4 mr-2" /> Kembali ke Hub
                        </Button>
                    </div>

                    <div className="card-stone p-8 space-y-6">
                        <header>
                            <h1 className="text-4xl text-white font-supercell m-0 leading-tight">{post.title}</h1>
                            
                            {/* Meta Detail */}
                            <div className="flex flex-wrap items-center gap-4 py-4 mt-4 border-y border-coc-gold-dark/20 text-sm text-gray-400">
                                {/* Tags */}
                                <div className="flex gap-2">
                                    {post.tags.map((tag, index) => (
                                        <span key={index} className="px-2 py-0.5 text-xs font-bold rounded-sm bg-coc-red text-white">#{tag.toUpperCase()}</span>
                                    ))}
                                </div>
                                {/* Kategori */}
                                <span className="font-bold text-coc-gold flex items-center gap-1">
                                    <BookOpenIcon className='h-4 w-4'/> {post.category}
                                </span>
                                {/* Tanggal */}
                                <span className="flex items-center gap-1">
                                    <ClockIcon className='h-4 w-4'/> {format(post.createdAt, 'd MMMM yyyy', { locale: id })}
                                </span>
                            </div>
                        </header>

                        {/* Konten Utama */}
                        <div className="prose prose-invert prose-lg max-w-none text-gray-300">
                            <p className="whitespace-pre-line leading-relaxed">
                                <ContentRenderer content={post.content} />
                            </p>
                        </div>
                        
                        {/* Tombol Aksi Penulis (Edit/Hapus) */}
                        {isAuthor && (
                            <div className="flex justify-end gap-4 pt-4 border-t border-coc-gold-dark/20">
                                {/* ASUMSI: Edit page akan dibuat di rute /knowledge-hub/edit/[postId] */}
                                <Button href={`/knowledge-hub/create?postId=${postId}`} variant="secondary" size="sm">
                                    <EditIcon className="h-4 w-4 mr-2"/> Edit Postingan
                                </Button>
                                <Button onClick={() => alert('Fitur Hapus belum diimplementasikan.')} variant="secondary" size="sm" className="bg-coc-red/70 border-coc-red text-white hover:bg-coc-red">
                                    Hapus
                                </Button>
                            </div>
                        )}

                        {/* Bagian Komentar */}
                        <div className="mt-10 pt-6 border-t-2 border-coc-gold-dark/30">
                            <h2 className="text-2xl border-l-4 border-coc-gold pl-3 mb-6">Balasan ({post.replies})</h2>
                            
                            {/* Area Input Komentar (Statis) */}
                            <div className="bg-coc-stone/50 p-4 rounded-lg mb-6">
                                <textarea placeholder="Tulis komentar atau pertanyaan Anda di sini..." rows={3} className="w-full bg-transparent border-b border-coc-gold-dark/50 p-2 text-white focus:outline-none resize-none"></textarea>
                                <Button variant="primary" size="sm" className="mt-3">
                                    <PaperPlaneIcon className="inline h-4 w-4 mr-2"/> Kirim Komentar
                                </Button>
                            </div>

                            {/* Daftar Komentar (Statis) */}
                            <div className="space-y-4">
                                <CommentCard authorName="KaptenX" authorId="uid_xena" content="Strategi yang bagus, saya coba semalam di War Clan dan hasilnya 3-bintang! Terima kasih atas panduannya." timestamp={new Date(Date.now() - 3600000)} />
                                <CommentCard authorName="BaseMaster" authorId="uid_ghost" content="Sudah coba, tapi funneling-nya agak sulit. Ada tips untuk pemula, LordZ?" timestamp={new Date(Date.now() - 7200000)} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kolom Kanan: Sidebar Penulis */}
                <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6 text-center">
                    <h2 className="text-xl border-l-4 border-coc-gold-dark pl-3 mb-4 flex items-center justify-center">Penulis</h2>
                    
                    <Image 
                        src={authorProfile?.avatarUrl || '/images/placeholder-avatar.png'} 
                        alt={`${post.authorName} Avatar`} 
                        width={80} 
                        height={80}
                        className="w-20 h-20 rounded-full mx-auto border-4 border-coc-gold object-cover flex-shrink-0"
                    />
                    <h3 className="text-2xl text-white font-supercell m-0">{post.authorName}</h3>
                    
                    <p className="text-xs text-gray-400 mt-1">
                        {authorProfile?.playStyle || 'Kontributor'}
                    </p>
                    
                    <div className="pt-4 border-t border-coc-gold-dark/20">
                        <h3 className="text-lg font-supercell text-coc-gold-dark">Reputasi</h3>
                        <p className="text-3xl font-supercell text-coc-gold my-1">
                            {authorProfile?.reputation ? authorProfile.reputation.toFixed(1) : '5.0'} <StarIcon className="inline h-6 w-6" />
                        </p>
                    </div>

                    <Button href={`/player/${post.authorId}`} variant="primary" className="w-full mt-4">
                        Lihat E-sports CV
                    </Button>
                    
                    {/* Diskusi Terkait (Statis) */}
                    <div className="pt-4 border-t border-coc-gold-dark/20 text-left">
                        <h3 className="text-lg font-supercell text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">Diskusi Terkait</h3>
                        <ul className="text-sm space-y-3 mt-3">
                            <li className="text-gray-300 hover:text-coc-gold transition-colors"><Link href="#">Base Building Anti-Hydrid</Link></li>
                            <li className="text-gray-300 hover:text-coc-gold transition-colors"><Link href="#">Upgrade Hero Equipment Terbaik</Link></li>
                        </ul>
                    </div>
                </aside>

            </section>
        </main>
    );
};

export default PostDetailPage;

// --- Komponen Renderer Konten Sederhana (Untuk Menggantikan Markdown/Embed) ---

/**
 * @component ContentRenderer
 * Komponen ini hanya melakukan konversi dasar Line Break, Base Link, dan YouTube Embed.
 */
const ContentRenderer = ({ content }: { content: string }) => {
    // 1. Konversi baris baru menjadi <br>
    const htmlContent = content.split('\n').map((line, index) => {
        
        // 2. Deteksi Base Link: Pola umum untuk URL Clash of Clans Base Link
        const baseLinkRegex = /(https?:\/\/(link\.clashofclans\.com)\/(\S+)\/base\/(\S+))/i;
        const linkMatch = line.match(baseLinkRegex);
        
        if (linkMatch) {
            const fullLink = linkMatch[0];
            return (
                <p key={index} className="my-4">
                    <Image src="/images/baseth12-placeholder.png" alt="Base Layout Preview" width={600} height={300} className="rounded-lg border-2 border-coc-gold-dark" />
                    <a href={fullLink} target="_blank" rel="noopener noreferrer" className="btn-3d-gold w-full mt-4 text-center block px-4 py-3 text-sm">
                        <LinkIcon className="inline h-5 w-5 mr-2"/> SALIN TAUTAN BASE KE DALAM GAME
                    </a>
                </p>
            );
        }
        
        // 3. Deteksi Video YouTube (sangat sederhana)
        const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)(\w+)/i;
        const videoMatch = line.match(youtubeRegex);

        if (videoMatch) {
             const videoId = videoMatch[1];
             // Embed YouTube menggunakan iframe dengan aspect ratio 16:9
             return (
                 <div key={index} className="relative w-full overflow-hidden rounded-lg border-2 border-coc-gold-dark my-4" style={{ paddingTop: '56.25%' }}>
                    <iframe 
                        src={`https://www.youtube.com/embed/${videoId}`} 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowFullScreen 
                        className="absolute top-0 left-0 w-full h-full"
                        title="Embedded YouTube video"
                    ></iframe>
                 </div>
             );
        }

        // Teks biasa
        return <React.Fragment key={index}>{line}<br/></React.Fragment>;
    });

    return <>{htmlContent}</>;
};

// --- Komponen Kartu Komentar (Statis) ---
const CommentCard = ({ authorName, authorId, content, timestamp }: { authorName: string, authorId: string, content: string, timestamp: Date }) => {
    // FIX: locale: id ditambahkan
    const formattedTime = format(timestamp, 'HH:mm dd/MM/yyyy', { locale: id }); 
    
    return (
        <div className="flex gap-4 p-4 bg-coc-stone/50 rounded-lg border-l-4 border-coc-gold-dark/30">
            <Link href={`/player/${authorId}`} className="flex-shrink-0">
                <UserCircleIcon className="h-8 w-8 text-coc-gold-dark hover:text-white transition-colors"/>
            </Link>
            <div className="flex-grow">
                <Link href={`/player/${authorId}`} className="font-bold text-coc-gold hover:text-white text-md">{authorName}</Link>
                <p className="text-gray-300 text-sm mt-1">{content}</p>
                <span className="text-xs text-gray-500 block mt-1">
                    {formattedTime}
                </span>
            </div>
        </div>
    );
};
