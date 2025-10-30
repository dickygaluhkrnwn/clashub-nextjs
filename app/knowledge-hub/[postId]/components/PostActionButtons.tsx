'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import Notification, { ConfirmationProps, NotificationProps } from '@/app/components/ui/Notification'; 
import { EditIcon, TrashIcon, RefreshCwIcon } from '@/app/components/icons';

// Definisikan props untuk komponen ini
interface PostActionButtonsProps {
    postId: string;
    isAuthor: boolean;
}

/**
 * @component PostActionButtons
 * Menangani logika edit dan delete postingan. Ini adalah Client Component.
 */
const PostActionButtons: React.FC<PostActionButtonsProps> = ({ postId, isAuthor }) => {
    
    // Hooks kini aman digunakan di sini karena ada 'use client' di awal file
    const router = useRouter();
    
    const [notification, setNotification] = useState<NotificationProps | null>(null);
    const [confirmation, setConfirmation] = useState<ConfirmationProps | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Helper untuk menampilkan notifikasi
    const showNotification = (message: string, type: NotificationProps['type']) => {
        setNotification({ message, type, onClose: () => setNotification(null) });
    };

    // Handler untuk menampilkan konfirmasi sebelum menghapus
    const confirmDelete = () => {
        setConfirmation({
            message: "Apakah Anda yakin ingin menghapus postingan ini? Aksi ini tidak dapat dibatalkan.",
            confirmText: "Ya, Hapus Permanen",
            cancelText: "Batal",
            onConfirm: handleDelete,
            onCancel: () => setConfirmation(null),
        });
    };

    // Handler penghapusan (memanggil API DELETE)
    const handleDelete = async () => {
        setConfirmation(null); // Tutup modal konfirmasi
        setIsDeleting(true);
        showNotification("Menghapus postingan...", 'info');
        
        try {
            // Memanggil API DELETE /api/posts/[postId]
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'DELETE',
            });

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Gagal menghapus postingan.');
            }

            showNotification(result.message, 'success');
            // Redirect ke Knowledge Hub setelah berhasil dihapus
            setTimeout(() => router.push('/knowledge-hub'), 1500);

        } catch (err) {
            const errorMessage = (err as Error).message || "Terjadi kesalahan saat menghapus postingan.";
            showNotification(errorMessage, 'error');
            setIsDeleting(false);
        }
    };

    // Jika bukan penulis, jangan tampilkan tombol
    if (!isAuthor) return null;

    return (
        <React.Fragment>
            {/* Notifikasi / Konfirmasi (Modal) */}
            {notification && <Notification notification={notification} />}
            {confirmation && <Notification confirmation={confirmation} />}

            <div className="flex justify-end gap-4 pt-4 border-t border-coc-gold-dark/20">
                {/* Tombol Edit */}
                <Button 
                    href={`/knowledge-hub/create?postId=${postId}`} 
                    variant="secondary" 
                    size="sm" 
                    // Nonaktifkan tombol edit jika sedang proses hapus
                    className={isDeleting ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''} 
                >
                    <EditIcon className="h-4 w-4 mr-2" /> Edit Postingan
                </Button>
                
                {/* Tombol Hapus */}
                <Button
                    onClick={confirmDelete}
                    variant="secondary"
                    size="sm"
                    disabled={isDeleting} 
                    className="bg-coc-red/70 border-coc-red text-white hover:bg-coc-red"
                >
                    {isDeleting ? <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" /> : <TrashIcon className="h-4 w-4 mr-2" />}
                    {isDeleting ? 'Menghapus...' : 'Hapus'}
                </Button>
            </div>
        </React.Fragment>
    );
};

export default PostActionButtons;
