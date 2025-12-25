'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/Button';
import {
  Loader2Icon as Spinner,
  StarIcon as Star,
  AlertTriangleIcon as AlertCircle,
  MessageSquareIcon,
  CheckIcon,
  ArrowLeftIcon
} from '@/app/components/icons';

function NewReviewPageWrapper() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <NewReviewPage />
    </Suspense>
  );
}

const LoadingSpinner = () => (
  <div className="flex flex-col justify-center items-center min-h-[60vh] gap-4">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 bg-coc-gold/20 rounded-full animate-ping opacity-75"></div>
      <div className="relative flex items-center justify-center w-full h-full">
         <Spinner className="animate-spin text-coc-gold" width={32} height={32} />
      </div>
    </div>
    <p className="text-gray-400 font-clash tracking-wide animate-pulse">Memuat...</p>
  </div>
);

function NewReviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();

  const [reviewType, setReviewType] = useState<'clan' | 'player' | null>(null);
  const [targetId, setTargetId] = useState<string | null>(null);
  const [targetName, setTargetName] = useState<string | null>(null);
  const [clanId, setClanId] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewContext, setReviewContext] = useState<'clan' | 'esports'>('clan');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const type = searchParams.get('type');
    const id = searchParams.get('id');
    const name = searchParams.get('name');
    const cId = searchParams.get('clanId');

    if (type === 'clan' || type === 'player') {
      setReviewType(type);
    } else {
      setError('Tipe ulasan tidak valid.');
    }

    if (id) setTargetId(id);
    if (name) setTargetName(decodeURIComponent(name));
    if (cId) setClanId(cId);
  }, [searchParams]);

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
      };

      if (reviewType === 'clan') {
        apiUrl = '/api/reviews/clan';
        payload.targetClanId = targetId;
      } else {
        apiUrl = '/api/reviews/player';
        payload.targetPlayerUid = targetId;
        payload.reviewContext = reviewContext;
        if (clanId) payload.clanId = clanId;
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

      setSuccess('Ulasan berhasil dikirim! Anda mendapat +10 Poin Popularitas.');

      setTimeout(() => {
        if (reviewType === 'clan' && targetId) {
          router.push(`/clan/internal/${targetId}`);
        } else if (reviewType === 'player') {
          router.push(`/profile`);
        } else {
          router.push('/');
        }
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan.');
    } finally {
      setIsLoading(false);
    }
  };

  const StarRating = () => (
    <div className="flex gap-2 justify-center py-4">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          type="button"
          key={star}
          className="group focus:outline-none transition-transform duration-200 hover:scale-110 active:scale-95"
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
          onClick={() => setRating(star)}
        >
          <Star
            width={40}
            height={40}
            className={`transition-colors duration-300 ${
              (hoverRating || rating) >= star
                ? 'text-coc-gold fill-coc-gold drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]'
                : 'text-gray-600 fill-transparent'
            }`}
          />
        </button>
      ))}
    </div>
  );

  // --- Render Logic ---

  // 1. Error State (Missing Params)
  if ((!reviewType || !targetId || !targetName) && error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] p-4">
        <div className="bg-black/40 backdrop-blur-md border border-red-500/30 p-8 rounded-2xl text-center max-w-md w-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-coc-red" />
          <div className="w-16 h-16 bg-coc-red/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-coc-red/30">
             <AlertCircle className="text-coc-red" width={32} height={32} />
          </div>
          <h1 className="text-2xl font-clash text-white mb-2">Terjadi Kesalahan</h1>
          <p className="text-gray-400 mb-6 leading-relaxed">{error}</p>
          <Button variant="outline" size="md" className="w-full border-white/10 hover:bg-white/5" href="/">
            <ArrowLeftIcon className="mr-2 h-4 w-4" /> Kembali ke Beranda
          </Button>
        </div>
      </div>
    );
  }

  // 2. Loading Initial State
  if (!reviewType || !targetId || !targetName) {
    return <LoadingSpinner />;
  }

  // 3. Success State
  if (success) {
    return (
      <div className="flex justify-center items-center min-h-[60vh] p-4">
        <div className="bg-black/40 backdrop-blur-md border border-coc-green/30 p-8 rounded-2xl text-center max-w-md w-full shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-coc-green" />
          {/* Confetti / Glow Effect */}
          <div className="absolute inset-0 bg-coc-green/5 blur-xl rounded-full scale-150 animate-pulse pointer-events-none" />
          
          <div className="w-20 h-20 bg-coc-green/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-coc-green/30 relative z-10">
             <CheckIcon className="text-coc-green" width={40} height={40} />
          </div>
          <h1 className="text-3xl font-clash text-white mb-2 relative z-10">Terima Kasih!</h1>
          <p className="text-gray-300 mb-6 leading-relaxed relative z-10">{success}</p>
          <div className="flex justify-center relative z-10">
             <Spinner className="animate-spin text-coc-green" width={24} height={24} />
          </div>
          <p className="text-xs text-gray-500 mt-4 relative z-10">Mengalihkan halaman...</p>
        </div>
      </div>
    );
  }

  // 4. Main Form
  return (
    <div className="min-h-screen bg-coc-dark text-white font-clash relative overflow-x-hidden flex items-center justify-center p-4">
      {/* Background Glows */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-coc-blue/10 via-transparent to-transparent pointer-events-none z-0" />
      <div className="fixed bottom-0 right-0 w-[300px] h-[300px] bg-coc-gold/5 blur-[100px] rounded-full pointer-events-none z-0" />

      <main className="w-full max-w-lg relative z-10">
        <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 tracking-wide flex items-center justify-center gap-2">
              <MessageSquareIcon className="h-8 w-8 text-coc-gold" /> Beri Ulasan
            </h1>
            <p className="text-gray-400 text-sm md:text-base">
              Bagikan pengalaman Anda dengan <span className="text-white font-bold">{targetName}</span>
            </p>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-8">
            
            {/* 1. Rating */}
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
              <label className="block text-xs font-bold text-coc-gold uppercase tracking-widest mb-1">
                Rating Keseluruhan
              </label>
              <StarRating />
              <p className="text-xs text-gray-500 font-sans h-4">
                {rating === 1 && "Sangat Buruk"}
                {rating === 2 && "Buruk"}
                {rating === 3 && "Cukup"}
                {rating === 4 && "Bagus"}
                {rating === 5 && "Luar Biasa!"}
              </p>
            </div>

            {/* 2. Context (Player Only) */}
            {reviewType === 'player' && (
              <div className="space-y-3">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest">
                  Konteks Ulasan
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <label 
                    className={`cursor-pointer rounded-xl p-3 border text-center transition-all duration-200 ${
                      reviewContext === 'clan' 
                        ? 'bg-coc-gold/20 border-coc-gold text-white' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="context"
                      value="clan"
                      checked={reviewContext === 'clan'}
                      onChange={() => setReviewContext('clan')}
                      className="sr-only"
                    />
                    <span className="font-bold text-sm">Aktivitas Klan</span>
                  </label>
                  <label 
                    className={`cursor-pointer rounded-xl p-3 border text-center transition-all duration-200 ${
                      reviewContext === 'esports' 
                        ? 'bg-coc-gold/20 border-coc-gold text-white' 
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="context"
                      value="esports"
                      checked={reviewContext === 'esports'}
                      onChange={() => setReviewContext('esports')}
                      className="sr-only"
                    />
                    <span className="font-bold text-sm">E-Sports</span>
                  </label>
                </div>
              </div>
            )}

            {/* 3. Comment */}
            <div className="space-y-2">
              <label 
                htmlFor="comment" 
                className="block text-xs font-bold text-gray-500 uppercase tracking-widest"
              >
                Komentar Anda
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-coc-gold/50 focus:border-coc-gold transition-all resize-none font-sans"
                placeholder={`Ceritakan pengalaman Anda secara jujur dan sopan...`}
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full shadow-lg shadow-coc-gold/10 font-bold tracking-wide"
                disabled={isLoading || !currentUser}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <Spinner className="animate-spin" width={20} height={20} />
                    <span>Mengirim...</span>
                  </div>
                ) : (
                  'Kirim Ulasan (+10 Poin)'
                )}
              </Button>
              {!currentUser && (
                <p className="text-coc-red text-center text-xs mt-3 font-sans">
                  * Anda harus login terlebih dahulu.
                </p>
              )}
            </div>

          </form>
        </div>
      </main>
    </div>
  );
}

export default NewReviewPageWrapper;