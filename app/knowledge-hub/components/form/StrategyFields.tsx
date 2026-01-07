'use client';

import React from 'react';
import { InfoIcon, LinkIcon } from '@/app/components/icons';
import { PostFormData } from './usePostForm';
import { useLanguage } from '@/lib/hooks/useLanguage';

interface StrategyFieldsProps {
  formData: PostFormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => void;
  isFormValid: boolean;
  isStrategyPost: boolean;
}

const StrategyFields: React.FC<StrategyFieldsProps> = ({
  formData,
  handleInputChange,
  isFormValid,
  isStrategyPost,
}) => {
  const { t, language } = useLanguage();

  if (!isStrategyPost) return null;

  const hasLinkError = !isFormValid && isStrategyPost && !formData.troopLink.trim() && !formData.videoUrl.trim();

  // Gaming Input Styles (Consistent with EditProfile)
  const inputClasses = (hasError: boolean) =>
    `w-full rounded-xl px-4 py-3 text-white placeholder-gray-600 transition-all duration-300 font-sans
     bg-[#0a0a0b] border border-white/10 hover:border-coc-gold/30 hover:bg-[#0f1115] focus:bg-[#13151b]
     focus:ring-1 focus:ring-coc-gold/50 focus:border-coc-gold focus:outline-none focus:shadow-[0_0_15px_rgba(255,215,0,0.1)]
     ${hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30' : ''}
    `;

  return (
    <div className="space-y-6 pt-8 mt-8 border-t border-white/10 animate-in fade-in slide-in-from-top-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-coc-gold/10 rounded-lg border border-coc-gold/20">
             <InfoIcon className="h-5 w-5 text-coc-gold" />
        </div>
        <h3 className="text-xl font-clash font-bold text-white tracking-wide flex items-center gap-3">
           {language === 'id' ? 'Detail Strategi' : 'Strategy Details'}
           <span className="text-[10px] font-sans font-medium text-gray-500 normal-case bg-[#0a0a0b] px-2 py-0.5 rounded border border-white/5 uppercase tracking-wider">
              {language === 'id' ? 'Min. 1 Wajib' : 'Min. 1 Required'}
           </span>
        </h3>
      </div>
      
      <div className="bg-[#0f1115]/50 p-6 rounded-2xl border border-white/5 space-y-6 relative overflow-hidden group">
        {/* Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-coc-blue/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

        {/* Troop Link */}
        <div className="space-y-2 relative z-10">
           <label htmlFor="troopLink" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 group-focus-within:text-coc-gold transition-colors">
              <LinkIcon className="h-3 w-3" />
              Troop Link (COC API Link)
           </label>
           <input
            type="url"
            id="troopLink"
            value={formData.troopLink}
            onChange={handleInputChange}
            placeholder="coc://open-troop-link?troop=..."
            className={inputClasses(!!hasLinkError)}
          />
          {hasLinkError && (
             <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
               {language === 'id' ? 'Wajib diisi jika tidak ada Video URL' : 'Required if no Video URL'}
             </p>
          )}
          <p className="text-xs text-gray-600 font-sans">
             {language === 'id' 
               ? 'Link untuk menyalin kombinasi pasukan langsung ke game (dimulai dengan `coc://`).'
               : 'Link to copy army composition directly to game (starts with `coc://`).'}
          </p>
        </div>
        
        {/* Video URL */}
        <div className="space-y-2 relative z-10">
           <label htmlFor="videoUrl" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 group-focus-within:text-coc-gold transition-colors">
              <span className="text-coc-red font-bold">▶</span>
              {t.knowledgeHub.form.labels.youtubeUrl}
           </label>
           <input
            type="url"
            id="videoUrl"
            value={formData.videoUrl}
            onChange={handleInputChange}
            placeholder={t.knowledgeHub.form.placeholders.youtubeUrl}
            className={inputClasses(!!hasLinkError)}
          />
          <p className="text-xs text-gray-600 font-sans">
             {language === 'id' 
               ? 'Link ke video YouTube yang menampilkan cara menggunakan strategi ini.'
               : 'Link to a YouTube video showing this strategy in action.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StrategyFields;