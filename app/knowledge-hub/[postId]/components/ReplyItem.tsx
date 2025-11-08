'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Reply } from '@/lib/clashub.types'; // Tipe data balasan kita
import { formatDistanceToNowStrict } from 'date-fns';
import { id } from 'date-fns/locale';

// Definisikan props untuk komponen ini
interface ReplyItemProps {
  reply: Reply;
}

/**
 * @component ReplyItem
 * Menampilkan satu item balasan/komentar.
 */
const ReplyItem: React.FC<ReplyItemProps> = ({ reply }) => {
  // Konversi timestamp (string ISO atau objek Timestamp) menjadi objek Date
  const getFormattedDate = () => {
    try {
      let date: Date;
      if (typeof reply.createdAt === 'string') {
        date = new Date(reply.createdAt);
      } else {
        // Asumsikan ini adalah objek Timestamp Firestore (jika dari client-side)
        date = (reply.createdAt as any).toDate();
      }
      
      if (isNaN(date.getTime())) {
        return 'beberapa saat lalu';
      }
      
      return formatDistanceToNowStrict(date, { addSuffix: true, locale: id });
    } catch (error) {
      console.error("Error formatting reply date:", error);
      return 'beberapa saat lalu';
    }
  };

  const formattedTimeAgo = getFormattedDate();

  return (
    <div className="flex gap-4 p-4 bg-coc-stone/50 rounded-lg border-l-4 border-coc-gold-dark/30">
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
        <Link
          href={`/player/${reply.authorId}`}
          className="font-bold text-coc-gold hover:text-white text-md"
        >
          {reply.authorName}
        </Link>
        <p className="text-gray-300 text-sm mt-1 font-sans whitespace-pre-wrap">
          {reply.content}
        </p>
        <span className="text-xs text-gray-500 block mt-2">
          {formattedTimeAgo}
        </span>
      </div>
    </div>
  );
};

export default ReplyItem;