'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import {
  CheckIcon,
  Loader2Icon,
  AlertTriangleIcon,
  InfoIcon,
  XIcon
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
          icon: <AlertTriangleIcon className="h-8 w-8 text-coc-red drop-shadow-[0_2px_4px_rgba(220,38,38,0.5)]" />,
          bgIcon: 'bg-coc-red/10 border-coc-red/30 shadow-[0_0_20px_rgba(220,38,38,0.2)]',
          titleColor: 'text-white',
          glowColor: 'bg-coc-red/20'
        };
      case 'warning':
        return {
          icon: <AlertTriangleIcon className="h-8 w-8 text-yellow-400 drop-shadow-[0_2px_4px_rgba(250,204,21,0.5)]" />,
          bgIcon: 'bg-yellow-500/10 border-yellow-500/30 shadow-[0_0_20px_rgba(250,204,21,0.2)]',
          titleColor: 'text-white',
          glowColor: 'bg-yellow-500/20'
        };
      case 'success':
        return {
          icon: <CheckIcon className="h-8 w-8 text-coc-green drop-shadow-[0_2px_4px_rgba(74,222,128,0.5)]" />,
          bgIcon: 'bg-coc-green/10 border-coc-green/30 shadow-[0_0_20px_rgba(74,222,128,0.2)]',
          titleColor: 'text-white',
          glowColor: 'bg-coc-green/20'
        };
      case 'info':
      default:
        return {
          icon: <InfoIcon className="h-8 w-8 text-coc-blue drop-shadow-[0_2px_4px_rgba(59,130,246,0.5)]" />,
          bgIcon: 'bg-coc-blue/10 border-coc-blue/30 shadow-[0_0_20px_rgba(59,130,246,0.2)]',
          titleColor: 'text-white',
          glowColor: 'bg-coc-blue/20'
        };
    }
  };

  const headerStyle = getHeaderStyle();

  return (
    // Overlay Backdrop
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      
      {/* Modal Content */}
      <div 
        className="relative w-full max-w-md rounded-3xl bg-[#15171e] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transform scale-100 animate-in zoom-in-95 duration-300 group"
        role="dialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
      >
        
        {/* Background Ambient Glow */}
        <div className={`absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full blur-[80px] pointer-events-none opacity-30 ${headerStyle.glowColor}`} />

        {/* Decorative Top Gradient Line */}
        <div className={`h-1 w-full bg-gradient-to-r ${
            type === 'danger' ? 'from-coc-red via-red-500 to-transparent' : 
            type === 'warning' ? 'from-yellow-500 via-yellow-400 to-transparent' :
            type === 'success' ? 'from-coc-green via-green-400 to-transparent' :
            'from-coc-blue via-blue-400 to-transparent'
        } shadow-[0_0_10px_currentColor]`} />

        {/* Header Icon Centered */}
        <div className="pt-8 pb-4 flex justify-center relative z-10">
            <div className={`p-4 rounded-full border-2 ${headerStyle.bgIcon} backdrop-blur-sm animate-pulse-slow`}>
                {headerStyle.icon}
            </div>
        </div>

        {/* Title & Message */}
        <div className="px-8 pb-8 text-center relative z-10">
          <h3 id="alert-dialog-title" className={`text-2xl font-clash font-bold ${headerStyle.titleColor} mb-3 tracking-wide uppercase drop-shadow-md`}>
            {title}
          </h3>
          <p className="font-sans text-gray-400 text-sm leading-relaxed whitespace-pre-line">
            {message}
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row gap-3 bg-[#0a0a0b]/50 px-6 py-5 border-t border-white/5 justify-end backdrop-blur-md">
          {isConfirmationDialog ? (
            // Mode Konfirmasi (Tombol Batal & Konfirmasi)
            <>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isConfirmLoading}
                className="w-full sm:w-auto order-2 sm:order-1 border-white/10 hover:bg-white/5 text-gray-400 hover:text-white"
              >
                {cancelText}
              </Button>
              
              <Button
                type="button"
                variant={type === 'danger' ? 'danger' : 'primary'}
                onClick={onConfirm}
                disabled={isConfirmLoading}
                className={`w-full sm:w-auto order-1 sm:order-2 font-bold tracking-wide shadow-lg ${
                    type === 'danger' 
                        ? 'shadow-red-900/20 hover:shadow-red-900/40' 
                        : 'shadow-coc-blue/20 hover:shadow-coc-blue/40'
                }`}
              >
                {isConfirmLoading ? (
                  <Loader2Icon className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckIcon className="h-4 w-4 mr-2 stroke-[3px]" />
                )}
                {isConfirmLoading ? 'PROCESSING...' : confirmText.toUpperCase()}
              </Button>
            </>
          ) : (
            // Mode Info (Tombol "Saya Mengerti" saja)
            <Button 
                type="button" 
                variant="primary" 
                onClick={onClose}
                className="w-full sm:w-auto font-bold tracking-wide shadow-lg shadow-coc-blue/20"
            >
              <CheckIcon className="h-4 w-4 mr-2 stroke-[3px]" />
              SAYA MENGERTI
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;