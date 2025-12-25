'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Post, PostCategory } from '@/lib/types';
import { POST_CATEGORIES } from '@/lib/knowledge-hub-utils';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/lib/hooks/useLanguage';
import { NotificationProps } from '@/app/components/ui/Notification';

export interface PostFormData {
  title: string;
  content: string;
  category: PostCategory;
  tags: string;
  troopLink: string;
  videoUrl: string;
  baseImageUrl: string;
  baseLinkUrl: string;
}

export const CATEGORY_OPTIONS: PostCategory[] = POST_CATEGORIES.filter(
  (c) => c !== 'Semua Diskusi'
) as PostCategory[];

interface UsePostFormProps {
  initialData?: (Post & { id: string }) | null;
}

export const usePostForm = ({ initialData }: UsePostFormProps) => {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { t, language } = useLanguage();

  const isEditMode = !!initialData;
  const initialTagsString = initialData?.tags?.join(', ') || '';

  const [formData, setFormData] = useState<PostFormData>({
    title: initialData?.title || '',
    content: initialData?.content || '',
    category: initialData?.category || CATEGORY_OPTIONS[0],
    tags: initialTagsString,
    troopLink: initialData?.troopLink || '',
    videoUrl: initialData?.videoUrl || '',
    baseImageUrl: initialData?.baseImageUrl || '',
    baseLinkUrl: initialData?.baseLinkUrl || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  const isStrategyPost = formData.category === 'Strategi Serangan';
  const isBaseBuildingPost = formData.category === 'Base Building';

  // --- Validasi Real-time ---
  useEffect(() => {
    const isTitleValid = formData.title.trim().length > 0;
    const isContentValid = formData.content.trim().length > 0;

    let isStrategyLinkValid = true;
    if (isStrategyPost) {
      isStrategyLinkValid =
        formData.troopLink.trim().length > 0 ||
        formData.videoUrl.trim().length > 0;
    }

    let isBaseBuildingLinkValid = true;
    if (isBaseBuildingPost) {
      isBaseBuildingLinkValid =
        formData.baseImageUrl.trim().length > 0 ||
        formData.baseLinkUrl.trim().length > 0;
    }

    setIsFormValid(
      isTitleValid &&
      isContentValid &&
      isStrategyLinkValid &&
      isBaseBuildingLinkValid
    );

    if (isTitleValid && isContentValid && isStrategyLinkValid && isBaseBuildingLinkValid) {
      setFormError(null);
    }
  }, [formData, isStrategyPost, isBaseBuildingPost]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target;
    setFormError(null);

    if (id === 'category') {
      const newCategory = value as PostCategory;
      setFormData((prev) => ({
        ...prev,
        [id]: newCategory,
        // Reset field yang tidak relevan agar tidak tersimpan kotoran
        troopLink: newCategory === 'Strategi Serangan' ? prev.troopLink : '',
        videoUrl: newCategory === 'Strategi Serangan' ? prev.videoUrl : '',
        baseImageUrl: newCategory === 'Base Building' ? prev.baseImageUrl : '',
        baseLinkUrl: newCategory === 'Base Building' ? prev.baseLinkUrl : '',
      }));
      return;
    }

    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const showNotification = (message: string, type: NotificationProps['type']) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      let errorMsg = t.knowledgeHub.form.validation.titleRequired;
      if (isStrategyPost && !formData.troopLink.trim() && !formData.videoUrl.trim()) {
        errorMsg = language === 'id' 
          ? "Untuk kategori Strategi Serangan, minimal salah satu dari 'Troop Link' atau 'Video URL' wajib diisi."
          : "For Attack Strategy, at least one of 'Troop Link' or 'Video URL' is required.";
      } else if (isBaseBuildingPost && !formData.baseImageUrl.trim() && !formData.baseLinkUrl.trim()) {
        errorMsg = language === 'id'
          ? "Untuk kategori Base Building, minimal salah satu dari 'Base Image URL' atau 'Base Link URL' wajib diisi."
          : "For Base Building, at least one of 'Base Image URL' or 'Base Link URL' is required.";
      }
      setFormError(errorMsg);
      return;
    }

    if (isSubmitting || !currentUser) {
      setFormError(language === 'id' ? 'Anda harus login.' : 'You must be logged in.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      // Auto Image Logic (Thumbnails)
      let autoImageUrl: string | null = null;
      if (isStrategyPost && formData.videoUrl.trim()) {
        const videoIdRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)(\w+)/i;
        const match = formData.videoUrl.trim().match(videoIdRegex);
        if (match && match[1]) {
          autoImageUrl = `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
        }
      } else if (isBaseBuildingPost && formData.baseImageUrl.trim()) {
        autoImageUrl = formData.baseImageUrl.trim();
      }

      const tagsArray = formData.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const postDataPayload: Partial<Post> = {
        title: formData.title,
        content: formData.content,
        category: formData.category,
        tags: tagsArray,
        imageUrl: autoImageUrl,
        troopLink: isStrategyPost ? formData.troopLink.trim() || null : null,
        videoUrl: isStrategyPost ? formData.videoUrl.trim() || null : null,
        baseImageUrl: isBaseBuildingPost ? formData.baseImageUrl.trim() || null : null,
        baseLinkUrl: isBaseBuildingPost ? formData.baseLinkUrl.trim() || null : null,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || 'Anonymous',
        authorAvatarUrl: currentUser.photoURL || '/images/placeholder-avatar.png'
      };

      let postId: string;
      let response;
      let result;

      if (isEditMode) {
        postId = initialData!.id;
        showNotification(t.knowledgeHub.create.submitting, 'info');
        response = await fetch(`/api/posts/${postId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postDataPayload),
        });
        result = await response.json();
        if (!response.ok) throw new Error(result.message || t.knowledgeHub.form.messages.createError);
        showNotification(language === 'id' ? 'Berhasil diperbarui!' : 'Updated successfully!', 'success');
      } else {
        showNotification(t.knowledgeHub.create.submitting, 'info');
        response = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(postDataPayload),
        });
        result = await response.json();
        if (!response.ok) throw new Error(result.error || t.knowledgeHub.form.messages.createError);
        postId = result.id;
        showNotification(t.knowledgeHub.form.messages.createSuccess, 'success');
      }

      setTimeout(() => router.push(`/knowledge-hub/${postId}`), 1000);
    } catch (err) {
      console.error('Error:', err);
      const errorMessage = (err as Error).message || t.knowledgeHub.form.messages.createError;
      if (errorMessage.includes('E-Sports CV')) {
        setFormError(errorMessage);
        showNotification(language === 'id' ? 'Aksi diblokir: Profil belum lengkap.' : 'Action blocked.', 'warning');
      } else {
        setFormError(errorMessage);
        showNotification(errorMessage, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    handleInputChange,
    handleSubmit,
    isSubmitting,
    formError,
    isFormValid,
    notification,
    isEditMode,
    isStrategyPost,
    isBaseBuildingPost
  };
};