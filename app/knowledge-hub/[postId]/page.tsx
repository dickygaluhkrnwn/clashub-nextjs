import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { getPostById, getUserProfile } from '@/lib/firestore';
import { Post, UserProfile } from '@/lib/types';
// FIX: Tambahkan PaperPlaneIcon, LinkIcon, dan TrashIcon
// PENAMBAHAN: Tambahkan HomeIcon
import { ArrowLeftIcon, StarIcon, EditIcon, BookOpenIcon, UserCircleIcon, ClockIcon, PaperPlaneIcon, LinkIcon, TrashIcon, CogsIcon, HomeIcon } from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
// FIX: Import React untuk ContentRenderer dan CommentCard
import React, { useMemo } from 'react'; // Tambahkan useMemo
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

// --- Komponen Renderer Konten Sederhana (untuk mengatasi line break) ---
// Menerima data Post lengkap
const ContentRenderer = ({ post }: { post: Post }) => {
    // Memproses konten utama untuk line break
    const contentParts = useMemo(() => {
        return post.content.split('\n').map((line, index) => {
            // 2. Deteksi Base Link: Pola umum untuk URL Clash of Clans Base Link
            const baseLinkRegex = /(https?:\/\/(link\.clashofclans\.com)\/(\S+)\/base\/(\S+))/i;
            const linkMatch = line.match(baseLinkRegex);

            // Jika ditemukan link base di dalam konten (walaupun ada field khusus), kita tetap tampilkan sebagai link.
            if (linkMatch) {
                const fullLink = linkMatch[0];
                return (
                    <a
                        key={index}
                        href={fullLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold hover:underline text-coc-gold" // Tambahkan style link
                    >
                        {fullLink}
                    </a>
                );
            }

            // Teks biasa hanya dikembalikan sebagai string
            return line;
        }).map((line, index, arr) => (
            // Tambahkan <br /> secara eksplisit kecuali untuk baris terakhir
            <React.Fragment key={index}>
                {line}
                {index < arr.length - 1 && <br />}
            </React.Fragment>
        ));
    }, [post.content]);

    return <div className="prose prose-invert prose-lg max-w-none text-gray-300 font-sans">{contentParts}</div>;
};


// --- Komponen Kartu Komentar (Statis) ---
const CommentCard = ({ authorName, authorId, content, timestamp }: { authorName: string, authorId: string, content: string, timestamp: Date }) => {
    // FIX: locale: id ditambahkan
    const formattedTime = format(timestamp, 'HH:mm dd/MM/yyyy', { locale: id });

    return (
        <div className="flex gap-4 p-4 bg-coc-stone/50 rounded-lg border-l-4 border-coc-gold-dark/30">
            <Link href={`/player/${authorId}`} className="flex-shrink-0">
                <UserCircleIcon className="h-8 w-8 text-coc-gold-dark hover:text-white transition-colors" />
            </Link>
            <div className="flex-grow">
                <Link href={`/player/${authorId}`} className="font-bold text-coc-gold hover:text-white text-md">{authorName}</Link>
                {/* Pastikan konten komentar menggunakan font sans */}
                <p className="text-gray-300 text-sm mt-1 font-sans">{content}</p>
                <span className="text-xs text-gray-500 block mt-1">
                    {formattedTime}
                </span>
            </div>
        </div>
    );
};
// --- End Komponen Kartu Komentar ---


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

    // --- LOGIKA BARU UNTUK STRATEGI SERANGAN ---
    const isStrategyPost = post.category === 'Strategi Serangan';

    // Mendapatkan Video ID YouTube dari videoUrl field baru
    const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)(\w+)/i;
    // Cek field videoUrl yang baru
    const videoId = post.videoUrl ? post.videoUrl.match(youtubeRegex)?.[1] : null;
    // --- AKHIR LOGIKA BARU ---

    // --- PENAMBAHAN BARU (Langkah 4) ---
    const isBaseBuildingPost = post.category === 'Base Building';
    // --- AKHIR PENAMBAHAN ---

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
                    {/* PERBAIKAN STYLING: Tambahkan rounded-lg */}
                    <div className="card-stone p-8 space-y-6 rounded-lg">
                        <header>
                            {/* PERBAIKAN FONT: font-supercell -> font-clash */}
                            <h1 className="text-4xl text-white font-clash m-0 leading-tight">{post.title}</h1>

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
                                    <BookOpenIcon className='h-4 w-4' /> {post.category}
                                </span>
                                {/* Tanggal */}
                                <span className="flex items-center gap-1">
                                    <ClockIcon className='h-4 w-4' /> {format(post.createdAt, 'd MMMM yyyy', { locale: id })}
                                </span>
                            </div>
                        </header>

                        {/* START: KONTEN KHUSUS STRATEGI SERANGAN (Direvisi untuk Video Besar & Link di Bawah) */}
                        {isStrategyPost && (post.troopLink || videoId) && (
                            <div className="space-y-6 pt-4 border-b border-coc-gold-dark/20 pb-6">
                                <h2 className="text-2xl font-clash text-coc-gold-dark flex items-center gap-2">
                                    <CogsIcon className="h-6 w-6" /> Detail Strategi
                                </h2>

                                {/* 1. Video Section (Full Width) */}
                                {videoId ? (
                                    <div className="w-full">
                                        <p className="text-sm text-gray-400 mb-2 font-bold flex items-center gap-1">Video Tutorial:</p>
                                        {/* Container 16:9 yang mengambil lebar penuh kolom (lg:col-span-3) */}
                                        <div className="relative w-full overflow-hidden rounded-lg border-2 border-coc-gold-dark" style={{ paddingTop: '56.25%' }}>
                                            <iframe
                                                src={`https://www.youtube.com/embed/${videoId}`}
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                allowFullScreen
                                                className="absolute top-0 left-0 w-full h-full"
                                                title="Embedded YouTube video"
                                            ></iframe>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-coc-stone/50 rounded-lg flex items-center justify-center text-center">
                                        <p className="text-gray-500 text-sm">Video tutorial tidak tersedia.</p>
                                    </div>
                                )}

                                {/* 2. Troop Link Section (Full Width, di bawah video) */}
                                <div className="w-full pt-4 border-t border-coc-gold-dark/20">
                                    <p className="text-sm text-gray-400 mb-4 font-bold flex items-center gap-1">Kombinasi Pasukan (Copy Link):</p>
                                    <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-coc-stone/50 rounded-lg border border-coc-gold-dark/30">
                                        {post.troopLink ? (
                                            <>
                                                {/* Preview Image (Left) */}
                                                <Image src="/images/barbarian.png" alt="Troop Combo Preview" width={80} height={80} className="w-16 h-16 flex-shrink-0" />
                                                {/* Button (Right/Below) */}
                                                <a href={post.troopLink} target="_blank" rel="noopener noreferrer" className="flex-grow w-full md:w-auto">
                                                    <Button variant="primary" size="lg" className="w-full text-sm">
                                                        <LinkIcon className="inline h-5 w-5 mr-2" /> SALIN KOMBINASI PASUKAN
                                                    </Button>
                                                </a>
                                            </>
                                        ) : (
                                            <p className="text-gray-500 text-sm text-center w-full">Troop Link tidak tersedia.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* END: KONTEN KHUSUS STRATEGI SERANGAN */}

                        {/* --- PENAMBAHAN BARU (Langkah 4): KONTEN KHUSUS BASE BUILDING --- */}
                        {isBaseBuildingPost && (post.baseImageUrl || post.baseLinkUrl) && (
                            <div className="space-y-6 pt-4 border-b border-coc-gold-dark/20 pb-6">
                                <h2 className="text-2xl font-clash text-coc-gold-dark flex items-center gap-2">
                                    <HomeIcon className="h-6 w-6" /> Detail Base
                                </h2>

                                {/* 1. Base Image (Imgur) */}
                                {post.baseImageUrl && (
                                    <div className="w-full">
                                        <p className="text-sm text-gray-400 mb-2 font-bold flex items-center gap-1">Tampilan Base:</p>
                                        {/* --- PERUBAHAN (Langkah 6): Menggunakan next/image --- */}
                                        <div className="relative w-full aspect-video overflow-hidden rounded-lg border-2 border-coc-gold-dark bg-black/20">
                                            {/* Menggunakan next/image setelah 'i.imgur.com' ditambahkan ke next.config.js.
                                                Kita gunakan 'fill' dan 'objectFit="contain"' di dalam aspect-ratio container
                                                untuk menggantikan 'w-full h-auto' agar layout stabil (mencegah CLS).
                                            */}
                                            <Image
                                                src={post.baseImageUrl}
                                                alt={`Tampilan base untuk ${post.title}`}
                                                layout="fill"
                                                objectFit="contain"
                                                className="bg-black/20"
                                                loading="lazy"
                                                placeholder="blur" // Menambahkan placeholder blur
                                                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mN88/JjPQAIiwM/q1QNGwAAAABJRU5ErkJggg=="
                                                // Hapus onError fallback, next/image akan menangani error (atau tampilkan blur)
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* 2. Base Link (CoC) */}
                                {post.baseLinkUrl && (
                                    <div className="w-full pt-4 mt-6 border-t border-coc-gold-dark/20">
                                        <p className="text-sm text-gray-400 mb-4 font-bold flex items-center gap-1">Link Base (Copy):</p>
                                        <div className="flex flex-col md:flex-row items-center gap-6 p-4 bg-coc-stone/50 rounded-lg border border-coc-gold-dark/30">
                                            <Image src="/images/th12.png" alt="Base Link Preview" width={80} height={80} className="w-16 h-16 flex-shrink-0" />
                                            <a href={post.baseLinkUrl} target="_blank" rel="noopener noreferrer" className="flex-grow w-full md:w-auto">
                                                <Button variant="primary" size="lg" className="w-full text-sm">
                                                    <LinkIcon className="inline h-5 w-5 mr-2" /> SALIN LINK BASE
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* --- AKHIR PENAMBAHAN (Langkah 4) --- */}


                        {/* Konten Utama (Deskripsi) */}
                        <div className="prose prose-invert prose-lg max-w-none text-gray-300">
                            <h3 className="text-xl font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">Deskripsi Lengkap</h3>
                            {/* Memanggil ContentRenderer dengan props yang diperbarui */}
                            <ContentRenderer post={post} />
                        </div>

                        {/* Tombol Aksi Penulis (Edit/Hapus) */}
                        {isAuthor && (
                            <div className="flex justify-end gap-4 pt-4 border-t border-coc-gold-dark/20">
                                {/* ASUMSI: Edit page akan dibuat di rute /knowledge-hub/create?postId=... */}
                                <Button href={`/knowledge-hub/create?postId=${postId}`} variant="secondary" size="sm">
                                    <EditIcon className="h-4 w-4 mr-2" /> Edit Postingan
                                </Button>
                                {/* [PERBAIKAN] Hapus onClick yang non-serializable. */}
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    disabled={true} // Nonaktifkan sementara
                                    className="bg-coc-red/70 border-coc-red text-white hover:bg-coc-red"
                                    title="Fitur Hapus belum diimplementasikan." // Tambahkan info
                                >
                                    <TrashIcon className="h-4 w-4 mr-2" /> Hapus
                                </Button>
                            </div>
                        )}

                        {/* Bagian Komentar */}
                        <div className="mt-10 pt-6 border-t-2 border-coc-gold-dark/30">
                            {/* PERBAIKAN FONT: Terapkan font-clash */}
                            <h2 className="text-2xl font-clash border-l-4 border-coc-gold pl-3 mb-6">Balasan ({post.replies})</h2>

                            {/* Area Input Komentar (Statis) */}
                            <div className="bg-coc-stone/50 p-4 rounded-lg mb-6">
                                <textarea placeholder="Tulis komentar atau pertanyaan Anda di sini..." rows={3} className="w-full bg-transparent border-b border-coc-gold-dark/50 p-2 text-white focus:outline-none resize-none font-sans"></textarea>
                                <Button variant="primary" size="sm" className="mt-3" disabled={!sessionUser}>
                                    <PaperPlaneIcon className="inline h-4 w-4 mr-2" /> Kirim Komentar
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
                {/* PERBAIKAN STYLING: Tambahkan rounded-lg */}
                <aside className="lg:col-span-1 card-stone p-6 h-fit sticky top-28 space-y-6 text-center rounded-lg">
                    {/* PERBAIKAN FONT: Terapkan font-clash */}
                    <h2 className="text-xl font-clash border-l-4 border-coc-gold-dark pl-3 mb-4 flex items-center justify-center">Penulis</h2>

                    <Image
                        src={authorProfile?.avatarUrl || '/images/placeholder-avatar.png'}
                        alt={`${post.authorName} Avatar`}
                        width={80}
                        height={80}
                        className="w-20 h-20 rounded-full mx-auto border-4 border-coc-gold object-cover flex-shrink-0"
                    />
                    {/* PERBAIKAN FONT: font-supercell -> font-clash */}
                    <h3 className="text-2xl text-white font-clash m-0">{post.authorName}</h3>

                    <p className="text-xs text-gray-400 mt-1">
                        {authorProfile?.playStyle || 'Kontributor'}
                    </p>

                    <div className="pt-4 border-t border-coc-gold-dark/20">
                        {/* PERBAIKAN FONT: font-supercell -> font-clash */}
                        <h3 className="text-lg font-clash text-coc-gold-dark">Reputasi</h3>
                        {/* PERBAIKAN FONT: font-supercell -> font-clash */}
                        <p className="text-4xl font-clash text-coc-gold my-1">
                            {authorProfile?.reputation ? authorProfile.reputation.toFixed(1) : '5.0'} <StarIcon className="inline h-6 w-6" />
                        </p>
                    </div>

                    <Button href={`/player/${post.authorId}`} variant="primary" className="w-full mt-4">
                        Lihat E-sports CV
                    </Button>

                    {/* Diskusi Terkait (Statis) */}
                    <div className="pt-4 border-t border-coc-gold-dark/20 text-left">
                        {/* PERBAIKAN FONT: font-supercell -> font-clash */}
                        <h3 className="text-lg font-clash text-coc-gold-dark border-b border-coc-gold-dark/30 pb-2">Diskusi Terkait</h3>
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

