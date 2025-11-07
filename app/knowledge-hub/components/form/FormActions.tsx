'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { XIcon } from '@/app/components/icons';

interface FormActionsProps {
  isEditMode: boolean;
  isSubmitting: boolean;
  submitIcon: React.ReactNode;
  submitText: string;
  initialPostId?: string; // Diperlukan untuk link 'Batal' di mode edit
}

/**
 * Komponen modular untuk tombol Aksi (Batal dan Submit/Publikasikan).
 * Mengambil semua properti dari usePostForm.
 */
const FormActions: React.FC<FormActionsProps> = ({
  isEditMode,
  isSubmitting,
  submitIcon,
  submitText,
  initialPostId,
}) => {
  // Tentukan tujuan link Batal: kembali ke post yang diedit atau ke hub utama
  const cancelHref = isEditMode && initialPostId 
    ? `/knowledge-hub/${initialPostId}` 
    : '/knowledge-hub';

  return (
    <div className="flex justify-end gap-4 pt-4 border-t border-coc-gold-dark/20 mt-6">
      {/* Tombol Batal (sebagai Link) */}
      <Button
        variant="secondary"
        href={cancelHref}
        // Mengganti 'disabled' dengan kelas CSS untuk Link
        // Menambahkan pointer-events-none dan opacity untuk meniru efek disabled pada elemen <a>
        className={isSubmitting ? 'pointer-events-none opacity-50' : ''}
      >
        <XIcon className="inline h-5 w-5 mr-2" /> Batal
      </Button>
      
      {/* Tombol Submit */}
      <Button
        type="submit"
        variant="primary"
        disabled={isSubmitting} // Atribut disabled yang berfungsi pada elemen <button>
      >
        {submitIcon}
        {submitText}
      </Button>
    </div>
  );
};

export default FormActions;