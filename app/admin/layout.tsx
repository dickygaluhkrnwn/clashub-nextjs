'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AdminRoute from '@/app/components/auth/AdminRoute';
import {
  HomeIcon,
  CogsIcon,
  UsersIcon,
  TrophyIcon,
  ShieldIcon,
  LogOutIcon,
  GlobeIcon,
  MegaphoneIcon,
  AlertTriangleIcon // [BARU] Import AlertTriangleIcon
} from '@/app/components/icons';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Membungkus seluruh layout admin dengan AdminRoute untuk keamanan
    <AdminRoute>
      <div className="min-h-screen bg-coc-dark text-white flex flex-col md:flex-row">
        
        {/* --- ADMIN SIDEBAR --- */}
        <aside className="w-full md:w-64 bg-[#121212] border-b md:border-b-0 md:border-r border-white/10 flex-shrink-0">
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="bg-coc-red/20 p-2 rounded-lg border border-coc-red/30">
              <CogsIcon className="h-6 w-6 text-coc-red" />
            </div>
            <div>
              <h1 className="font-clash text-lg text-white tracking-wide">MASTER ADMIN</h1>
              <p className="text-xs text-gray-500">Clashub Control Room</p>
            </div>
          </div>

          <nav className="p-4 space-y-1">
            <AdminNavItem 
              href="/admin/dashboard" 
              icon={<HomeIcon className="h-5 w-5" />} 
              label="Dashboard" 
            />
            
            <AdminNavItem 
              href="/admin/clans" 
              icon={<ShieldIcon className="h-5 w-5" />} 
              label="Clan Manager" 
            />

            <AdminNavItem 
              href="/admin/announcements" 
              icon={<MegaphoneIcon className="h-5 w-5" />} 
              label="Announcements" 
            />
            <AdminNavItem 
              href="/admin/youtube" 
              icon={<GlobeIcon className="h-5 w-5" />} 
              label="YouTube Manager" 
            />
            <AdminNavItem 
              href="/admin/users" 
              icon={<UsersIcon className="h-5 w-5" />} 
              label="User Management" 
            />

            {/* [BARU] Menu Maintenance */}
            <AdminNavItem 
              href="/admin/maintenance" 
              icon={<AlertTriangleIcon className="h-5 w-5" />} 
              label="Maintenance Mode" 
            />
            
            <div className="my-4 border-t border-white/10 mx-2"></div>
            
            <AdminNavItem 
              href="/" 
              icon={<LogOutIcon className="h-5 w-5" />} 
              label="Kembali ke App" 
              variant="ghost"
            />
          </nav>
        </aside>

        {/* --- MAIN CONTENT AREA --- */}
        <main className="flex-1 overflow-y-auto bg-black/20 p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>

      </div>
    </AdminRoute>
  );
}

// Helper Component untuk Link Sidebar
const AdminNavItem = ({ href, icon, label, variant = 'default' }: { href: string; icon: React.ReactNode; label: string; variant?: 'default' | 'ghost' }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (variant === 'ghost') {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-all group"
      >
        <span className="group-hover:-translate-x-1 transition-transform duration-200">{icon}</span>
        <span className="font-medium">{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
        ${isActive 
          ? 'bg-coc-red/10 text-coc-red border border-coc-red/20 shadow-[0_0_15px_rgba(255,0,0,0.1)]' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      <span className={isActive ? 'text-coc-red' : 'text-gray-500'}>{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
};