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
  ThumbsUpIcon,
  SaveIcon,
  CheckIcon,
  ShareIcon
} from '@/app/components/icons';
import { ServerUser } from '@/lib/server-auth';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface PostActionButtonsProps {
  postId: string;
  isAuthor: boolean;
  initialLikes: string[];
  sessionUser: ServerUser | null;
}

/**
 * @component PostActionButtons
 * Menangani logika like, edit, dan delete postingan.
 * Desain: Gaming Control Bar.
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

  const showNotification = (
    message: string,
    type: NotificationProps['type'],
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const confirmDelete = () => {
    setConfirmation({
      message: t.knowledgeHub.detail.postManagement.deleteConfirmation,
      confirmText: t.knowledgeHub.detail.postManagement.deleteConfirmButton,
      cancelText: t.knowledgeHub.detail.postManagement.deleteCancelButton,
      onConfirm: handleDelete,
      onCancel: () => setConfirmation(null),
    });
  };

  const handleDelete = async () => {
    setConfirmation(null);
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
      setTimeout(() => router.push('/knowledge-hub'), 1500);
    } catch (err) {
      const errorMessage =
        (err as Error).message || t.knowledgeHub.detail.postManagement.deleteError;
      showNotification(errorMessage, 'error');
      setIsDeleting(false);
    }
  };

  const handleLike = async () => {
    if (isLiking || authLoading) return;

    if (!userProfile?.uid) {
      showNotification(t.knowledgeHub.detail.postManagement.likeLoginError, 'warning');
      return;
    }

    setIsLiking(true);
    const currentUid = userProfile.uid;

    if (isLiked) {
      setLikes((prev) => prev.filter((uid) => uid !== currentUid));
    } else {
      setLikes((prev) => [...prev, currentUid]);
    }

    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || t.knowledgeHub.detail.postManagement.likeError);
      }

      const newIsLiked = !isLiked;
      if (result.newLikeStatus !== newIsLiked) {
        setLikes(initialLikes);
      }
    } catch (err) {
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
      {notification && <Notification notification={notification} />}
      {confirmation && <Notification confirmation={confirmation} />}

      <div className="flex flex-col sm:flex-row flex-wrap justify-between items-center gap-4 bg-[#0a0a0b]/40 p-4 rounded-2xl border border-white/5">
        
        {/* Group Kiri: Social Actions (Like & Share) */}
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={handleLike}
            disabled={isLiking || authLoading}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl transition-all duration-300 font-bold tracking-wide group ${
              isLiked
                ? 'bg-coc-gold text-black shadow-[0_0_20px_rgba(255,215,0,0.4)] scale-105 border border-yellow-300'
                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
            }`}
          >
            {isLiking ? (
              <RefreshCwIcon className="h-5 w-5 animate-spin" />
            ) : (
              <ThumbsUpIcon
                className={`h-5 w-5 transition-transform group-hover:scale-110 ${isLiked ? 'fill-current' : ''}`}
              />
            )}
            <span>{likes.length}</span> 
            <span className="hidden sm:inline uppercase text-xs ml-1">{t.knowledgeHub.detail.meta.likes}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-all hover:border-white/20 active:scale-95 font-bold"
          >
            {isCopied ? <CheckIcon className="h-5 w-5 text-coc-green" /> : <ShareIcon className="h-5 w-5" />}
            <span className="uppercase text-xs tracking-wide">{isCopied ? 'COPIED' : t.knowledgeHub.detail.actions.share}</span>
          </button>
        </div>

        {/* Group Kanan: Author Actions (Edit & Delete) */}
        {isAuthor && (
          <div className="flex gap-3 w-full sm:w-auto border-t sm:border-t-0 border-white/5 pt-4 sm:pt-0">
            <Button
              href={`/knowledge-hub/create?postId=${postId}`}
              variant="secondary"
              size="sm"
              className="flex-1 sm:flex-none border-coc-blue/30 text-coc-blue hover:bg-coc-blue/10 transition-colors shadow-none"
            >
              <EditIcon className="mr-2 h-4 w-4" /> {t.knowledgeHub.detail.actions.edit}
            </Button>

            <Button
              onClick={confirmDelete}
              variant="danger"
              size="sm"
              disabled={isDeleting}
              className="flex-1 sm:flex-none shadow-none bg-coc-red/10 border border-coc-red/30 text-coc-red hover:bg-coc-red/20"
            >
              {isDeleting ? (
                <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrashIcon className="h-4 w-4 mr-2" />
              )}
              {isDeleting ? 'Deleting...' : t.knowledgeHub.detail.actions.delete}
            </Button>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default PostActionButtons;