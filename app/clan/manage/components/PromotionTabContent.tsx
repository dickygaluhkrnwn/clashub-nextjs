'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  ManagedClan,
  Promotion,
  FirestoreDocument,
} from '@/lib/clashub.types';
import { Button } from '@/app/components/ui/Button';
import { Input } from '@/app/components/ui/Input';
import {
  RefreshCwIcon,
  TrashIcon,
  AlertTriangleIcon,
  ThumbsUpIcon,
  UploadIcon,
  PlusIcon, 
  XIcon, 
} from '@/app/components/icons';
import { NotificationProps } from '@/app/components/ui/Notification';
import PromotionAnalytics from './PromotionAnalytics';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU]

interface PromotionTabContentProps {
  clan: ManagedClan;
  onAction: (message: string, type: NotificationProps['type']) => void;
}

type NewPromotionData = Omit<
  Promotion,
  'id' | 'clanId' | 'totalClicks' | 'clicksByTH'
>;

const PromotionTabContent: React.FC<PromotionTabContentProps> = ({
  clan,
  onAction,
}) => {
  const { t } = useLanguage(); // [BARU]
  
  const [promotions, setPromotions] = useState<FirestoreDocument<Promotion>[]>(
    [],
  );
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [formData, setFormData] = useState<NewPromotionData>({
    imageUrl: '',
    title: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);

  const fetchPromotions = async () => {
    setIsLoadingList(true);
    try {
      const response = await fetch(`/api/clan/manage/${clan.id}/promotions`);
      if (!response.ok) {
        throw new Error(t.clanBanners.loadingList + ' (Failed)'); // [i18n] Fallback
      }
      const data = (await response.json()) as FirestoreDocument<Promotion>[];
      setPromotions(data);
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    fetchPromotions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.imageUrl || !formData.title || !formData.description) {
      onAction(t.clanBanners.valAllFields, 'error'); // [i18n]
      return;
    }
    if (!formData.imageUrl.startsWith('https://i.imgur.com/')) {
      onAction(t.clanBanners.valImgUrl, 'error'); // [i18n]
      return;
    }

    setIsSubmitting(true);
    onAction(t.clanBanners.btnSubmitting, 'info'); // [i18n]

    try {
      const response = await fetch(
        `/api/clan/manage/${clan.id}/promotions`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || t.common.error);
      }

      onAction(t.clanBanners.toastAdded, 'success'); // [i18n]
      setFormData({ imageUrl: '', title: '', description: '' });
      await fetchPromotions();
      setShowAddForm(false);
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (promotionId: string) => {
    if (isDeletingId) return;

    setIsDeletingId(promotionId);
    onAction(t.common.delete + '...', 'info'); // [i18n]

    try {
      const response = await fetch(
        `/api/clan/manage/${clan.id}/promotions/${promotionId}`,
        {
          method: 'DELETE',
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || t.common.error);
      }

      onAction(t.clanBanners.toastDeleted, 'success'); // [i18n]
      setPromotions((prev) => prev.filter((p) => p.id !== promotionId));
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="mx-auto">
      {/* --- BAGIAN ANALITIK --- */}
      <PromotionAnalytics promotions={promotions} />

      {/* --- BAGIAN FORM --- */}
      <div className="mt-8 max-w-2xl">
        {!showAddForm ? (
          <Button
            variant="primary"
            onClick={() => setShowAddForm(true)}
            className="w-full sm:w-auto"
            disabled={isLoadingList}
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            {t.clanBanners.btnAdd} {/* [i18n] */}
          </Button>
        ) : (
          <div className="card-stone p-6 relative">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-2xl font-clash text-coc-gold">
                {t.clanBanners.formTitle} {/* [i18n] */}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddForm(false)}
                className="text-gray-400 hover:text-white"
                aria-label="Tutup form"
              >
                <XIcon className="h-5 w-5" />
              </Button>
            </div>
            <p className="text-gray-400 font-sans mb-6">
              {t.clanBanners.formDesc} {/* [i18n] */}
            </p>

            {/* Peringatan Imgur */}
            <div className="mb-6 p-4 rounded-lg bg-coc-yellow/10 border border-coc-yellow/30 flex items-start gap-3">
              <AlertTriangleIcon className="h-6 w-6 text-coc-yellow flex-shrink-0 mt-0.5" />
              <div className="font-sans">
                <h4 className="font-bold text-coc-yellow">
                  {t.clanBanners.alertImgTitle} {/* [i18n] */}
                </h4>
                <p className="text-sm text-gray-300">
                  {t.clanBanners.alertImgDesc} {/* [i18n] */}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="imageUrl"
                  className="block text-sm font-medium text-gray-300 mb-1 font-sans"
                >
                  {t.clanBanners.labelImgUrl} {/* [i18n] */}
                </label>
                <Input
                  id="imageUrl"
                  name="imageUrl"
                  type="text"
                  placeholder="https://i.imgur.com/xxxxxx.png"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  className="font-sans"
                />
              </div>

              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-300 mb-1 font-sans"
                >
                  {t.clanBanners.labelTitle} {/* [i18n] */}
                </label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  placeholder="Rekrutmen TH 15-16 Dibuka!"
                  value={formData.title}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  maxLength={50}
                  className="font-sans"
                />
              </div>

              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-300 mb-1 font-sans"
                >
                  {t.clanBanners.labelDesc} {/* [i18n] */}
                </label>
                <Input
                  id="description"
                  name="description"
                  type="text"
                  placeholder="Klan kami mencari pemain aktif untuk CWL."
                  value={formData.description}
                  onChange={handleChange}
                  disabled={isSubmitting}
                  required
                  maxLength={100}
                  className="font-sans"
                />
              </div>

              <div className="pt-4 border-t border-coc-gold-dark/20 flex items-center gap-4">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <UploadIcon className="h-4 w-4 mr-2" />
                  )}
                  {isSubmitting ? t.clanBanners.btnSubmitting : t.clanBanners.btnSubmit} {/* [i18n] */}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                >
                  {t.clanBanners.btnCancel} {/* [i18n] */}
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* --- BAGIAN DAFTAR PROMOSI --- */}
      <div className="mt-12 pt-6 border-t border-coc-gold-dark/30">
        <h3 className="text-xl font-clash text-coc-gold mb-4">
          {t.clanBanners.listTitle} {/* [i18n] */}
        </h3>
        {isLoadingList ? (
          <div className="flex justify-center items-center py-10">
            <RefreshCwIcon className="h-6 w-6 text-coc-gold animate-spin" />
            <p className="ml-3 text-gray-400">{t.clanBanners.loadingList}</p> {/* [i18n] */}
          </div>
        ) : promotions.length === 0 ? (
          <p className="text-gray-500 font-sans text-center py-10">
            {t.clanBanners.noBanners} {/* [i18n] */}
          </p>
        ) : (
          <div className="space-y-4">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="flex flex-col sm:flex-row items-center gap-4 p-4 bg-coc-dark/60 rounded-lg border border-coc-gold-dark/30"
              >
                <Image
                  src={promo.imageUrl}
                  alt={promo.title}
                  width={128}
                  height={72}
                  className="rounded-md object-cover w-full sm:w-32 h-auto sm:h-[72px] flex-shrink-0 border-2 border-coc-gold-dark/50"
                  unoptimized
                />
                <div className="flex-grow text-center sm:text-left">
                  <h4 className="text-lg font-clash text-white">
                    {promo.title}
                  </h4>
                  <p className="text-sm text-gray-400 font-sans line-clamp-2">
                    {promo.description}
                  </p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-coc-gold mt-2">
                    <ThumbsUpIcon className="h-4 w-4" />
                    <span className="text-sm font-sans font-bold">
                      {promo.totalClicks} {t.clanBanners.clicks} {/* [i18n] */}
                    </span>
                  </div>
                  {/* Tampilkan rincian klik per TH */}
                  {promo.clicksByTH &&
                    Object.keys(promo.clicksByTH).length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                        {Object.entries(promo.clicksByTH)
                          .sort((a, b) => {
                            const thA =
                              a[0] === 'unknown' ? 0 : parseInt(a[0]);
                            const thB =
                              b[0] === 'unknown' ? 0 : parseInt(b[0]);
                            return thB - thA;
                          })
                          .map(([th, count]) => (
                            <span
                              key={th}
                              className="text-xs font-sans bg-coc-dark px-2 py-0.5 rounded-full text-gray-300 border border-coc-gold-dark/50"
                            >
                              TH {th}:{' '}
                              <strong className="text-white">{count}</strong>
                            </span>
                          ))}
                      </div>
                    )}
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full sm:w-auto flex-shrink-0"
                  onClick={() => handleDelete(promo.id)}
                  disabled={isDeletingId === promo.id}
                >
                  {isDeletingId === promo.id ? (
                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <TrashIcon className="h-4 w-4" />
                  )}
                  <span className="ml-2 sm:hidden lg:inline-block">{t.common.delete}</span> {/* [i18n] */}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionTabContent;