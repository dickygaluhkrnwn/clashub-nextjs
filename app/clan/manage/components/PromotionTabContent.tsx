'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ManagedClan,
  Promotion,
  FirestoreDocument,
} from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import {
  RefreshCwIcon,
  TrashIcon,
  AlertTriangleIcon,
  ThumbsUpIcon,
  UploadIcon,
  PlusIcon, // [BARU V4] Ikon untuk tombol tambah
  XIcon, // [BARU V4] Ikon untuk tombol batal
} from '@/app/components/icons';
import { NotificationProps } from '@/app/components/ui/Notification';
import PromotionAnalytics from './PromotionAnalytics'; // [BARU V4] Impor Komponen Analitik

interface PromotionTabContentProps {
  clan: ManagedClan;
  onAction: (message: string, type: NotificationProps['type']) => void;
}

// [EDIT V3] Sesuaikan Tipe Omit dengan interface Promotion yang baru
type NewPromotionData = Omit<
  Promotion,
  'id' | 'clanId' | 'totalClicks' | 'clicksByTH'
>;

const PromotionTabContent: React.FC<PromotionTabContentProps> = ({
  clan,
  onAction,
}) => {
  // --- [ROMBAK V2] State Management ---
  const [promotions, setPromotions] = useState<FirestoreDocument<Promotion>[]>(
    [],
  );
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [formData, setFormData] = useState<NewPromotionData>({
    imageUrl: '',
    title: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // --- [BARU V4] State untuk menampilkan/menyembunyikan form ---
  const [showAddForm, setShowAddForm] = useState(false);

  // [ROMBAK V2] Fungsi untuk mengambil daftar promosi
  const fetchPromotions = async () => {
    setIsLoadingList(true);
    try {
      const response = await fetch(`/api/clan/manage/${clan.id}/promotions`);
      if (!response.ok) {
        throw new Error('Gagal memuat daftar promosi.');
      }
      const data = (await response.json()) as FirestoreDocument<Promotion>[];
      setPromotions(data);
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setIsLoadingList(false);
    }
  };

  // [ROMBAK V2] Mengambil daftar saat komponen dimuat
  useEffect(() => {
    fetchPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Hanya dijalankan sekali saat mount

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // [ROMBAK V2] Handler untuk membuat promosi baru (POST)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl || !formData.title || !formData.description) {
      onAction('Harap isi semua field (Link Gambar, Judul, Deskripsi).', 'error');
      return;
    }
    if (!formData.imageUrl.startsWith('https://i.imgur.com/')) {
      onAction(
        'Link Gambar tidak valid. Harap gunakan link Imgur (https://i.imgur.com/...).',
        'error',
      );
      return;
    }

    setIsSubmitting(true);
    onAction('Menambahkan promosi...', 'info');

    try {
      const response = await fetch(
        `/api/clan/manage/${clan.id}/promotions`, // Endpoint plural
        {
          method: 'POST', // Method POST
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData), // Kirim data form baru
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menambahkan promosi.');
      }

      onAction('Promosi berhasil ditambahkan!', 'success');
      setFormData({ imageUrl: '', title: '', description: '' }); // Reset form
      await fetchPromotions(); // Muat ulang daftar promosi
      setShowAddForm(false); // [BARU V4] Tutup form setelah berhasil
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // [ROMBAK V2] Handler untuk menghapus promosi spesifik (DELETE by ID)
  const handleDelete = async (promotionId: string) => {
    if (isDeletingId) return; // Mencegah klik ganda

    setIsDeletingId(promotionId); // Set ID yang sedang dihapus
    onAction('Menghapus promosi...', 'info');

    try {
      const response = await fetch(
        `/api/clan/manage/${clan.id}/promotions/${promotionId}`, // Endpoint dengan ID
        {
          method: 'DELETE',
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus promosi.');
      }

      onAction('Promosi berhasil dihapus.', 'success');
      // Update state secara optimis (hapus dari daftar)
      setPromotions((prev) => prev.filter((p) => p.id !== promotionId));
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setIsDeletingId(null); // Selesai menghapus
    }
  };

  return (
    <div className="mx-auto">
      {/* --- [BARU V4] BAGIAN ANALITIK --- */}
      {/* Komponen ini akan menampilkan "memuat" atau "belum ada data" jika array 'promotions' kosong */}
      <PromotionAnalytics promotions={promotions} />

      {/* --- [ROMBAK V4] BAGIAN FORM (SEKARANG KONDISIONAL) --- */}
      <div className="mt-8 max-w-2xl">
        {!showAddForm ? (
          // Tombol untuk menampilkan form
          <Button
            variant="primary"
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto"
            disabled={isLoadingList} // Jangan izinkan tambah jika daftar masih loading
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Buat Promosi Baru
          </Button>
        ) : (
          // Form (dibungkus dalam kartu agar rapi)
          <div className="card-stone p-6 relative">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-2xl font-clash text-coc-gold">
                Tambah Banner Promosi
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Tutup form"
              >
                <XIcon className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-gray-400 font-sans mb-6">
              Banner yang Anda tambahkan akan muncul di carousel halaman Clan Hub
              dan mengarahkan pengguna ke profil klan Anda.
            </p>

            {/* Peringatan Imgur */}
            <div className="mb-6 p-4 rounded-lg bg-coc-yellow/10 border border-coc-yellow/30 flex items-start gap-3">
              <AlertTriangleIcon className="h-6 w-6 text-coc-yellow flex-shrink-0 mt-0.5" />
              <div className="font-sans">
                <h4 className="font-bold text-coc-yellow">
                  Perhatian: Link Gambar
                </h4>
                <p className="text-sm text-gray-300">
                  Gunakan link gambar langsung dari{' '}
                  <strong className="text-white">Imgur</strong> (harus diawali
                  dengan{' '}
                  <code className="text-xs bg-black/50 px-1 py-0.5 rounded">
                    https://i.imgur.com/...
                  </code>
                  ).
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-medium text-gray-300 mb-1 font-sans"
                >
                  Link Gambar (Imgur)
                </label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="text"
                  placeholder="https://i.imgur.com/xxxxxx.png"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className="font-sans"
                />
              </div>

              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-300 mb-1 font-sans"
                >
                  Judul (Hanya untuk referensi Anda)
                </label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Rekrutmen TH 15-16 Dibuka!"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  maxLength={50}
                  className="font-sans"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-300 mb-1 font-sans"
                >
                  Deskripsi Singkat (Hanya untuk referensi Anda)
                </label>
                <Input
                  id="description"
                  name="description"
                  type="text"
                  placeholder="Klan kami mencari pemain aktif untuk CWL."
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  maxLength={100}
                  className="font-sans"
                />
              </div>

              <div className="pt-4 border-t border-coc-gold-dark/20 flex items-center gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UploadIcon className="h-4 w-4 mr-2" />
                  )}
                  {isSubmitting ? 'Menambahkan...' : 'Tambah Promosi'}
                </Button>
                <Button
                  type="button" // Pastikan tipe "button" agar tidak submit form
                  variant="secondary"
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* --- BAGIAN DAFTAR PROMOSI --- */}
      <div className="mt-12 pt-6 border-t border-coc-gold-dark/30">
        <h3 className="text-xl font-clash text-coc-gold mb-4">
          Daftar Promosi Aktif
        </h3>
        {isLoadingList ? (
          <div className="flex justify-center items-center py-10">
            <RefreshCwIcon className="h-6 w-6 text-coc-gold animate-spin" />
            <p className="ml-3 text-gray-400">Memuat daftar promosi...</p>
          </div>
        ) : promotions.length === 0 ? (
          <p className="text-gray-500 font-sans text-center py-10">
            Anda belum memiliki promosi aktif.
          </p>
        ) : (
          <div className="space-y-4">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-coc-dark/60 rounded-lg border border-coc-gold-dark/30"
              >
                <Image
                  src={promo.imageUrl}
                  alt={promo.title}
                  width={128} // 16:9 aspect ratio (128 / 72)
                  height={72}
                  className="rounded-md object-cover w-full sm:w-32 h-auto sm:h-[72px] flex-shrink-0 border-2 border-coc-gold-dark/50"
                  unoptimized // Karena ini link eksternal (Imgur)
                />
                <div className="flex-grow text-center sm:text-left">
                  <h4 className="text-lg font-clash text-white">
                    {promo.title}
                  </h4>
                  <p className="text-sm text-gray-400 font-sans line-clamp-2">
                    {promo.description}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-coc-gold mt-2">
                    <ThumbsUpIcon className="h-4 w-4" />
                    <span className="text-sm font-sans font-bold">
                      {/* [EDIT V3 - TUGAS 5.1] Menggunakan totalClicks */}
                      {promo.totalClicks} Total Klik
                    </span>
                  </div>
                  {/* [BARU V3] Tampilkan rincian klik per TH */}
                  {promo.clicksByTH &&
                    Object.keys(promo.clicksByTH).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                        {Object.entries(promo.clicksByTH)
                          .sort((a, b) => {
                            // Sortir descending berdasarkan TH numerik, 'unknown' di akhir
                            const thA =
                              a[0] === 'unknown' ? 0 : parseInt(a[0]);
                            const thB =
                              b[0] === 'unknown' ? 0 : parseInt(b[0]);
                            return thB - thA;
                          })
                          .map(([th, count]) => (
                            <span
                              key={th}
                              className="text-xs font-sans bg-coc-dark px-2 py-0.5 rounded-full text-gray-300 border border-coc-gold-dark/50"
                            >
                              TH {th}:{' '}
                              <strong className="text-white">{count}</strong>
                            </span>
                          ))}
                      </div>
                    )}
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full sm:w-auto flex-shrink-0"
                  onClick={() => handleDelete(promo.id)}
                  disabled={isDeletingId === promo.id}
                >
                  {isDeletingId === promo.id ? (
                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                  <span className="ml-2 sm:hidden lg:inline-block">Hapus</span>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionTabContent;