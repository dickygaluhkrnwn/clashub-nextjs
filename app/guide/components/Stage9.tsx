import React from 'react';
import {
  BookOpenIcon,
  PlusIcon,
  MessageSquareIcon,
  HeartIcon,
  ShareIcon,
  ImageIcon
} from '@/app/components/icons';

const Stage9 = () => {
  return (
    <article className="prose prose-invert max-w-none">
      {/* Header */}
      <div className="mb-8">
        <span className="text-coc-gold font-bold tracking-wider text-sm uppercase mb-2 block">Panduan Tahap 9</span>
        <h1 className="text-3xl md:text-4xl font-clash text-white mb-4">Knowledge Hub & Interaksi</h1>
        <p className="text-lg text-gray-300 leading-relaxed">
          Bagikan pengetahuan Anda dan pelajari strategi terbaik dari komunitas. Knowledge Hub adalah tempat berkumpulnya para ahli strategi Clash of Clans.
        </p>
      </div>

      {/* Section 1: Menjelajahi Feed */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">1</span>
          Menjelajahi Knowledge Hub
        </h2>
        
        <p className="text-gray-300 mb-4">
            Akses menu <strong>Knowledge Hub</strong> untuk melihat postingan terbaru dari pemain lain.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <CategoryCard 
                title="Strategi Serangan"
                desc="Panduan langkah demi langkah untuk mendapatkan 3 bintang di berbagai level TH."
                tags={['Hybrid', 'Lalo', 'Smash']}
            />
            <CategoryCard 
                title="Base Layout"
                desc="Koleksi desain base untuk War, Farming, atau Trophy Pushing beserta link copy-nya."
                tags={['Anti-3 Star', 'Ring Base', 'Farming']}
            />
        </div>
      </section>

      {/* Section 2: Membuat Postingan */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">2</span>
          Membuat Postingan Baru
        </h2>
        
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-coc-gold/20 p-2 rounded-lg">
                    <PlusIcon className="h-6 w-6 text-coc-gold" />
                </div>
                <h3 className="text-white font-bold text-lg">Bagikan Strategi Anda</h3>
            </div>
            
            <ol className="list-decimal list-inside space-y-3 text-gray-300 ml-1">
                <li>Klik tombol <strong>"Buat Postingan"</strong> di pojok kanan atas halaman Knowledge Hub.</li>
                <li>Pilih <strong>Kategori</strong> yang sesuai (Strategi / Base Layout / Umum).</li>
                <li>Tulis <strong>Judul</strong> yang menarik dan deskriptif.</li>
                <li>
                    Isi konten utama. Anda bisa menggunakan <em>Rich Text Editor</em> untuk menebalkan teks atau membuat daftar.
                </li>
                <li>
                    <strong>Upload Gambar/Video:</strong> Sertakan screenshot hasil serangan atau gambar base layout untuk memperjelas postingan.
                </li>
            </ol>
        </div>
      </section>

      {/* Section 3: Berinteraksi dengan Komunitas */}
      <section className="mb-12">
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">3</span>
          Diskusi & Apresiasi
        </h2>
        
        <p className="text-gray-300 mb-6">
            Bangun reputasi Anda di komunitas dengan berinteraksi secara positif.
        </p>

        <div className="space-y-3">
            <InteractionCard 
                icon={<HeartIcon className="h-5 w-5 text-coc-red" />}
                title="Like (Suka)"
                desc="Berikan apresiasi pada postingan yang bermanfaat. Postingan dengan banyak Like akan muncul di 'Trending'."
            />
            <InteractionCard 
                icon={<MessageSquareIcon className="h-5 w-5 text-coc-blue" />}
                title="Komentar"
                desc="Tanyakan detail strategi atau berikan saran tambahan di kolom komentar. Diskusi yang sehat sangat dianjurkan."
            />
            <InteractionCard 
                icon={<ShareIcon className="h-5 w-5 text-coc-gold" />}
                title="Bagikan"
                desc="Bagikan link postingan bermanfaat ke grup WhatsApp atau Discord klan Anda."
            />
        </div>
      </section>

      {/* Section 4: Panduan Etika */}
      <section>
        <h2 className="text-2xl font-clash text-white mb-6 flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-full bg-coc-gold/20 text-coc-gold text-sm border border-coc-gold/30">4</span>
          Etika Komunitas
        </h2>
        
        <div className="bg-coc-red/5 border border-coc-red/20 rounded-xl p-5">
            <p className="text-gray-300 text-sm leading-relaxed">
                Untuk menjaga komunitas tetap kondusif, harap perhatikan hal berikut:
            </p>
            <ul className="list-disc list-inside mt-3 space-y-2 text-sm text-gray-400">
                <li>Dilarang memposting konten SARA, pornografi, atau ujaran kebencian.</li>
                <li>Hindari spam atau promosi berlebihan (kecuali di kategori Rekrutmen Klan).</li>
                <li>Hargai pendapat pemain lain meskipun berbeda strategi.</li>
            </ul>
        </div>
      </section>

    </article>
  );
};

const CategoryCard = ({ title, desc, tags }: any) => (
    <div className="bg-black/20 p-5 rounded-xl border border-white/5 hover:border-white/20 transition-colors">
        <h4 className="text-white font-bold text-lg mb-2">{title}</h4>
        <p className="text-sm text-gray-400 mb-4 h-10">{desc}</p>
        <div className="flex flex-wrap gap-2">
            {tags.map((tag: string) => (
                <span key={tag} className="text-xs bg-white/10 text-gray-300 px-2 py-1 rounded-md">
                    #{tag}
                </span>
            ))}
        </div>
    </div>
);

const InteractionCard = ({ icon, title, desc }: any) => (
    <div className="flex items-start gap-4 p-4 bg-white/5 rounded-lg border border-white/5">
        <div className="mt-1">{icon}</div>
        <div>
            <h4 className="text-white font-bold text-sm mb-1">{title}</h4>
            <p className="text-xs text-gray-400">{desc}</p>
        </div>
    </div>
);

export default Stage9;