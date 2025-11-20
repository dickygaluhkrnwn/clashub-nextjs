'use client';

import React from 'react';
import { TopPerformerPlayer } from '@/lib/types';
import { ArrowUpIcon, ArrowDownIcon } from '@/app/components/icons';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook

interface TopPerformersCardProps {
    title: string;
    icon: React.ReactNode;
    value: number | string;
    description: string;
    className: string;
    players?: TopPerformerPlayer[];
    isPlayerList?: boolean;
}

/**
 * Komponen kartu untuk menampilkan metrik Ringkasan (Top Performers, Promosi/Demosi).
 */
const TopPerformersCard: React.FC<TopPerformersCardProps> = ({ 
    title, icon, value, description, className, players, isPlayerList = false 
}) => {
    const { t, language } = useLanguage(); // [BARU] Init Hook
    const locale = language === 'id' ? 'id-ID' : 'en-US';

    // Helper untuk memformat nilai
    const formatValue = (val: number | string) => {
        if (typeof val === 'number') {
            return val.toLocaleString(locale);
        }
        return val;
    };

    return (
        <div className={`p-4 rounded-xl shadow-xl ${className} flex flex-col justify-between h-full`}>
            <div>
                <div className="flex items-center justify-between">
                    <h3 className="text-sm md:text-md font-clash uppercase tracking-wider">{title}</h3>
                    {/* Icon sekarang hanya menerima elemen React Node (ikon) */}
                    {icon}
                </div>
                
                {isPlayerList && players && players.length > 0 ? (
                    <div className="mt-3 space-y-2">
                        {players.slice(0, 3).map((player, index) => (
                            <div key={player.tag} className="flex items-center text-sm font-semibold">
                                <span className="mr-2 text-xs text-white/70">{index + 1}.</span>
                                <span className="truncate">{player.name}</span>
                                {title.includes('Promosi') && <ArrowUpIcon className="h-4 w-4 ml-1 text-coc-green flex-shrink-0" />}
                                {title.includes('Promotion') && <ArrowUpIcon className="h-4 w-4 ml-1 text-coc-green flex-shrink-0" />}
                                
                                {title.includes('Demosi') && <ArrowDownIcon className="h-4 w-4 ml-1 text-coc-red flex-shrink-0" />}
                                {title.includes('Demotion') && <ArrowDownIcon className="h-4 w-4 ml-1 text-coc-red flex-shrink-0" />}
                            </div>
                        ))}
                        {players.length > 3 && (
                            <p className="text-xs text-white/50 mt-1">
                                +{players.length - 3} {t.common.remaining.toLowerCase()}...
                            </p>
                        )}
                    </div>
                ) : (
                    <>
                        <p className="text-3xl font-clash mt-2">{formatValue(value)}</p>
                        <p className="text-xs text-white/70 mt-1 font-sans">{description}</p>
                    </>
                )}
            </div>
        </div>
    );
};

export default TopPerformersCard;