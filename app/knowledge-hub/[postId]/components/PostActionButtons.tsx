'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import Notification, {
  ConfirmationProps,
  NotificationProps,
} from '@/app/components/ui/Notification';
import {
  EditIcon,
  TrashIcon,
  RefreshCwIcon,
  // HeartIcon, // [HAPUS] Hapus import HeartIcon untuk menghindari error jika tidak ada
} from '@/app/components/icons';
import { ServerUser } from '@/lib/server-auth';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/lib/hooks/useLanguage';

// [FIX] Definisikan Icon Heart secara lokal/inline agar aman
const HeartIcon = ({ className, fill }: { className?: string; fill?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill={fill || "none"} viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

// Definisikan props untuk komponen ini
interface PostActionButtonsProps {
  postId: string;
  isAuthor: boolean;
  initialLikes: string[];
  sessionUser: ServerUser | null;
}

/**
 * @component PostActionButtons
 * Menangani logika like, edit, dan delete postingan dengan dukungan multibahasa.
 */
const PostActionButtons: React.FC<PostActionButtonsProps> = ({
  postId,
  isAuthor,
  initialLikes,
  sessionUser,
}) => {
  const router = useRouter();
  const { t, language } = useLanguage(); // Hook bahasa
  
  const [notification, setNotification] = useState<NotificationProps | null>(
    null,
  );
  const [confirmation, setConfirmation] = useState<ConfirmationProps | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Hooks untuk Fitur Like ---
  const { userProfile, loading: authLoading } = useAuth();
  const [likes, setLikes] = useState<string[]>(initialLikes);
  const [isLiking, setIsLiking] = useState(false);

  // Cek apakah pengguna saat ini (client-side) sudah me-like
  const isLiked = useMemo(() => {
    if (!userProfile?.uid) return false;
    return likes.includes(userProfile.uid);
  }, [likes, userProfile]);

  // Helper untuk menampilkan notifikasi
  const showNotification = (
    message: string,
    type: NotificationProps['type'],
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  // Handler untuk menampilkan konfirmasi sebelum menghapus
  const confirmDelete = () => {
    setConfirmation({
      message: t.knowledgeHub.detail.postManagement.deleteConfirmation,
      confirmText: t.knowledgeHub.detail.postManagement.deleteConfirmButton,
      cancelText: t.knowledgeHub.detail.postManagement.deleteCancelButton,
      onConfirm: handleDelete,
      onCancel: () => setConfirmation(null),
    });
  };

  // Handler penghapusan (memanggil API DELETE)
  const handleDelete = async () => {
    setConfirmation(null); // Tutup modal konfirmasi
    setIsDeleting(true);
    showNotification(t.knowledgeHub.detail.postManagement.deleting, 'info');

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t.knowledgeHub.detail.postManagement.deleteError);
      }

      showNotification(t.knowledgeHub.detail.postManagement.deleteSuccess, 'success');
      // Redirect ke Knowledge Hub setelah berhasil dihapus
      setTimeout(() => router.push('/knowledge-hub'), 1500);
    } catch (err) {
      const errorMessage =
        (err as Error).message || t.knowledgeHub.detail.postManagement.deleteError;
      showNotification(errorMessage, 'error');
      setIsDeleting(false);
    }
  };

  // Handler untuk Like/Unlike (memanggil API POST)
  const handleLike = async () => {
    if (isLiking || authLoading) return;

    if (!userProfile?.uid) {
      showNotification(t.knowledgeHub.detail.postManagement.likeLoginError, 'error');
      return;
    }

    setIsLiking(true);
    const currentUid = userProfile.uid;

    // 1. Optimistic Update
    if (isLiked) {
      setLikes((prev) => prev.filter((uid) => uid !== currentUid));
    } else {
      setLikes((prev) => [...prev, currentUid]);
    }

    // 2. Panggil API di background
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t.knowledgeHub.detail.postManagement.likeError);
      }

      // Sukses: Cek sinkronisasi
      const newIsLiked = !isLiked;
      if (result.newLikeStatus !== newIsLiked) {
        // Revert jika tidak sinkron
        setLikes(initialLikes);
      }
    } catch (err) {
      // 3. Revert state jika gagal
      setLikes(initialLikes);
      const errorMessage =
        (err as Error).message || t.knowledgeHub.detail.postManagement.likeError;
      showNotification(errorMessage, 'error');
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <React.Fragment>
      {/* Notifikasi / Konfirmasi (Modal) */}
      {notification && <Notification notification={notification} />}
      {confirmation && <Notification confirmation={confirmation} />}

      <div className="flex justify-between items-center gap-4 pt-4 border-t border-coc-gold-dark/20">
        
        {/* Tombol Like (Sisi Kiri) */}
        <div>
          <Button
            variant={isLiked ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleLike}
            disabled={isLiking || authLoading || !sessionUser}
            className={`flex items-center gap-2 ${
              isLiked
                ? 'bg-coc-red/90 border-coc-red text-white hover:bg-coc-red'
                : ''
            }`}
          >
            {isLiking ? (
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
            ) : (
              <HeartIcon
                className="h-4 w-4"
                fill={isLiked ? 'currentColor' : 'none'}
              />
            )}
            {/* Gunakan variabel bahasa untuk 'Suka' / 'Likes' */}
            <span>{likes.length} {t.knowledgeHub.detail.meta.likes}</span>
          </Button>
        </div>

        {/* Tombol Aksi Penulis (Sisi Kanan) */}
        {isAuthor && (
          <div className="flex justify-end gap-4">
            {/* Tombol Edit */}
            <Button
              href={`/knowledge-hub/create?postId=${postId}`}
              variant="secondary"
              size="sm"
              className={
                isDeleting
                  ? 'opacity-50 cursor-not-allowed pointer-events-none'
                  : ''
              }
            >
              <EditIcon className="h-4 w-4 mr-2" /> {t.knowledgeHub.detail.actions.edit}
            </Button>

            {/* Tombol Hapus */}
            <Button
              onClick={confirmDelete}
              variant="secondary"
              size="sm"
              disabled={isDeleting}
              className="bg-coc-red/70 border-coc-red text-white hover:bg-coc-red"
            >
              {isDeleting ? (
                <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrashIcon className="h-4 w-4 mr-2" />
              )}
              {isDeleting ? t.knowledgeHub.detail.postManagement.deleting : t.knowledgeHub.detail.actions.delete}
            </Button>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default PostActionButtons;