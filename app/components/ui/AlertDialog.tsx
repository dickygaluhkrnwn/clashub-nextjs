'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button';
import { BellIcon, CheckIcon } from '@/app/components/icons';

interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  isOpen,
  onClose,
  title,
  message,
}) => {
  if (!isOpen) return null;

  return (
    // [PERBAIKAN-2] Gunakan z-[60] (Tailwind Arbitrary Value)
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

        {/* Footer Modal */}
        <div className="flex justify-end gap-3 bg-coc-stone-dark/40 px-6 py-4 rounded-b-xl">
          <Button type="button" variant="primary" onClick={onClose}>
            <CheckIcon className="h-5 w-5 mr-2" />
            Saya Mengerti
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AlertDialog;