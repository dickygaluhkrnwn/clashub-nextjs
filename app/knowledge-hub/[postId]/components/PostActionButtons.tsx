'use client';

import React, { useState, useMemo } from 'react'; // [TAMBAHAN] Import useMemo
import { useRouter } from 'next/navigation';
import { Button } from '@/app/components/ui/Button';
import Notification, {
  ConfirmationProps,
  NotificationProps,
} from '@/app/components/ui/Notification';
// [TAMBAHAN] Import HeartIcon dan ServerUser
import {
  EditIcon,
  TrashIcon,
  RefreshCwIcon,
  HeartIcon,
} from '@/app/components/icons';
import { ServerUser } from '@/lib/server-auth';
import { useAuth } from '@/app/context/AuthContext'; // [TAMBAHAN] Import useAuth

// [PERUBAHAN] Definisikan props untuk komponen ini
interface PostActionButtonsProps {
  postId: string;
  isAuthor: boolean;
  initialLikes: string[]; // Prop baru dari page.tsx
  sessionUser: ServerUser | null; // Prop baru dari page.tsx
}

/**
 * @component PostActionButtons
 * Menangani logika like, edit, dan delete postingan. Ini adalah Client Component.
 */
const PostActionButtons: React.FC<PostActionButtonsProps> = ({
  postId,
  isAuthor,
  initialLikes,
  sessionUser, // Prop ini bisa digunakan untuk mengecek login awal
}) => {
  // --- Hooks yang Sudah Ada ---
  const router = useRouter();
  const [notification, setNotification] = useState<NotificationProps | null>(
    null,
  );
  const [confirmation, setConfirmation] = useState<ConfirmationProps | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // --- [BARU] Hooks untuk Fitur Like ---
  const { userProfile, loading: authLoading } = useAuth(); // Ambil profil pengguna client-side
  const [likes, setLikes] = useState<string[]>(initialLikes);
  const [isLiking, setIsLiking] = useState(false);

  // Cek apakah pengguna saat ini (client-side) sudah me-like
  const isLiked = useMemo(() => {
    if (!userProfile?.uid) return false;
    return likes.includes(userProfile.uid);
  }, [likes, userProfile]);
  // --- [AKHIR BARU] ---

  // Helper untuk menampilkan notifikasi
  const showNotification = (
    message: string,
    type: NotificationProps['type'],
  ) => {
    setNotification({ message, type, onClose: () => setNotification(null) });
  };

  // Handler untuk menampilkan konfirmasi sebelum menghapus
  const confirmDelete = () => {
    setConfirmation({
      message:
        'Apakah Anda yakin ingin menghapus postingan ini? Aksi ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus Permanen',
      cancelText: 'Batal',
      onConfirm: handleDelete,
      onCancel: () => setConfirmation(null),
    });
  };

  // Handler penghapusan (memanggil API DELETE)
  const handleDelete = async () => {
    // ... (Logika handleDelete tetap sama, tidak perlu diubah) ...
    setConfirmation(null); // Tutup modal konfirmasi
    setIsDeleting(true);
    showNotification('Menghapus postingan...', 'info');

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
      const errorMessage =
        (err as Error).message || 'Terjadi kesalahan saat menghapus postingan.';
      showNotification(errorMessage, 'error');
      setIsDeleting(false);
    }
  };

  // --- [BARU] Handler untuk Like/Unlike (memanggil API POST) ---
  const handleLike = async () => {
    // Cegah aksi jika sedang proses liking, auth belum selesai, atau pengguna tidak login
    if (isLiking || authLoading) return;

    // Cek jika pengguna login (dari client-side context)
    if (!userProfile?.uid) {
      showNotification('Anda harus login untuk menyukai postingan', 'error');
      return;
    }

    setIsLiking(true);
    const currentUid = userProfile.uid;

    // 1. Optimistic Update (Update UI terlebih dahulu)
    if (isLiked) {
      // Jika sudah like -> Unlike
      setLikes((prev) => prev.filter((uid) => uid !== currentUid));
    } else {
      // Jika belum like -> Like
      setLikes((prev) => [...prev, currentUid]);
    }

    // 2. Panggil API di background
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal memproses like');
      }

      // Sukses: Cek apakah status API (result.newLikeStatus)
      // sesuai dengan status UI (isLiked baru, yaitu !isLiked lama).
      // Jika tidak sesuai, kita revert.
      const newIsLiked = !isLiked;
      if (result.newLikeStatus !== newIsLiked) {
        // Terjadi desinkronisasi, revert ke data awal
        setLikes(initialLikes);
      }
      // Jika sesuai, biarkan state optimistic update
    } catch (err) {
      // 3. Revert state jika API call gagal
      setLikes(initialLikes);
      const errorMessage =
        (err as Error).message || 'Terjadi kesalahan saat menyukai.';
      showNotification(errorMessage, 'error');
    } finally {
      setIsLiking(false);
    }
  };
  // --- [AKHIR BARU] ---

  return (
    <React.Fragment>
      {/* Notifikasi / Konfirmasi (Modal) */}
      {notification && <Notification notification={notification} />}
      {confirmation && <Notification confirmation={confirmation} />}

      {/* [PERUBAHAN] Container diubah menjadi flex justify-between */}
      <div className="flex justify-between items-center gap-4 pt-4 border-t border-coc-gold-dark/20">
        
        {/* [BARU] Tombol Like (Sisi Kiri) */}
        <div>
          <Button
            variant={isLiked ? 'primary' : 'secondary'}
            size="sm"
            onClick={handleLike}
            // Nonaktifkan jika sedang liking, auth loading, atau pengguna tidak login (dari server prop)
            disabled={isLiking || authLoading || !sessionUser}
            className={`flex items-center gap-2 ${
              isLiked
                ? 'bg-coc-red/90 border-coc-red text-white hover:bg-coc-red'
                : ''
            }`}
          >
            {isLiking ? (
              <RefreshCwIcon className="h-4 w-4 animate-spin" />
            ) : (
              // Tampilkan ikon hati solid jika di-like, jika tidak, outline
              <HeartIcon
                className="h-4 w-4"
                fill={isLiked ? 'currentColor' : 'none'}
              />
            )}
            <span>{likes.length} Suka</span>
          </Button>
        </div>
        {/* [AKHIR BARU] */}

        {/* Tombol Aksi Penulis (Sisi Kanan) */}
        {isAuthor && (
          <div className="flex justify-end gap-4">
            {/* Tombol Edit */}
            <Button
              href={`/knowledge-hub/create?postId=${postId}`}
              variant="secondary"
              size="sm"
              // Nonaktifkan tombol edit jika sedang proses hapus
              className={
                isDeleting
                  ? 'opacity-50 cursor-not-allowed pointer-events-none'
                  : ''
              }
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
              {isDeleting ? (
                <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TrashIcon className="h-4 w-4 mr-2" />
              )}
              {isDeleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </div>
        )}
      </div>
    </React.Fragment>
  );
};

export default PostActionButtons;