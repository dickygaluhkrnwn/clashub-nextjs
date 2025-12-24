'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import {
  BellIcon,
  CheckIcon,
  Loader2Icon,
  XIcon,
  AlertTriangleIcon,
  InfoIcon
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
  type?: 'info' | 'danger' | 'warning' | 'success'; // Diperluas tipe-nya
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
  onConfirm,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  isConfirmLoading = false,
  type = 'info',
}) => {
  if (!isOpen) return null;

  // Tentukan apakah ini dialog konfirmasi atau hanya info
  const isConfirmationDialog = onConfirm !== undefined;

  // Helper untuk mendapatkan ikon & warna berdasarkan tipe
  const getHeaderStyle = () => {
    switch (type) {
      case 'danger':
        return {
          icon: <AlertTriangleIcon className="h-8 w-8 text-coc-red drop-shadow-md" />,
          bgIcon: 'bg-coc-red/20 border-coc-red/30',
          titleColor: 'text-white'
        };
      case 'warning':
        return {
          icon: <AlertTriangleIcon className="h-8 w-8 text-yellow-400 drop-shadow-md" />,
          bgIcon: 'bg-yellow-500/20 border-yellow-500/30',
          titleColor: 'text-white'
        };
      case 'success':
        return {
          icon: <CheckIcon className="h-8 w-8 text-coc-green drop-shadow-md" />,
          bgIcon: 'bg-coc-green/20 border-coc-green/30',
          titleColor: 'text-white'
        };
      case 'info':
      default:
        return {
          icon: <InfoIcon className="h-8 w-8 text-coc-blue drop-shadow-md" />,
          bgIcon: 'bg-coc-blue/20 border-coc-blue/30',
          titleColor: 'text-white'
        };
    }
  };

  const headerStyle = getHeaderStyle();

  return (
    // Overlay Backdrop
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border border-white/10 shadow-2xl overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
      >
        
        {/* Decorative Top Gradient Line */}
        <div className={`h-1 w-full bg-gradient-to-r ${
            type === 'danger' ? 'from-coc-red via-red-500 to-transparent' : 
            type === 'warning' ? 'from-yellow-500 via-yellow-400 to-transparent' :
            type === 'success' ? 'from-coc-green via-green-400 to-transparent' :
            'from-coc-blue via-blue-400 to-transparent'
        }`} />

        {/* Header Icon Centered */}
        <div className="pt-8 pb-2 flex justify-center">
            <div className={`p-4 rounded-full border ${headerStyle.bgIcon}`}>
                {headerStyle.icon}
            </div>
        </div>

        {/* Title & Message */}
        <div className="px-6 pb-6 text-center">
          <h3 id="alert-dialog-title" className={`text-xl font-clash ${headerStyle.titleColor} mb-3 tracking-wide`}>
            {title}
          </h3>
          <p className="font-sans text-gray-300 text-sm leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 bg-black/20 px-6 py-5 border-t border-white/5 justify-end">
          {isConfirmationDialog ? (
            // Mode Konfirmasi (Tombol Batal & Konfirmasi)
            <>
              <Button
                type="button"
                variant="ghost" // Tombol Batal lebih subtle
                onClick={onClose}
                disabled={isConfirmLoading}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                {cancelText}
              </Button>
              
              <Button
                type="button"
                variant={type === 'danger' ? 'danger' : 'primary'} // Tombol Konfirmasi menonjol
                onClick={onConfirm}
                disabled={isConfirmLoading}
                className={`w-full sm:w-auto order-1 sm:order-2 ${type === 'danger' ? 'shadow-lg shadow-red-900/20' : ''}`}
              >
                {isConfirmLoading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckIcon className="h-4 w-4 mr-2" />
                )}
                {isConfirmLoading ? 'Memproses...' : confirmText}
              </Button>
            </>
          ) : (
            // Mode Info (Tombol "Saya Mengerti" saja)
            <Button 
                type="button" 
                variant="primary" 
                onClick={onClose}
                className="w-full sm:w-auto"
            >
              <CheckIcon className="h-4 w-4 mr-2" />
              Saya Mengerti
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;