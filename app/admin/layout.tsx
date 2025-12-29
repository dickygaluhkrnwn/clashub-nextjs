'use client';

import React, { useState } from 'react';
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
  AlertTriangleIcon,
  ChevronRightIcon,
  UserIcon,
  ImageIcon // [BARU] Import ImageIcon
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
        <aside className="w-full md:w-64 bg-[#121212] border-b md:border-b-0 md:border-r border-white/10 flex-shrink-0 flex flex-col h-screen sticky top-0 overflow-y-auto custom-scrollbar">
          <div className="p-6 border-b border-white/10 flex items-center gap-3">
            <div className="bg-coc-red/20 p-2 rounded-lg border border-coc-red/30">
              <CogsIcon className="h-6 w-6 text-coc-red" />
            </div>
            <div>
              <h1 className="font-clash text-lg text-white tracking-wide">MASTER ADMIN</h1>
              <p className="text-xs text-gray-500">Clashub Control Room</p>
            </div>
          </div>

          <nav className="p-4 space-y-1 flex-1">
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

            {/* Menu Group: Data Inspector */}
            <CollapsibleNavGroup 
              label="Data Inspector" 
              icon={<CogsIcon className="h-5 w-5" />}
            >
               <AdminNavItem 
                  href="/admin/debug/clan" 
                  icon={<ShieldIcon className="h-4 w-4" />} 
                  label="Clan Inspector" 
                  isSubItem
                />
                <AdminNavItem 
                  href="/admin/debug/user" 
                  icon={<UserIcon className="h-4 w-4" />} 
                  label="User Inspector" 
                  isSubItem
                />
            </CollapsibleNavGroup>

            {/* [BARU] Menu Asset Manager */}
            <AdminNavItem 
              href="/admin/assets" 
              icon={<ImageIcon className="h-5 w-5" />} 
              label="Asset Manager" 
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

            <AdminNavItem 
              href="/admin/maintenance" 
              icon={<AlertTriangleIcon className="h-5 w-5" />} 
              label="Maintenance Mode" 
            />
          </nav>

          <div className="p-4 border-t border-white/10">
            <AdminNavItem 
              href="/" 
              icon={<LogOutIcon className="h-5 w-5" />} 
              label="Kembali ke App" 
              variant="ghost"
            />
          </div>
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
const AdminNavItem = ({ href, icon, label, variant = 'default', isSubItem = false }: { href: string; icon: React.ReactNode; label: string; variant?: 'default' | 'ghost'; isSubItem?: boolean }) => {
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
        flex items-center gap-3 rounded-xl transition-all duration-200
        ${isSubItem ? 'px-4 py-2 text-sm' : 'px-4 py-3'}
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

// Helper Component untuk Group Menu yang Bisa Di-collapse
const CollapsibleNavGroup = ({ label, icon, children }: { label: string, icon: React.ReactNode, children: React.ReactNode }) => {
  const pathname = usePathname();
  // Auto open jika salah satu anak aktif
  const hasActiveChild = React.Children.toArray(children).some((child: any) => 
    child.props.href === pathname
  );
  
  const [isOpen, setIsOpen] = useState(hasActiveChild);

  // Update open state jika path berubah dan anak jadi aktif
  React.useEffect(() => {
    if (hasActiveChild) setIsOpen(true);
  }, [hasActiveChild]);

  return (
    <div className="space-y-1 my-1">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-gray-400 hover:text-white hover:bg-white/5 ${hasActiveChild ? 'text-white font-medium' : ''}`}
      >
        <div className="flex items-center gap-3">
          <span>{icon}</span>
          <span>{label}</span>
        </div>
        <ChevronRightIcon className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
      </button>
      
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="pl-4 border-l border-white/10 ml-6 space-y-1">
          {children}
        </div>
      </div>
    </div>
  );
};