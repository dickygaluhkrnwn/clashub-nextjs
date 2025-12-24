'use client';

import React from 'react';
import { Button } from './Button'; // Assuming Button component path
import { InfoIcon, CheckIcon, XIcon, AlertTriangleIcon } from '@/app/components/icons'; // Import icons

// --- Types ---

export interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

export interface ConfirmationProps {
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface NotificationComponentProps {
  notification?: NotificationProps;
  confirmation?: ConfirmationProps;
}

// --- Component ---

const Notification: React.FC<NotificationComponentProps> = ({ notification, confirmation }) => {

  // --- Simple Notification (Toast) ---
  if (notification) {
    const { message, type, onClose } = notification;

    // Base style for the notification container (Glassmorphism + Animation)
    const baseStyle = "fixed top-20 right-5 z-[100] p-4 rounded-xl shadow-2xl flex items-start gap-3 max-w-sm w-full animate-in slide-in-from-top-5 duration-300 backdrop-blur-md border";
    let typeStyle = "";
    let IconComponent: React.ElementType | null = null;

    // Determine styles and icon based on notification type
    switch (type) {
      case 'success':
        typeStyle = "bg-green-900/80 border-green-500/50 text-green-100 shadow-green-900/20";
        IconComponent = CheckIcon;
        break;
      case 'error':
        typeStyle = "bg-red-900/80 border-red-500/50 text-red-100 shadow-red-900/20";
        IconComponent = AlertTriangleIcon;
        break;
      case 'warning':
        typeStyle = "bg-yellow-900/80 border-yellow-500/50 text-yellow-100 shadow-yellow-900/20";
        IconComponent = AlertTriangleIcon;
        break;
      case 'info':
      default:
        typeStyle = "bg-blue-900/80 border-blue-500/50 text-blue-100 shadow-blue-900/20";
        IconComponent = InfoIcon;
        break;
    }

    // Auto-close non-error notifications after 5 seconds
    React.useEffect(() => {
      if (type !== 'error') {
        const timer = setTimeout(() => {
          onClose();
        }, 5000);
        return () => clearTimeout(timer);
      }
    }, [onClose, type]);


    return (
      <div className={`${baseStyle} ${typeStyle}`}>
        {IconComponent && <IconComponent className="h-5 w-5 flex-shrink-0 mt-0.5" />}
        <span className="flex-grow text-sm font-medium leading-tight">{message}</span>
        {/* Close button */}
        <button 
            onClick={onClose} 
            className="ml-2 -mr-1 flex-shrink-0 opacity-70 hover:opacity-100 hover:bg-white/10 p-1 rounded-full transition-all"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // --- Confirmation Dialog (Modal) ---
  if (confirmation) {
    const { message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel } = confirmation;

    return (
      // Modal backdrop
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-4">
        {/* Modal content using card-stone style */}
        <div className="card-stone w-full max-w-md rounded-2xl bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] border border-white/10 shadow-2xl overflow-hidden transform scale-100 animate-in zoom-in-95 duration-200">
           
           {/* Header / Icon Area */}
           <div className="bg-gradient-to-r from-coc-red/20 to-transparent p-6 pb-0 flex justify-center">
                <div className="p-4 rounded-full bg-coc-red/20 border border-coc-red/30 mb-2">
                    <AlertTriangleIcon className="h-8 w-8 text-coc-red drop-shadow-md" />
                </div>
           </div>

           <div className="p-6 pt-2 text-center">
             <h3 className="text-xl font-clash text-white mb-2 tracking-wide">Konfirmasi Tindakan</h3>
             <p className="text-gray-300 text-sm leading-relaxed">{message}</p>
           </div>

           {/* Action buttons */}
          <div className="p-4 bg-black/20 border-t border-white/5 flex flex-col sm:flex-row gap-3 justify-end">
            <Button variant="ghost" onClick={onCancel} className="w-full sm:w-auto order-2 sm:order-1">
              {cancelText}
            </Button>
            {/* Confirmation button styled distinctly (red for potential destructive actions) */}
            <Button variant="danger" onClick={onConfirm} className="w-full sm:w-auto order-1 sm:order-2 shadow-lg shadow-red-900/20">
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Render nothing if neither notification nor confirmation props are provided
  return null;
};

export default Notification;