'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdmin } from '@/lib/hooks/useAdmin';
import { RefreshCwIcon, ShieldIcon } from '@/app/components/icons';

interface AdminRouteProps {
  children: React.ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAdmin, loading } = useAdmin();
  const router = useRouter();

  useEffect(() => {
    // Jika sudah selesai loading dan ternyata bukan admin, tendang ke home
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  // Tampilan Loading saat mengecek status admin
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-coc-dark">
        <RefreshCwIcon className="h-12 w-12 animate-spin text-coc-gold mb-4" />
        <p className="text-gray-400 font-clash tracking-wider animate-pulse">
          Verifikasi Akses Admin...
        </p>
      </div>
    );
  }

  // Jika bukan admin (sebelum redirect selesai), jangan render konten apapun
  if (!isAdmin) {
    return null;
  }

  // Jika Admin, render halaman yang diminta
  return <>{children}</>;
};

export default AdminRoute;