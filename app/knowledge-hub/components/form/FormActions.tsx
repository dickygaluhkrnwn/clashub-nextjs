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
      ? t.knowledgeHub.create.submitting
      : (language === 'id' ? 'Simpan Perubahan' : 'Save Changes')
    : isSubmitting
    ? t.knowledgeHub.create.submitting
    : (language === 'id' ? 'Terbitkan' : 'Publish'); // [MODIFIKASI] Teks menjadi "Terbitkan"

  const submitIcon = isSubmitting ? (
    <RefreshCwIcon className="inline h-5 w-5 mr-2 animate-spin" />
  ) : isEditMode ? (
    <SaveIcon className="inline h-5 w-5 mr-2" />
  ) : (
    <PaperPlaneIcon className="inline h-5 w-5 mr-2" />
  );

  return (
    <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t border-white/10 mt-8">
      <Button
        type="button"
        variant="outline"
        href={cancelHref}
        className="w-full sm:w-auto border-white/10 hover:bg-white/5"
      >
        <XIcon className="inline h-4 w-4 mr-2" /> 
        {t.knowledgeHub.create.cancelButton}
      </Button>
      <Button
        type="submit"
        variant="primary"
        className="w-full sm:w-auto shadow-lg shadow-coc-gold/10"
        disabled={isSubmitting || !isFormValid}
      >
        {submitIcon}
        {submitText}
      </Button>
    </div>
  );
};

export default FormActions;