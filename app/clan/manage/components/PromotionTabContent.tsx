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
  GlobeIcon,
  BarChart2Icon,
  UserIcon,
  TrendingUpIcon
} from '@/app/components/icons';
import { NotificationProps } from '@/app/components/ui/Notification';
// Pastikan PromotionAnalytics di-import (file ini belum kita ubah sesuai instruksi)
import PromotionAnalytics from './PromotionAnalytics';
import { useLanguage } from '@/lib/hooks/useLanguage';

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
  const { t } = useLanguage();
  
  const [promotions, setPromotions] = useState<FirestoreDocument<Promotion>[]>([]);
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
        throw new Error(t.clanBanners.loadingList + ' (Failed)');
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
      onAction(t.clanBanners.valAllFields, 'error');
      return;
    }
    if (!formData.imageUrl.startsWith('https://i.imgur.com/')) {
      onAction(t.clanBanners.valImgUrl, 'error');
      return;
    }

    setIsSubmitting(true);
    onAction(t.clanBanners.btnSubmitting, 'info');

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

      onAction(t.clanBanners.toastAdded, 'success');
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

    if (!confirm('Are you sure you want to delete this promotion?')) return;

    setIsDeletingId(promotionId);
    onAction(t.common.delete + '...', 'info');

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

      onAction(t.clanBanners.toastDeleted, 'success');
      setPromotions((prev) => prev.filter((p) => p.id !== promotionId));
    } catch (err) {
      onAction((err as Error).message, 'error');
    } finally {
      setIsDeletingId(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* --- HEADER BANNER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#15171e]/40 p-6 rounded-2xl border border-white/5 relative overflow-hidden ring-1 ring-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-coc-gold/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/2" />
        
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-1">
                <div className="p-2.5 bg-coc-gold/10 rounded-xl border border-coc-gold/20 shadow-[0_0_15px_rgba(255,215,0,0.1)]">
                    <GlobeIcon className="h-6 w-6 text-coc-gold" />
                </div>
                <div>
                    <h2 className="text-2xl font-clash text-white tracking-wide">
                        {t.clanBanners.tabTitle}
                    </h2>
                    <p className="text-gray-400 text-sm mt-0.5 max-w-xl font-sans">
                        {t.clanBanners.tabDesc}
                    </p>
                </div>
            </div>
        </div>

        <div className="relative z-10">
            {!showAddForm && (
                <Button
                    variant="primary"
                    onClick={() => setShowAddForm(true)}
                    disabled={isLoadingList}
                    className="shadow-lg shadow-coc-gold/10 transition-transform hover:scale-105"
                >
                    <PlusIcon className="h-5 w-5 mr-2" />
                    {t.clanBanners.btnAdd}
                </Button>
            )}
        </div>
      </div>

      {/* --- ANALYTICS SECTION --- */}
      {/* [PENTING] Memanggil PromotionAnalytics (sesuai instruksi, file ini belum diedit) */}
      <PromotionAnalytics promotions={promotions} />

      {/* --- DIVIDER & TITLE --- */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
           <BarChart2Icon className="h-5 w-5 text-gray-400" />
           <h3 className="text-lg font-clash text-white tracking-wide">
               {t.clanBanners.listTitle} <span className="text-gray-500 font-mono ml-2 text-sm bg-white/5 px-2 py-0.5 rounded">({promotions.length})</span>
           </h3>
        </div>
        {isLoadingList && <RefreshCwIcon className="h-4 w-4 text-coc-gold animate-spin" />}
      </div>

      {/* --- FORM SECTION (Panel) --- */}
      {showAddForm && (
        <div className="bg-[#15171e]/80 border border-coc-gold/30 rounded-2xl p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative animate-in slide-in-from-top-4 mb-8 backdrop-blur-xl">
            <div className="absolute -top-px left-8 right-8 h-px bg-gradient-to-r from-transparent via-coc-gold/50 to-transparent" />
            
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-xl font-clash text-white flex items-center gap-2">
                        <UploadIcon className="h-5 w-5 text-coc-gold" />
                        {t.clanBanners.formTitle}
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">
                        {t.clanBanners.formDesc}
                    </p>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-400 hover:text-white hover:bg-white/5 rounded-full h-8 w-8 p-0"
                >
                    <XIcon className="h-5 w-5" />
                </Button>
            </div>

            {/* Imgur Warning */}
            <div className="mb-6 p-4 rounded-xl bg-coc-yellow/5 border border-coc-yellow/20 flex gap-3 items-center">
                <AlertTriangleIcon className="h-5 w-5 text-coc-yellow flex-shrink-0" />
                <p className="text-xs text-gray-300 leading-relaxed">
                    <strong className="text-coc-yellow mr-1 block mb-0.5">{t.clanBanners.alertImgTitle}:</strong>
                    {t.clanBanners.alertImgDesc}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left: Inputs */}
                    <div className="space-y-5 order-2 md:order-1">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                {t.clanBanners.labelImgUrl} <span className="text-coc-red">*</span>
                            </label>
                            <Input
                                name="imageUrl"
                                type="text"
                                placeholder="https://i.imgur.com/example.png"
                                value={formData.imageUrl}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                required
                                className="bg-black/30 border-white/10 focus:border-coc-gold/50 text-sm h-11"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                {t.clanBanners.labelTitle} <span className="text-coc-red">*</span>
                            </label>
                            <Input
                                name="title"
                                type="text"
                                placeholder="e.g. Recruiting TH15+"
                                value={formData.title}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                required
                                maxLength={50}
                                className="bg-black/30 border-white/10 focus:border-coc-gold/50 text-sm h-11"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                {t.clanBanners.labelDesc} <span className="text-coc-red">*</span>
                            </label>
                            <Input
                                name="description"
                                type="text"
                                placeholder="e.g. Active war clan, join us!"
                                value={formData.description}
                                onChange={handleChange}
                                disabled={isSubmitting}
                                required
                                maxLength={100}
                                className="bg-black/30 border-white/10 focus:border-coc-gold/50 text-sm h-11"
                            />
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="order-1 md:order-2">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            Banner Preview
                        </label>
                        <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center group shadow-lg">
                            {formData.imageUrl ? (
                                <>
                                    <Image 
                                        src={formData.imageUrl} 
                                        alt="Preview" 
                                        fill 
                                        className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
                                        unoptimized
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80" />
                                    <div className="absolute bottom-4 left-4 right-4">
                                        <p className="text-white font-clash text-xl truncate tracking-wide">{formData.title || 'Your Title Here'}</p>
                                        <p className="text-gray-300 text-sm font-sans truncate mt-1">{formData.description || 'Description will appear here'}</p>
                                    </div>
                                    <div className="absolute top-3 right-3">
                                        <span className="bg-coc-gold text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">PREVIEW</span>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center p-4">
                                    <UploadIcon className="h-10 w-10 text-gray-700 mx-auto mb-2" />
                                    <p className="text-gray-600 text-xs font-mono">Enter a valid Image URL</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5 flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowAddForm(false)}
                        disabled={isSubmitting}
                        className="bg-white/5 border-white/10 hover:bg-white/10 text-gray-300"
                    >
                        {t.clanBanners.btnCancel}
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={isSubmitting}
                        className="shadow-lg shadow-coc-gold/10 px-6"
                    >
                        {isSubmitting ? (
                            <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <UploadIcon className="h-4 w-4 mr-2" />
                        )}
                        {isSubmitting ? t.clanBanners.btnSubmitting : t.clanBanners.btnSubmit}
                    </Button>
                </div>
            </form>
        </div>
      )}

      {/* --- PROMOTION GRID LIST --- */}
      <div>
        {isLoadingList ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {[1, 2, 3].map(i => (
                 <div key={i} className="h-64 bg-white/5 rounded-2xl border border-white/5 animate-pulse" />
             ))}
          </div>
        ) : promotions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
            <GlobeIcon className="h-16 w-16 text-gray-700 mb-4 opacity-50" />
            <p className="text-gray-400 font-clash text-lg mb-1">{t.clanBanners.noBanners}</p>
            <p className="text-gray-500 text-sm mb-6">Create a promotion to attract new members.</p>
            {!showAddForm && (
                <Button 
                    variant="secondary" 
                    className="border-white/10 bg-white/5 hover:bg-white/10"
                    onClick={() => setShowAddForm(true)}
                >
                    <PlusIcon className="h-4 w-4 mr-2" /> {t.clanBanners.btnAdd}
                </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {promotions.map((promo) => (
              <div
                key={promo.id}
                className="group relative flex flex-col bg-[#1a1a1a] rounded-2xl border border-white/10 overflow-hidden shadow-lg transition-all duration-300 hover:shadow-coc-gold/10 hover:border-coc-gold/30 hover:-translate-y-1"
              >
                {/* Image Header */}
                <div className="relative h-44 w-full bg-black/50 overflow-hidden">
                    <Image
                        src={promo.imageUrl}
                        alt={promo.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        unoptimized
                    />
                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-[#1a1a1a]/40 to-transparent" />
                    
                    {/* Top Right: Status */}
                    <div className="absolute top-3 right-3">
                        <span className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-[10px] text-green-400 font-bold uppercase tracking-wider shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Active
                        </span>
                    </div>
                </div>

                {/* Card Content */}
                <div className="flex-grow p-5 pt-2 flex flex-col relative z-10">
                  <h4 className="text-lg font-clash text-white group-hover:text-coc-gold transition-colors truncate mb-1">
                    {promo.title}
                  </h4>
                  <p className="text-xs text-gray-400 font-sans line-clamp-2 min-h-[2.5em] leading-relaxed">
                    {promo.description}
                  </p>
                  
                  {/* Metrics Dashboard */}
                  <div className="mt-5 grid grid-cols-2 gap-3 bg-black/30 rounded-xl p-3 border border-white/5">
                    {/* Clicks Metric */}
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="flex items-center gap-1 text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                            <ThumbsUpIcon className="h-3 w-3" /> Clicks
                        </div>
                        <span className="text-xl font-clash text-white">{promo.totalClicks}</span>
                    </div>
                    
                    {/* Top Audience Metric */}
                    <div className="flex flex-col items-center justify-center text-center border-l border-white/5">
                         <div className="flex items-center gap-1 text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">
                            <UserIcon className="h-3 w-3" /> Top Aud.
                        </div>
                        {promo.clicksByTH && Object.keys(promo.clicksByTH).length > 0 ? (
                            <span className="text-sm font-sans text-white font-bold">
                                TH {Object.entries(promo.clicksByTH)
                                    .sort((a, b) => b[1] - a[1])[0][0]
                                }
                            </span>
                        ) : (
                            <span className="text-xs text-gray-600">-</span>
                        )}
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
                  <div className="flex items-center gap-1 text-[10px] text-gray-600 font-mono">
                      <TrendingUpIcon className="h-3 w-3" />
                      Analytics Ready
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors h-8 px-3"
                    onClick={() => handleDelete(promo.id)}
                    disabled={isDeletingId === promo.id}
                  >
                    {isDeletingId === promo.id ? (
                      <RefreshCwIcon className="h-3.5 w-3.5 animate-spin mr-2" />
                    ) : (
                      <TrashIcon className="h-3.5 w-3.5 mr-2" />
                    )}
                    {t.common.delete}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionTabContent;