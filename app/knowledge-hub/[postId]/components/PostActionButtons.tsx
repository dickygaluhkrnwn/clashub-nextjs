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
  ThumbsUpIcon, // Menggunakan ThumbsUpIcon yang sudah ada di library ikon utama
  SaveIcon,
  CheckIcon
} from '@/app/components/icons';
import { ServerUser } from '@/lib/server-auth';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/lib/hooks/useLanguage';

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
  const { t } = useLanguage(); 
  
  const [notification, setNotification] = useState<NotificationProps | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationProps | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

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

  // Handler Share Link
  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
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

      <div className="flex flex-wrap justify-between items-center gap-4">
        
        {/* Group Kiri: Social Actions (Like & Share) */}
        <div className="flex gap-3">
          <Button
            variant={isLiked ? 'primary' : 'outline'}
            size="sm"
            onClick={handleLike}
            disabled={isLiking || authLoading || !sessionUser}
            className={`flex items-center gap-2 border transition-all duration-300 ${
              isLiked
                ? 'bg-coc-gold/10 text-coc-gold border-coc-gold/30 shadow-lg shadow-coc-gold/10 hover:bg-coc-gold/20'
                : 'text-gray-400 border-white/10 hover:text-white hover:bg-white/5'
            }`}
          >
            {isLiking ? (
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
            ) : (
              <ThumbsUpIcon
                className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`}
              />
            )}
            <span className="font-bold">{likes.length}</span> 
            <span className="hidden sm:inline">{t.knowledgeHub.detail.meta.likes}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleShare}
            className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          >
            {isCopied ? <CheckIcon className="mr-2 h-4 w-4 text-green-400" /> : <SaveIcon className="mr-2 h-4 w-4" />}
            {isCopied ? 'Link Copied!' : t.knowledgeHub.detail.actions.share}
          </Button>
        </div>

        {/* Group Kanan: Author Actions (Edit & Delete) */}
        {isAuthor && (
          <div className="flex gap-3">
            <Button
              href={`/knowledge-hub/create?postId=${postId}`}
              variant="secondary"
              size="sm"
              className="border-coc-blue/30 text-coc-blue hover:bg-coc-blue/10 transition-colors"
            >
              <EditIcon className="mr-2 h-4 w-4" /> {t.knowledgeHub.detail.actions.edit}
            </Button>

            <Button
              onClick={confirmDelete}
              variant="secondary"
              size="sm"
              disabled={isDeleting}
              className="bg-coc-red/10 border-coc-red/30 text-coc-red hover:bg-coc-red/20 transition-colors"
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