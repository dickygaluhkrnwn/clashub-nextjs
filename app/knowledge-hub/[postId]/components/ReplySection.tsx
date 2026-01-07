'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button } from '@/app/components/ui/Button';
import Notification, { NotificationProps } from '@/app/components/ui/Notification';
import { PaperPlaneIcon, RefreshCwIcon, MessageSquareIcon, Loader2Icon, UserCircleIcon } from '@/app/components/icons';
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
  const { t } = useLanguage();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  const handleReplyToUser = (username: string) => {
      const mention = `@${username} `;
      setNewReplyContent((prev) => prev + mention);
      
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
        <div className="bg-white/5 p-6 rounded-xl mb-8 text-center border border-white/5 flex items-center justify-center gap-3">
           <Loader2Icon className="h-5 w-5 animate-spin text-gray-500" />
           <p className="text-gray-500 text-sm font-mono">{t.knowledgeHub.detail.messages.loadingAuth}</p>
        </div>
      );
    }

    if (!userProfile) {
      return (
        <div className="bg-[#0f1115] border border-white/5 p-8 rounded-2xl mb-8 text-center flex flex-col items-center gap-4 relative overflow-hidden group">
          <div className="absolute inset-0 bg-coc-blue/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <UserCircleIcon className="h-12 w-12 text-gray-600 group-hover:text-coc-blue transition-colors" />
          <p className="text-gray-400 text-sm font-sans max-w-xs">{t.knowledgeHub.detail.comments.loginToComment}</p>
          <Link href="/auth">
            <Button variant="primary" size="sm" className="shadow-lg shadow-coc-gold/10">
               Login / Register
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmitReply} className="relative mb-10 group">
        <div className="relative">
          <textarea
            ref={textareaRef}
            placeholder={t.knowledgeHub.detail.comments.placeholder}
            rows={3}
            className="w-full bg-[#0a0a0b] border border-white/10 rounded-xl p-4 text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-coc-blue focus:border-coc-blue transition-all resize-none font-sans pr-16 shadow-inner"
            value={newReplyContent}
            onChange={(e) => setNewReplyContent(e.target.value)}
            disabled={isSubmitting}
          />
          {/* Submit Button inside Textarea */}
          <button
            type="submit"
            disabled={isSubmitting || !newReplyContent.trim()}
            className="absolute bottom-3 right-3 p-2 bg-coc-blue text-white rounded-lg hover:bg-coc-blue-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-coc-blue/30 active:scale-95"
            title={t.knowledgeHub.detail.comments.submit}
          >
            {isSubmitting ? (
              <RefreshCwIcon className="h-5 w-5 animate-spin" />
            ) : (
              <PaperPlaneIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </form>
    );
  };

  return (
    <div className="mt-8" id="comments">
      {notification && <Notification notification={notification} />}

      {renderReplyForm()}

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2Icon className="h-10 w-10 text-coc-gold animate-spin opacity-50" />
        </div>
      ) : replies.length === 0 ? (
        <div className="text-center py-12 bg-[#0a0a0b]/40 rounded-2xl border border-white/5 border-dashed flex flex-col items-center gap-3">
          <MessageSquareIcon className="h-10 w-10 text-gray-700" />
          <p className="text-gray-500 italic font-sans text-sm">{t.knowledgeHub.detail.comments.noComments}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {replies.map((reply) => (
            <ReplyItem 
               key={reply.id} 
               reply={reply} 
               postId={postId} 
               onReply={handleReplyToUser} 
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReplySection;