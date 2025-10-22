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

    // Base style for the notification container
    const baseStyle = "fixed top-5 right-5 z-[100] p-4 rounded-lg shadow-lg flex items-start gap-3 max-w-sm animate-fade-in-down";
    let typeStyle = "";
    let IconComponent: React.ElementType | null = null;

    // Determine styles and icon based on notification type
    switch (type) {
      case 'success':
        typeStyle = "bg-coc-green/80 border border-coc-green text-white";
        IconComponent = CheckIcon;
        break;
      case 'error':
        typeStyle = "bg-coc-red/80 border border-coc-red text-white";
        IconComponent = AlertTriangleIcon;
        break;
      case 'warning':
        typeStyle = "bg-yellow-500/80 border border-yellow-600 text-coc-stone";
        IconComponent = AlertTriangleIcon;
        break;
      case 'info':
      default:
        typeStyle = "bg-sky-600/80 border border-sky-700 text-white";
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
        <span className="flex-grow text-sm font-medium">{message}</span>
        {/* Close button */}
        <button onClick={onClose} className="ml-4 flex-shrink-0 opacity-70 hover:opacity-100">
          <XIcon className="h-5 w-5" />
        </button>
      </div>
    );
  }

  // --- Confirmation Dialog (Modal) ---
  if (confirmation) {
    const { message, confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onCancel } = confirmation;

    return (
      // Modal backdrop
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
        {/* Modal content using card-stone style */}
        <div className="card-stone p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
           {/* Message area with icon */}
           <div className="flex items-start gap-3 mb-4">
             <AlertTriangleIcon className="h-6 w-6 text-coc-gold flex-shrink-0 mt-1" />
             <p className="text-lg text-gray-200">{message}</p>
           </div>
           {/* Action buttons */}
          <div className="flex justify-end gap-4 mt-6">
            <Button variant="secondary" onClick={onCancel}>
              {cancelText}
            </Button>
            {/* Confirmation button styled distinctly (red for potential destructive actions) */}
            <Button variant="primary" onClick={onConfirm} className="bg-coc-red hover:bg-coc-red/80 border-coc-red shadow-none text-white">
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

// --- Tailwind Animations (ensure these are in globals.css) ---
/*
@keyframes fade-in-down {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in-down { animation: fade-in-down 0.3s ease-out forwards; }
.animate-fade-in { animation: fade-in 0.2s ease-out forwards; }
*/

export default Notification;
