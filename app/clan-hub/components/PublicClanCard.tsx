import React from 'react';
import Link from 'next/link';
import { PublicClanIndex } from '@/lib/types';
import { Button } from '@/app/components/ui/Button';
import { ShieldIcon, TrophyIcon, UserIcon } from '@/app/components/icons';

interface PublicClanCardProps {
  clan: PublicClanIndex;
}

export const PublicClanCard = ({ clan }: PublicClanCardProps) => {
  const cocProfileUrl = `/clan/${encodeURIComponent(clan.tag)}`;

  return (
    // [VISUAL UPDATE]
    // - bg-gradient: Memberikan dimensi halus dari atas ke bawah
    // - border-white/5: Border sangat tipis dan elegan
    // - hover:border-coc-gold/40: Highlight saat di-hover
    <div className="flex flex-col justify-between h-full p-5 rounded-2xl bg-gradient-to-b from-coc-stone to-[#1a1a1a] border border-white/10 hover:border-coc-gold/40 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)] hover:-translate-y-1 group">
      <div>
        {/* Header Card */}
        <div className="flex items-start gap-4 mb-5 pb-4 border-b border-white/5 relative">
          <div className="relative flex-shrink-0">
             <div className="w-16 h-16 rounded-xl bg-black/30 flex items-center justify-center p-1 border border-white/5 group-hover:border-coc-gold/20 transition-colors">
                <img 
                    src={clan.badgeUrls?.large || '/images/clan-badge-placeholder.png'}
                    alt={`${clan.name} Badge`}
                    className="w-full h-full object-contain drop-shadow-md group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/images/clan-badge-placeholder.png';
                    }}
                />
             </div>
             {/* Badge Level Keren */}
            <div className="absolute -bottom-2 -right-2 bg-[#1a1a1a] text-[10px] px-2 py-0.5 rounded-full border border-coc-gold text-coc-gold font-bold shadow-sm">
                Lvl {clan.clanLevel}
            </div>
          </div>
          
          <div className="flex-grow min-w-0 pt-1">
            <h4 className="font-clash text-lg text-white leading-tight truncate group-hover:text-coc-gold transition-colors tracking-wide">
              {clan.name}
            </h4>
            <p className="text-xs text-gray-500 font-mono mb-2">{clan.tag}</p>
            
            {/* Lokasi */}
            {clan.location && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 text-[10px] text-gray-400 border border-white/5">
                    <span>📍</span> {clan.location.name}
                </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="flex flex-col bg-black/20 p-2.5 rounded-lg border border-white/5">
            <span className="text-gray-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1.5">
                <UserIcon className="w-3 h-3 opacity-70"/> Anggota
            </span>
            <span className="font-bold text-white text-sm font-clash tracking-wide">{clan.memberCount}<span className="text-gray-600">/50</span></span>
          </div>
          
          <div className="flex flex-col bg-black/20 p-2.5 rounded-lg border border-white/5">
            <span className="text-gray-500 text-[10px] uppercase font-bold mb-1 flex items-center gap-1.5">
                <TrophyIcon className="w-3 h-3 text-coc-gold opacity-80"/> Poin
            </span>
            <span className="font-bold text-coc-gold text-sm font-clash tracking-wide">
              {clan.clanPoints?.toLocaleString() || '0'}
            </span>
          </div>

          <div className="col-span-2 flex flex-col bg-black/20 p-2.5 rounded-lg border border-white/5">
             <div className="flex justify-between items-center">
                <span className="text-gray-500 text-[10px] uppercase font-bold">Status</span>
                <span className={`font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    clan.type === 'inviteOnly' ? 'bg-coc-orange/10 text-coc-orange border border-coc-orange/30' :
                    clan.type === 'closed' ? 'bg-coc-red/10 text-coc-red border border-coc-red/30' :
                    'bg-coc-green/10 text-coc-green border border-coc-green/30'
                }`}>
                    {clan.type === 'inviteOnly' ? 'Invite Only' : clan.type === 'closed' ? 'Closed' : 'Open'}
                </span>
             </div>
          </div>
        </div>
      </div>
      
      {/* Tombol Action */}
      <Link href={cocProfileUrl} className="mt-auto block w-full group/btn">
        <Button variant="secondary" className="w-full justify-center text-sm py-3 bg-[#252525] border-white/5 group-hover/btn:bg-[#333] group-hover/btn:text-white transition-colors">
          Lihat Detail
        </Button>
      </Link>
    </div>
  );
};