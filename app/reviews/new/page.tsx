'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
// Menggunakan ikon dari file icons.tsx yang sudah ada
import {
  Loader2Icon as Spinner, // Menggunakan Loader2Icon sebagai Spinner
  StarIcon as Star, // Menggunakan StarIcon
  AlertTriangleIcon as AlertCircle, // Menggunakan AlertTriangleIcon untuk error
} from '@/app/components/icons';

// Wrapper Suspense untuk mengakses searchParams
function NewReviewPageWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NewReviewPage />
    </Suspense>
  );
}

// Komponen Spinner
const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-[50vh]">
    {/* PERBAIKAN: Mengganti size={64} dengan width={64} dan height={64} */}
    <Spinner className="animate-spin text-coc-gold" width={64} height={64} />
  </div>
);

// Komponen utama halaman
function NewReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth(); // Mengambil user yang sedang login

  // Mengambil parameter dari URL
  const [reviewType, setReviewType] = useState<'clan' | 'player' | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string | null>(null);
  const [clanId, setClanId] = useState<string | null>(null); // Untuk konteks ulasan pemain

  // State untuk form
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  // State untuk 'reviewContext' TAHAP 2.4
  const [reviewContext, setReviewContext] = useState<'clan' | 'esports'>('clan');

  // State untuk UI
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Membaca parameter dari URL saat komponen dimuat
    const type = searchParams.get('type');
    // [PERBAIKAN SINKRONISASI] Mengubah 'targetId' -> 'id'
    const id = searchParams.get('id');
    // [PERBAIKAN SINKRONISASI] Mengubah 'targetName' -> 'name'
    const name = searchParams.get('name');
    const cId = searchParams.get('clanId'); // Opsional, untuk PlayerReview

    if (type === 'clan' || type === 'player') {
      setReviewType(type);
    } else {
      setError('Tipe ulasan tidak valid.');
    }

    if (id) setTargetId(id);
    if (name) setTargetName(decodeURIComponent(name)); // Dekode nama dari URL
    if (cId) setClanId(cId);
  }, [searchParams]);

  // Handler untuk submit form
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Anda harus login untuk memberi ulasan.');
      return;
    }
    if (rating === 0) {
      setError('Rating bintang tidak boleh kosong.');
      return;
    }
    if (!comment.trim()) {
      setError('Komentar tidak boleh kosong.');
      return;
    }
    if (!targetId || !reviewType) {
      setError('Data target ulasan tidak ditemukan. Silakan kembali.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let apiUrl = '';
      let payload: any = {
        rating,
        comment,
        // 'targetId' di sini adalah variabel state, yang bisa jadi clanId atau playerUid
        // 'authorUid' dan 'authorName' akan diambil dari sesi di backend
      };

      // Menentukan API endpoint dan payload berdasarkan tipe ulasan
      if (reviewType === 'clan') {
        apiUrl = '/api/reviews/clan';
        payload.targetClanId = targetId;
      } else {
        // Tipe 'player'
        apiUrl = '/api/reviews/player';
        payload.targetPlayerUid = targetId; // targetId di sini adalah UID (sesuai perbaikan)
        payload.reviewContext = reviewContext;
        if (clanId) payload.clanId = clanId;
        // Nanti kita tambahkan 'esportsTeamId' jika reviewContext === 'esports'
      }

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Gagal mengirim ulasan.');
      }

      // Sesuai TAHAP 2.4, API akan memberi +10 poin
      setSuccess('Ulasan berhasil dikirim! Anda mendapat +10 Poin Popularitas.');

      // Redirect setelah sukses
      setTimeout(() => {
        // Kembali ke halaman profil target (jika ada) atau halaman utama
        if (reviewType === 'clan' && targetId) { // targetId di sini adalah clanId
          router.push(`/clan/internal/${targetId}`);
        } else if (reviewType === 'player') {
          router.push(`/profile`); // Asumsi kembali ke profil sendiri
        } else {
          router.push('/');
        }
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  // Komponen Bintang
  const StarRating = () => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          width={32}
          height={32}
          className={`cursor-pointer ${
            (hoverRating || rating) >= star
              ? 'text-coc-gold fill-coc-gold'
              : 'text-gray-600'
          }`}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );

  // Jika parameter URL belum siap
  if (!reviewType || !targetId || !targetName) {
    if (error) {
      return (
        <div className="container mx-auto max-w-2xl py-12 px-4 text-center">
          {/* PERBAIKAN: Mengganti size={48} dengan width={48} dan height={48} */}
          <AlertCircle className="mx-auto text-coc-red" width={48} height={48} />
          <h1 className="text-2xl font-clash text-coc-red mt-4">Error</h1>
          <p className="text-lg mt-2">{error}</p>
          <Button variant="primary" size="md" className="mt-6" href="/">
            Kembali ke Beranda
          </Button>
        </div>
      );
    }
    return <LoadingSpinner />;
  }

  // Jika sudah sukses
  if (success) {
    return (
      <div className="container mx-auto max-w-2xl py-12 px-4 text-center">
        <h1 className="text-3xl font-clash text-coc-gold mb-4">
          Ulasan Terkirim!
        </h1>
        <p className="text-lg mt-2">{success}</p>
        <LoadingSpinner />
      </div>
    );
  }

  // Tampilan Form Utama
  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
      <h1 className="text-3xl font-clash text-coc-gold mb-2">Beri Ulasan</h1>
      <p className="text-lg text-gray-300 mb-6">
        Anda sedang mengulas:{' '}
        <strong className="font-bold text-white">{targetName}</strong> (
        {reviewType === 'clan' ? 'Klan' : 'Pemain'})
      </p>

      <form onSubmit={handleSubmitReview} className="space-y-6">
        {/* 1. Rating Bintang */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Rating Keseluruhan
          </label>
          <StarRating />
        </div>

        {/* 2. Konteks (Hanya untuk ulasan pemain) - TAHAP 2.4 */}
        {reviewType === 'player' && (
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Konteks Ulasan
            </label>
            <div className="flex gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="context"
                  value="clan"
                  checked={reviewContext === 'clan'}
                  onChange={() => setReviewContext('clan')}
                  className="form-radio text-coc-gold focus:ring-coc-gold"
                />
                <span className="text-white">Aktivitas Klan</span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="context"
                  value="esports"
                  checked={reviewContext === 'esports'}
                  onChange={() => setReviewContext('esports')}
                  className="form-radio text-coc-gold focus:ring-coc-gold"
                />
                <span className="text-white">Performa E-Sports</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Pilih konteks ulasan ini (misal: 'Aktivitas Klan' untuk
              partisipasi war/raid, atau 'E-Sports' untuk turnamen).
            </p>
          </div>
        )}

        {/* 3. Komentar */}
        <div>
          <label
            htmlFor="comment"
            className="block text-sm font-medium text-gray-300"
          >
            Komentar Ulasan
          </label>
          <textarea
            id="comment"
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="mt-1 block w-full bg-coc-dark-blue border border-coc-stone-light/50 rounded-md shadow-sm text-white p-3 focus:ring-coc-gold focus:border-coc-gold"
            placeholder={`Tuliskan ulasan Anda untuk ${targetName}...`}
            disabled={isLoading}
          />
        </div>

        {/* 4. Error & Tombol Submit */}
        {error && (
          <div className="text-coc-red p-3 bg-coc-red/10 border border-coc-red/50 rounded-md">
            {error}
          </div>
        )}

        <div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={isLoading || !currentUser}
          >
            {isLoading ? (
              /* PERBAIKAN: Menambahkan width/height ke spinner di tombol */
              <Spinner className="animate-spin mx-auto" width={24} height={24} />
            ) : (
              'Kirim Ulasan (+10 Poin)'
            )}
          </Button>
          {!currentUser && (
            <p className="text-coc-red text-center text-sm mt-2">
              Anda harus login untuk mengirim ulasan.
            </p>
          )}
        </div>
      </form>
    </div>
  );
}

export default NewReviewPageWrapper;