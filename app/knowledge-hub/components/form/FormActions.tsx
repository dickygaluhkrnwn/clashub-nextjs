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

  // Teks tombol submit dinamis
  const submitText = isEditMode
    ? isSubmitting
      ? t.knowledgeHub.create.submitting
      : (language === 'id' ? 'Simpan Perubahan' : 'Save Changes')
    : isSubmitting
    ? t.knowledgeHub.create.submitting
    : t.knowledgeHub.create.submitButton;

  // Ikon tombol submit dinamis
  const submitIcon = isSubmitting ? (
    <RefreshCwIcon className="inline h-5 w-5 mr-2 animate-spin" />
  ) : isEditMode ? (
    <SaveIcon className="inline h-5 w-5 mr-2" />
  ) : (
    <PaperPlaneIcon className="inline h-5 w-5 mr-2" />
  );

  return (
    <div className="flex justify-end gap-4 pt-4 border-t border-coc-gold-dark/20 mt-6">
      <Button
        type="button"
        variant="secondary"
        href={cancelHref}
      >
        <XIcon className="inline h-5 w-5 mr-2" /> 
        {t.knowledgeHub.create.cancelButton}
      </Button>
      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting || !isFormValid}
      >
        {submitIcon}
        {submitText}
      </Button>
    </div>
  );
};

export default FormActions;