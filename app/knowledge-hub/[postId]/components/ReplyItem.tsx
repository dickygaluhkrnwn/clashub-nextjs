'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Reply } from '@/lib/clashub.types';
import { formatDistanceToNowStrict } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useAuth } from '@/app/context/AuthContext';
// [FIX] Hapus ReplyIcon dari import karena menyebabkan error
import { TrashIcon, RefreshCwIcon } from '@/app/components/icons';

// [FIX] Definisikan Icon Reply secara lokal/inline agar mandiri dan tidak error
const ReplyIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
  </svg>
);

// Definisikan props untuk komponen ini
interface ReplyItemProps {
  reply: Reply;
  postId: string; // [FIX] Tambahkan postId sebagai prop (wajib) karena tidak ada di objek Reply
}

/**
 * @component ReplyItem
 * Menampilkan satu item balasan/komentar dengan dukungan i18n dan aksi.
 */
const ReplyItem: React.FC<ReplyItemProps> = ({ reply, postId }) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  
  // State lokal untuk handling delete
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false); // Untuk menyembunyikan item setelah dihapus

  // Cek apakah user yang login adalah pemilik komentar ini
  const isOwner = currentUser?.uid === reply.authorId;

  // Konversi timestamp (string ISO atau objek Timestamp) menjadi objek Date
  const formattedTimeAgo = useMemo(() => {
    try {
      let date: Date;
      // Handle tipe data yang mungkin berbeda dari Firestore/API
      if (typeof reply.createdAt === 'string') {
        date = new Date(reply.createdAt);
      } else if (reply.createdAt && typeof (reply.createdAt as any).toDate === 'function') {
        date = (reply.createdAt as any).toDate();
      } else {
        date = new Date(); // Fallback aman
      }
      
      if (isNaN(date.getTime())) {
        return t.knowledgeHub.detail.meta.invalidDate;
      }
      
      const locale = language === 'id' ? idLocale : enUS;
      return formatDistanceToNowStrict(date, { addSuffix: true, locale });
    } catch (error) {
      console.error("Error formatting reply date:", error);
      return t.knowledgeHub.detail.meta.invalidDate;
    }
  }, [reply.createdAt, language, t.knowledgeHub.detail.meta.invalidDate]);

  // Handler Delete
  const handleDelete = async () => {
    if (!confirm(t.knowledgeHub.detail.comments.deleteConfirmation)) return;

    setIsDeleting(true);
    try {
      // [FIX] Gunakan 'postId' dari props, bukan dari reply.postId
      const response = await fetch(`/api/posts/${postId}/replies?replyId=${reply.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error("Gagal menghapus");
      }

      // Jika sukses, sembunyikan item (Optimistic update lokal)
      setIsDeleted(true);
    } catch (error) {
      console.error("Failed to delete reply:", error);
      alert(t.knowledgeHub.detail.messages.serverError);
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler Reply (UI Only - Scroll ke form utama)
  const handleReplyClick = () => {
    const commentBox = document.getElementById('comments');
    if (commentBox) {
      commentBox.scrollIntoView({ behavior: 'smooth' });
      // Opsional: Focus ke textarea jika bisa diakses
      const textarea = commentBox.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        textarea.value = `@${reply.authorName} `; // Mention user
      }
    }
  };

  // Jika sudah dihapus, jangan render apa-apa
  if (isDeleted) return null;

  return (
    <div className="flex gap-4 p-4 bg-coc-stone/50 rounded-lg border-l-4 border-coc-gold-dark/30 hover:bg-coc-stone/70 transition-colors group">
      {/* Avatar Penulis */}
      <Link href={`/player/${reply.authorId}`} className="flex-shrink-0">
        <Image
          src={reply.authorAvatarUrl || '/images/placeholder-avatar.png'}
          alt={`${reply.authorName}'s avatar`}
          width={40}
          height={40}
          className="rounded-full border-2 border-coc-gold/50 object-cover w-10 h-10"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/images/placeholder-avatar.png'; // Fallback
          }}
        />
      </Link>
      
      {/* Konten Balasan */}
      <div className="flex-grow">
        <div className="flex justify-between items-start">
            <div>
                <Link
                href={`/player/${reply.authorId}`}
                className="font-bold text-coc-gold hover:text-white text-md mr-2"
                >
                {reply.authorName}
                </Link>
                <span className="text-xs text-gray-500">
                {formattedTimeAgo}
                </span>
            </div>
            
            {/* Tombol Aksi (Hanya muncul saat hover di desktop) */}
            <div className="flex gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                <button 
                    onClick={handleReplyClick}
                    className="text-gray-400 hover:text-coc-gold p-1"
                    title={t.knowledgeHub.detail.actions.reply}
                >
                    <ReplyIcon className="h-4 w-4" />
                </button>
                
                {isOwner && (
                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-gray-400 hover:text-coc-red p-1 disabled:opacity-50"
                        title={t.knowledgeHub.detail.actions.delete}
                    >
                        {isDeleting ? (
                            <RefreshCwIcon className="h-4 w-4 animate-spin" />
                        ) : (
                            <TrashIcon className="h-4 w-4" />
                        )}
                    </button>
                )}
            </div>
        </div>

        <p className="text-gray-300 text-sm mt-1 font-sans whitespace-pre-wrap leading-relaxed">
          {reply.content}
        </p>
      </div>
    </div>
  );
};

export default ReplyItem;