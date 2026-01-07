'use client';

import React from 'react';
import { Button } from '@/app/components/ui/Button'; // Menggunakan Button yang sudah di-upgrade
import { InfoIcon, CheckIcon, XIcon, AlertTriangleIcon } from '@/app/components/icons';

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
    // REVISI: Menggunakan background gaming (gelap transparan) dengan border glowing
    const baseStyle = "fixed top-24 right-5 z-[100] p-4 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.5)] flex items-start gap-4 max-w-sm w-full animate-in slide-in-from-top-5 duration-300 backdrop-blur-xl border border-white/10 overflow-hidden group";
    
    let typeStyle = "";
    let IconComponent: React.ElementType | null = null;
    let iconColorClass = "";

    // Determine styles and icon based on notification type
    switch (type) {
      case 'success':
        typeStyle = "bg-[#0f1a15]/90 border-coc-green/30";
        iconColorClass = "text-coc-green";
        IconComponent = CheckIcon;
        break;
      case 'error':
        typeStyle = "bg-[#1a0f0f]/90 border-coc-red/30";
        iconColorClass = "text-coc-red";
        IconComponent = AlertTriangleIcon;
        break;
      case 'warning':
        typeStyle = "bg-[#1a160f]/90 border-yellow-500/30";
        iconColorClass = "text-yellow-400";
        IconComponent = AlertTriangleIcon;
        break;
      case 'info':
      default:
        typeStyle = "bg-[#0f111a]/90 border-coc-blue/30";
        iconColorClass = "text-coc-blue";
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
        {/* Left Accent Bar */}
        <div className={`absolute top-0 left-0 h-full w-1 ${type === 'success' ? 'bg-coc-green' : type === 'error' ? 'bg-coc-red' : type === 'warning' ? 'bg-yellow-500' : 'bg-coc-blue'}`} />
        
        {IconComponent && (
            <div className={`mt-0.5 p-1.5 rounded-full bg-white/5 border border-white/5 ${iconColorClass}`}>
                <IconComponent className="h-5 w-5 flex-shrink-0" />
            </div>
        )}
        
        <div className="flex-grow pt-1">
            <p className="text-sm font-medium text-white leading-snug font-sans tracking-wide">
                {message}
            </p>
        </div>

        {/* Close button */}
        <button 
            onClick={onClose} 
            className="ml-2 -mr-1 flex-shrink-0 text-gray-500 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-all"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // --- Confirmation Dialog (Modal) ---
  // REVISI: Menggunakan style yang mirip dengan AlertDialog yang baru (Gaming Modal)
  if (confirmation) {
    const { message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel } = confirmation;

    return (
      // Modal backdrop
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
        
        {/* Modal content */}
        <div className="relative w-full max-w-md rounded-3xl bg-[#15171e] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden transform scale-100 animate-in zoom-in-95 duration-300">
           
           {/* Top Accent Gradient (Red for caution as default for generic confirmation) */}
           <div className="h-1 w-full bg-gradient-to-r from-coc-red via-red-500 to-transparent shadow-[0_0_10px_rgba(220,38,38,0.5)]" />

           {/* Header / Icon Area */}
           <div className="pt-8 pb-4 flex justify-center relative z-10">
                <div className="p-4 rounded-full border-2 bg-coc-red/10 border-coc-red/30 shadow-[0_0_20px_rgba(220,38,38,0.2)] animate-pulse-slow">
                    <AlertTriangleIcon className="h-8 w-8 text-coc-red drop-shadow-md" />
                </div>
           </div>

           <div className="px-8 pb-8 text-center relative z-10">
             <h3 className="text-2xl font-clash font-bold text-white mb-3 tracking-wide uppercase drop-shadow-md">
                Konfirmasi Tindakan
             </h3>
             <p className="font-sans text-gray-400 text-sm leading-relaxed">
                {message}
             </p>
           </div>

           {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-3 bg-[#0a0a0b]/50 px-6 py-5 border-t border-white/5 justify-end backdrop-blur-md">
            <Button 
                variant="outline" 
                onClick={onCancel} 
                className="w-full sm:w-auto order-2 sm:order-1 border-white/10 hover:bg-white/5 text-gray-400 hover:text-white"
            >
              {cancelText}
            </Button>
            
            <Button 
                variant="danger" 
                onClick={onConfirm} 
                className="w-full sm:w-auto order-1 sm:order-2 font-bold tracking-wide shadow-lg shadow-red-900/20 hover:shadow-red-900/40"
            >
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