import React from 'react';
import { ShieldIcon, UserIcon, GlobeIcon } from '@/app/components/icons';

// Definisikan tipe ActiveTab secara lokal.
// Di langkah terakhir, kita akan ekspor tipe ini dari TeamHubClient.tsx
// dan impor di sini agar tetap sinkron.
type ActiveTab = 'clashubTeams' | 'publicClans' | 'players';

interface TabButtonProps {
  tab: ActiveTab;
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  activeTab: ActiveTab;
  onClick: (tab: ActiveTab) => void;
}

// Sub-komponen internal untuk satu tombol tab
const TabButton = ({
  tab,
  label,
  icon: Icon,
  activeTab,
  onClick,
}: TabButtonProps) => (
  <button
    onClick={() => onClick(tab)}
    className={`flex items-center gap-2 py-3 px-6 font-clash text-lg transition-all duration-200 whitespace-nowrap
  ${
    activeTab === tab
      ? 'bg-coc-gold-dark text-white border-b-4 border-coc-gold'
      : 'bg-coc-stone/50 text-gray-400 hover:bg-coc-stone/80 hover:text-white'
  }`}
  >
    <Icon className="h-5 w-5" /> {label}
  </button>
);

interface TeamHubTabNavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

/**
 * Komponen untuk navigasi tab di halaman Clan Hub.
 * Diekstrak dari TeamHubClient.tsx (bagian <div className="flex border-b-2...">).
 */
export const TeamHubTabNavigation = ({
  activeTab,
  onTabChange,
}: TeamHubTabNavigationProps) => {
  return (
    <div className="flex border-b-2 border-coc-stone overflow-x-auto custom-scrollbar rounded-t-lg">
      <TabButton
        tab="clashubTeams"
        label="Tim Clashub"
        icon={ShieldIcon}
        activeTab={activeTab}
        onClick={onTabChange}
      />
      <TabButton
        tab="publicClans"
        label="Pencarian Klan"
        icon={GlobeIcon}
        activeTab={activeTab}
        onClick={onTabChange}
      />
      <TabButton
        tab="players"
        label="Cari Pemain"
        icon={UserIcon}
        activeTab={activeTab}
        onClick={onTabChange}
      />
    </div>
  );
};