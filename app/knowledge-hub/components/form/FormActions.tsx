'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { 
  PaperPlaneIcon, 
  SaveIcon, 
  RefreshCwIcon, 
  XIcon 
} from '@/app/components/icons'; 
import { useLanguage } from '@/lib/hooks/useLanguage';

interface FormActionsProps {
  isEditMode: boolean;
  isSubmitting: boolean;
  isFormValid: boolean;
  cancelHref: string;
}

const FormActions: React.FC<FormActionsProps> = ({
  isEditMode,
  isSubmitting,
  isFormValid,
  cancelHref
}) => {
  const { t, language } = useLanguage();

  const submitText = isEditMode
    ? isSubmitting
      ? (language === 'id' ? 'Menyimpan...' : 'Saving...')
      : (language === 'id' ? 'Simpan Perubahan' : 'Save Changes')
    : isSubmitting
    ? (language === 'id' ? 'Menerbitkan...' : 'Publishing...')
    : (language === 'id' ? 'Terbitkan Strategi' : 'Publish Strategy');

  const submitIcon = isSubmitting ? (
    <RefreshCwIcon className="inline h-5 w-5 mr-2 animate-spin" />
  ) : isEditMode ? (
    <SaveIcon className="inline h-5 w-5 mr-2" />
  ) : (
    <PaperPlaneIcon className="inline h-5 w-5 mr-2" />
  );

  return (
    <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-8 border-t border-white/10 mt-8 sticky bottom-0 bg-[#0a0a0b]/95 backdrop-blur-lg p-4 -mx-4 sm:mx-0 sm:bg-transparent sm:static rounded-t-2xl sm:rounded-none z-20 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] sm:shadow-none">
      <Button
        type="button"
        variant="outline"
        href={cancelHref}
        className="w-full sm:w-auto border-white/10 hover:bg-white/5 hover:text-white px-8"
      >
        <XIcon className="inline h-4 w-4 mr-2" /> 
        {t.knowledgeHub.create.cancelButton}
      </Button>
      
      <Button
        type="submit"
        variant="primary"
        className={`w-full sm:w-auto shadow-[0_0_20px_rgba(255,215,0,0.2)] hover:shadow-[0_0_30px_rgba(255,215,0,0.4)] px-8 font-bold tracking-widest ${!isFormValid ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
        disabled={isSubmitting || !isFormValid}
      >
        {submitIcon}
        {submitText}
      </Button>
    </div>
  );
};

export default FormActions;