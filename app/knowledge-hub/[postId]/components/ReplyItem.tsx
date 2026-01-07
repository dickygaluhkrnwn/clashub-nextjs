'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Reply } from '@/lib/clashub.types';
import { formatDistanceToNowStrict } from 'date-fns';
import { id as idLocale, enUS } from 'date-fns/locale';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { useAuth } from '@/app/context/AuthContext';
import { TrashIcon, RefreshCwIcon, MessageSquareIcon, UserCircleIcon } from '@/app/components/icons';

interface ReplyItemProps {
  reply: Reply;
  postId: string;
  onReply: (authorName: string) => void;
}

/**
 * @component ReplyItem
 * Menampilkan satu item balasan/komentar.
 * Desain: Modern Chat Bubble.
 */
const ReplyItem: React.FC<ReplyItemProps> = ({ reply, postId, onReply }) => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleted, setIsDeleted] = useState(false);

  const isOwner = currentUser?.uid === reply.authorId;

  const formattedTimeAgo = useMemo(() => {
    try {
      let date: Date;
      if (typeof reply.createdAt === 'string') {
        date = new Date(reply.createdAt);
      } else if (reply.createdAt && typeof (reply.createdAt as any).toDate === 'function') {
        date = (reply.createdAt as any).toDate();
      } else {
        date = new Date();
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

  const handleDelete = async () => {
    if (!confirm(t.knowledgeHub.detail.comments.deleteConfirmation)) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/replies?replyId=${reply.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error("Gagal menghapus");
      setIsDeleted(true);
    } catch (error) {
      console.error("Failed to delete reply:", error);
      alert(t.knowledgeHub.detail.messages.serverError);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isDeleted) return null;

  return (
    <div className="flex gap-4 p-4 bg-[#0a0a0b]/60 rounded-2xl border border-white/5 hover:border-white/10 transition-all duration-300 group relative animate-in fade-in slide-in-from-bottom-2">
      {/* Avatar */}
      <Link href={`/player/${reply.authorId}`} className="flex-shrink-0">
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 group-hover:border-coc-gold/50 transition-colors shadow-md">
           <Image
            src={reply.authorAvatarUrl || '/images/placeholder-avatar.png'}
            alt={`${reply.authorName}'s avatar`}
            fill
            className="object-cover"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/images/placeholder-avatar.png';
            }}
          />
        </div>
      </Link>
      
      {/* Content */}
      <div className="flex-grow min-w-0">
        <div className="flex justify-between items-start mb-2">
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <Link
                  href={`/player/${reply.authorId}`}
                  className="font-bold text-sm text-white hover:text-coc-gold transition-colors font-clash tracking-wide"
                >
                  {reply.authorName}
                </Link>
                <span className="text-[10px] text-gray-600 font-mono font-bold uppercase">
                  {formattedTimeAgo}
                </span>
            </div>
            
            {/* Actions (Visible on hover or touch) */}
            <div className="flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                <button 
                    onClick={() => onReply(reply.authorName)} 
                    className="text-gray-500 hover:text-coc-blue p-1.5 rounded-lg hover:bg-coc-blue/10 transition-colors"
                    title={t.knowledgeHub.detail.actions.reply}
                >
                    <MessageSquareIcon className="h-3.5 w-3.5" />
                </button>
                
                {isOwner && (
                    <button 
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-gray-500 hover:text-coc-red p-1.5 rounded-lg hover:bg-coc-red/10 transition-colors disabled:opacity-50"
                        title={t.knowledgeHub.detail.actions.delete}
                    >
                        {isDeleting ? (
                            <RefreshCwIcon className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                            <TrashIcon className="h-3.5 w-3.5" />
                        )}
                    </button>
                )}
            </div>
        </div>

        <div className="text-gray-300 text-sm font-sans whitespace-pre-wrap leading-relaxed break-words bg-white/5 p-3 rounded-lg rounded-tl-none border border-white/5">
          {reply.content}
        </div>
      </div>
    </div>
  );
};

export default ReplyItem;