'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link'; // [FIX] Menambahkan impor Link yang hilang
import { Button } from '@/app/components/ui/Button';
import Notification, {
  NotificationProps,
} from '@/app/components/ui/Notification';
import { PaperPlaneIcon, RefreshCwIcon } from '@/app/components/icons';
import { useAuth } from '@/app/context/AuthContext';
import { Reply } from '@/lib/clashub.types';
import ReplyItem from './ReplyItem'; // Komponen yang kita buat sebelumnya

// Definisikan props
interface ReplySectionProps {
  postId: string;
  initialReplyCount: number; // Jumlah awal dari server
}

/**
 * @component ReplySection
 * Menangani seluruh logika untuk form balasan dan daftar balasan.
 */
const ReplySection: React.FC<ReplySectionProps> = ({
  postId,
  initialReplyCount,
}) => {
  const { userProfile, loading: authLoading } = useAuth(); // Dapatkan status auth

  // State untuk daftar balasan
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyCount, setReplyCount] = useState(initialReplyCount);

  // State untuk form
  const [newReplyContent, setNewReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk UI
  const [isLoading, setIsLoading] = useState(true); // Loading untuk fetch awal
  const [notification, setNotification] = useState<NotificationProps | null>(
    null,
  );

  // Helper untuk notifikasi
  const showNotification = (
    message: string,
    type: NotificationProps['type'],
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  // 1. Fetch balasan saat komponen dimuat
  useEffect(() => {
    const fetchReplies = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/posts/${postId}/replies`);
        if (!response.ok) {
          throw new Error('Gagal mengambil balasan');
        }
        const data: Reply[] = await response.json();
        setReplies(data);
        setReplyCount(data.length); // Update count dari data aktual
      } catch (err) {
        const errorMessage =
          (err as Error).message || 'Terjadi kesalahan server.';
        showNotification(errorMessage, 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReplies();
  }, [postId]); // Jalankan jika postId berubah

  // 2. Handler untuk submit form balasan baru
  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authLoading) return; // Jangan lakukan apa-apa jika auth masih loading
    if (!userProfile) {
      showNotification('Anda harus login untuk membalas', 'error');
      return;
    }
    if (newReplyContent.trim().length === 0) {
      showNotification('Balasan tidak boleh kosong', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newReplyContent.trim() }),
      });

      // [FIX] Ambil data JSON terlebih dahulu
      const responseData = await response.json();

      // [FIX] Cek response.ok. Jika tidak ok, responseData adalah { error: '...' }
      if (!response.ok) {
        // Sekarang 'responseData.error' aman diakses
        throw new Error(responseData.error || 'Gagal mengirim balasan');
      }

      // [FIX] Jika ok, responseData adalah objek Reply
      const newReply: Reply = responseData;

      // 3. Tambahkan balasan baru ke state (Optimistic UI)
      setReplies((prevReplies) => [...prevReplies, newReply]);
      setReplyCount((prevCount) => prevCount + 1); // Tambah counter
      setNewReplyContent(''); // Kosongkan textarea
      setNotification(null); // Hapus notifikasi error (jika ada)
    } catch (err) {
      const errorMessage =
        (err as Error).message || 'Terjadi kesalahan server.';
      showNotification(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Form Balasan
  const renderReplyForm = () => {
    if (authLoading) {
      return (
        <div className="bg-coc-stone/50 p-4 rounded-lg mb-6 text-center text-gray-400">
          Memuat status login...
        </div>
      );
    }

    if (!userProfile) {
      return (
        <div className="bg-coc-stone/50 p-4 rounded-lg mb-6 text-center text-gray-400">
          Silakan{' '}
          {/* [FIX] Komponen Link sekarang dikenali */}
          <Link href="/auth" className="text-coc-gold hover:underline font-bold">
            login
          </Link>{' '}
          untuk mengirim balasan.
        </div>
      );
    }

    return (
      <form
        onSubmit={handleSubmitReply}
        className="bg-coc-stone/50 p-4 rounded-lg mb-6"
      >
        <textarea
          placeholder="Tulis balasan atau pertanyaan Anda di sini..."
          rows={3}
          className="w-full bg-transparent border-b border-coc-gold-dark/50 p-2 text-white focus:outline-none resize-none font-sans"
          value={newReplyContent}
          onChange={(e) => setNewReplyContent(e.target.value)}
          disabled={isSubmitting}
        ></textarea>
        <Button
          variant="primary"
          size="sm"
          type="submit"
          disabled={isSubmitting}
          className="mt-2"
        >
          {isSubmitting ? (
            <RefreshCwIcon className="inline h-4 w-4 mr-2 animate-spin" />
          ) : (
            <PaperPlaneIcon className="inline h-4 w-4 mr-2" />
          )}
          {isSubmitting ? 'Mengirim...' : 'Kirim Balasan'}
        </Button>
      </form>
    );
  };

  // Render Daftar Balasan
  const renderReplyList = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-20">
          <RefreshCwIcon className="h-6 w-6 text-coc-gold animate-spin" />
        </div>
      );
    }

    if (replies.length === 0) {
      return (
        <div className="p-4 bg-coc-stone/50 rounded-lg text-center text-gray-400">
          Belum ada balasan. Jadilah yang pertama!
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {replies.map((reply) => (
          <ReplyItem key={reply.id} reply={reply} />
        ))}
      </div>
    );
  };

  return (
    <div className="mt-10 pt-6 border-t-2 border-coc-gold-dark/30" id="comments">
      {/* Notifikasi untuk error/sukses */}
      {notification && <Notification notification={notification} />}

      <h2 className="text-2xl font-clash border-l-4 border-coc-gold pl-3 mb-6">
        Balasan ({replyCount})
      </h2>

      {/* Area Form Input Balasan (Dinamis) */}
      {renderReplyForm()}

      {/* Daftar Balasan (Dinamis) */}
      {renderReplyList()}
    </div>
  );
};

export default ReplySection;