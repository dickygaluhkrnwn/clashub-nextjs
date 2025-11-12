'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import {
  BellIcon,
  CheckIcon,
  Loader2Icon, // [FASE 10.4] Tambahkan Loader
  XIcon, // [FASE 10.4] Tambahkan XIcon untuk Batal
} from '@/app/components/icons';

// [FASE 10.4] Modifikasi Props
interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  // Props Opsional untuk mode konfirmasi
  onConfirm?: () => Promise<void> | void;
  confirmText?: string;
  cancelText?: string;
  isConfirmLoading?: boolean;
  type?: 'info' | 'danger'; // Untuk style tombol konfirmasi
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm, // Prop baru
  confirmText = 'Konfirmasi', // Default text
  cancelText = 'Batal', // Default text
  isConfirmLoading = false, // Prop baru
  type = 'info', // Prop baru
}) => {
  if (!isOpen) return null;

  // Tentukan apakah ini dialog konfirmasi atau hanya info
  const isConfirmationDialog = onConfirm !== undefined;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-xl card-stone shadow-xl border-2 border-coc-gold/50">
        {/* Header Modal */}
        <div className="flex items-center p-4 border-b border-coc-gold-dark/30">
          <BellIcon className="h-6 w-6 mr-3 text-coc-yellow" />
          <h3 className="text-xl font-clash text-coc-gold">{title}</h3>
        </div>

        {/* Body Modal */}
        <div className="p-6">
          <p className="font-sans text-gray-200 whitespace-pre-line">
            {message}
      	  </p>
      	</div>

      	{/* [FASE 10.4] Footer Modal yang Dinamis */}
      	<div className="flex justify-end gap-3 bg-coc-stone-dark/40 px-6 py-4 rounded-b-xl">
      	  {isConfirmationDialog ? (
      		// Mode Konfirmasi (Tombol Batal & Konfirmasi)
      		<>
      		  <Button
      			type="button"
      			variant="secondary" // Tombol Batal
      			onClick={onClose}
      			disabled={isConfirmLoading}
      		  >
      			<XIcon className="h-5 w-5 mr-2" />
      			{cancelText}
      		  </Button>
      		  <Button
      			type="button"
      			variant={type === 'danger' ? 'danger' : 'primary'} // Tombol Konfirmasi
      			onClick={onConfirm}
      			disabled={isConfirmLoading}
      		  >
      			{isConfirmLoading ? (
      			  <Loader2Icon className="h-5 w-5 animate-spin mr-2" />
      			) : (
      			  <CheckIcon className="h-5 w-5 mr-2" />
      			)}
      			{isConfirmLoading ? 'Memproses...' : confirmText}
      		  </Button>
      		</>
      	  ) : (
      		// Mode Info (Tombol "Saya Mengerti" saja)
      		<Button type="button" variant="primary" onClick={onClose}>
      		  <CheckIcon className="h-5 w-5 mr-2" />
      		  Saya Mengerti
      		</Button>
      	  )}
      	</div>
      </div>
    </div>
  );
};

export default AlertDialog;