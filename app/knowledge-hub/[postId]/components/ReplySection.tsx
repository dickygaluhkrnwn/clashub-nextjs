'use client';

import React, { useState, useEffect, useRef } from 'react'; // [BARU] Import useRef
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import Notification, { NotificationProps } from '@/app/components/ui/Notification';
import { PaperPlaneIcon, RefreshCwIcon, MessageSquareIcon, Loader2Icon } from '@/app/components/icons';
import { useAuth } from '@/app/context/AuthContext';
import { Reply } from '@/lib/clashub.types';
import ReplyItem from './ReplyItem';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface ReplySectionProps {
  postId: string;
  initialReplyCount: number; 
}

const ReplySection: React.FC<ReplySectionProps> = ({
  postId,
  initialReplyCount,
}) => {
  const { userProfile, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null); // [BARU] Ref untuk textarea

  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyCount, setReplyCount] = useState(initialReplyCount);
  const [newReplyContent, setNewReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  const showNotification = (message: string, type: NotificationProps['type']) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  useEffect(() => {
    const fetchReplies = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/posts/${postId}/replies`);
        if (!response.ok) throw new Error(t.knowledgeHub.detail.messages.fetchError);
        const data: Reply[] = await response.json();
        setReplies(data);
        setReplyCount(data.length);
      } catch (err) {
        const errorMessage = (err as Error).message || t.knowledgeHub.detail.messages.serverError;
        showNotification(errorMessage, 'error');
      } finally {
        setIsLoading(false);
      }
    };
    fetchReplies();
  }, [postId, t.knowledgeHub.detail.messages.fetchError, t.knowledgeHub.detail.messages.serverError]); 

  // [BARU] Fungsi handleReply untuk mengisi textarea dengan @username
  const handleReplyToUser = (username: string) => {
     const mention = `@${username} `;
     setNewReplyContent((prev) => prev + mention);
     
     // Scroll ke input dan focus
     if (textareaRef.current) {
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        textareaRef.current.focus();
     }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (authLoading) return;
    if (!userProfile) {
      showNotification(t.knowledgeHub.detail.messages.loginRequired, 'error');
      return;
    }
    if (newReplyContent.trim().length === 0) {
      showNotification(t.knowledgeHub.detail.messages.emptyReply, 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newReplyContent.trim() }),
      });

      const responseData = await response.json();
      if (!response.ok) throw new Error(responseData.error || t.knowledgeHub.detail.messages.sendError);

      const newReply: Reply = responseData;
      setReplies((prevReplies) => [newReply, ...prevReplies]);
      setReplyCount((prevCount) => prevCount + 1);
      setNewReplyContent('');
      setNotification(null);
    } catch (err) {
      const errorMessage = (err as Error).message || t.knowledgeHub.detail.messages.serverError;
      showNotification(errorMessage, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderReplyForm = () => {
    if (authLoading) {
      return (
        <div className="bg-white/5 p-6 rounded-xl mb-8 text-center border border-white/5">
           <Loader2Icon className="h-6 w-6 animate-spin mx-auto text-gray-500 mb-2" />
           <p className="text-gray-500 text-sm">{t.knowledgeHub.detail.messages.loadingAuth}</p>
        </div>
      );
    }

    if (!userProfile) {
      return (
        <div className="bg-white/5 border border-white/5 p-6 rounded-xl mb-8 text-center flex flex-col items-center gap-3">
          <p className="text-gray-400 text-sm font-sans">{t.knowledgeHub.detail.comments.loginToComment}</p>
          <Link href="/auth">
            <Button variant="secondary" size="sm" className="border-white/10 hover:bg-white/10">
               Login / Register
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmitReply} className="relative mb-8 group">
        <textarea
          ref={textareaRef} // [BARU] Attach ref
          placeholder={t.knowledgeHub.detail.comments.placeholder}
          rows={3}
          className="w-full bg-black/20 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-coc-blue/50 focus:border-coc-blue transition-all resize-none font-sans pr-14"
          value={newReplyContent}
          onChange={(e) => setNewReplyContent(e.target.value)}
          disabled={isSubmitting}
        ></textarea>
        <button
          type="submit"
          disabled={isSubmitting || !newReplyContent.trim()}
          className="absolute bottom-3 right-3 p-2 bg-coc-blue text-white rounded-lg hover:bg-coc-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:scale-105 active:scale-95"
          title={t.knowledgeHub.detail.comments.submit}
        >
          {isSubmitting ? (
            <RefreshCwIcon className="h-5 w-5 animate-spin" />
          ) : (
            <PaperPlaneIcon className="h-5 w-5" />
          )}
        </button>
      </form>
    );
  };

  return (
    <div className="mt-12 pt-8 border-t border-white/10" id="comments">
      {notification && <Notification notification={notification} />}

      <div className="flex items-center gap-3 mb-6">
         <div className="p-2 bg-coc-blue/10 rounded-lg">
            <MessageSquareIcon className="h-6 w-6 text-coc-blue" />
         </div>
         <h2 className="text-2xl font-bold text-white font-clash">
           {t.knowledgeHub.detail.comments.title} <span className="text-gray-500 text-lg font-normal ml-1">({replyCount})</span>
         </h2>
      </div>

      {renderReplyForm()}

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2Icon className="h-8 w-8 text-coc-gold animate-spin" />
        </div>
      ) : replies.length === 0 ? (
        <div className="text-center py-10 bg-white/5 rounded-xl border border-white/5 border-dashed">
          <p className="text-gray-400 italic font-sans">{t.knowledgeHub.detail.comments.noComments}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {replies.map((reply) => (
            <ReplyItem 
               key={reply.id} 
               reply={reply} 
               postId={postId} 
               onReply={handleReplyToUser} // [BARU] Pass handler ke child
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReplySection;