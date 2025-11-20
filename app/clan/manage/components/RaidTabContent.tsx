'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { CocRaidLog, CocRaidMember, ManagedClan, FirestoreDocument, RaidArchive } from '@/lib/types'; 
import { useManagedClanRaid } from '@/lib/hooks/useManagedClan';
import { 
    CoinsIcon, RefreshCwIcon, ChevronDownIcon, ChevronUpIcon, ClockIcon, 
    StarIcon, UserIcon, ShieldIcon, SwordsIcon, TrophyIcon, 
    ArrowUpIcon, ArrowDownIcon, Loader2Icon, AlertTriangleIcon
} from '@/app/components/icons';
import { Button } from '@/app/components/ui/Button';
import { useLanguage } from '@/lib/hooks/useLanguage'; // [BARU] Hook

// --- TIPE SORTIR BARU ---
type RaidSortKey = 'endTime' | 'capitalTotalLoot' | 'totalAttacks' | 'id'; 
type SortDirection = 'asc' | 'desc';

interface RaidTabContentProps {
    clan: ManagedClan;
}

// ======================================================================================================
// Helper Functions
// ======================================================================================================

const formatDate = (dateInput: Date | string | undefined, locale: string, includeTime: boolean = true): string => {
    if (!dateInput) return 'N/A';
    try {
        const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
        if (isNaN(date.getTime())) return 'Invalid Date'; 
        
        const options: Intl.DateTimeFormatOptions = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        if (includeTime) {
            options.hour = '2-digit';
            options.minute = '2-digit';
        }
        
        // [i18n] Gunakan locale dinamis
        return date.toLocaleDateString(locale, options);
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'Invalid Date';
    }
};

const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null) return '0';
    // [i18n] Format angka bisa diatur lokalnya, default 'id-ID' atau 'en-US'
    return num.toLocaleString(); 
};

// ======================================================================================================
// Sub-Components
// ======================================================================================================

// Komponen Tabel Anggota Raid
const RaidMemberTable: React.FC<{ members: CocRaidMember[] | undefined | null, t: any }> = ({ members, t }) => {
    if (!members || members.length === 0) {
        return <p className="text-gray-400 font-sans italic text-sm my-3">{t.common.noData}</p>;
    }

    const sortedMembers = useMemo(() => {
        return [...(members || [])].sort((a, b) => (b.capitalResourcesLooted || 0) - (a.capitalResourcesLooted || 0));
    }, [members]);

    return (
        <div className="overflow-x-auto mt-4 rounded-md border border-coc-gold-dark/20">
            <table className="min-w-full divide-y divide-coc-gold-dark/30">
                <thead className="bg-black/30">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium font-clash text-coc-gold uppercase tracking-wider">{t.clanRaid.colRank}</th>
                        <th className="px-4 py-2 text-left text-xs font-medium font-clash text-coc-gold uppercase tracking-wider">{t.clanRaid.colPlayer}</th>
                        <th className="px-4 py-2 text-right text-xs font-medium font-clash text-coc-gold uppercase tracking-wider">{t.clanRaid.colAttacks}</th>
                        <th className="px-4 py-2 text-right text-xs font-medium font-clash text-coc-gold uppercase tracking-wider">{t.clanRaid.colLoot}</th>
                    </tr>
                </thead>
                <tbody className="bg-black/10 divide-y divide-coc-gold-dark/20">
                    {sortedMembers.map((member, index) => (
                        <tr key={member.tag || index} className="hover:bg-black/20 transition-colors">
                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-white">{index + 1}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 font-sans">{member.name || 'Unknown'}</td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 font-sans text-right">
                                {member.attacks ?? 'N/A'} / { (member.attackLimit ?? 0) + (member.bonusAttackLimit ?? 0)}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-300 font-sans text-right">{formatNumber(member.capitalResourcesLooted)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// Komponen Ringkasan Raid Aktif/Terbaru
const CurrentRaidSummary: React.FC<{ raid: CocRaidLog | null | undefined, t: any, locale: string }> = ({ raid, t, locale }) => {
    if (!raid) {
        return (
            <div className="p-6 text-center bg-coc-dark/30 rounded-lg border border-coc-gold-dark/20">
                <CoinsIcon className="h-10 w-10 text-coc-gold/50 mx-auto mb-2" />
                <p className="text-gray-400 font-sans">{t.clanRaid.noData}</p>
                <p className="text-xs text-gray-500 font-sans mt-1">{t.clanRaid.noDataDesc}</p>
            </div>
        );
    }

    return (
        <div className="bg-coc-dark/30 rounded-lg p-6 space-y-4 border border-coc-gold-dark/20">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h3 className="text-xl font-clash text-coc-gold flex items-center mb-2 sm:mb-0">
                    <CoinsIcon className="h-6 w-6 mr-2 flex-shrink-0" />
                    {t.clanRaid.currentRaidTitle}
                </h3>
                <span className={`text-xs font-sans px-2 py-1 rounded ${raid.state === 'ongoing' ? 'bg-green-600/70 text-white' : 'bg-gray-600/70 text-gray-200'}`}>
                    {raid.state === 'ongoing' ? t.clanRaid.statusOngoing : t.clanRaid.statusEnded}
                </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div className="bg-black/20 p-3 rounded border border-coc-gold-dark/10">
                    <p className="text-xs text-gray-400 font-clash uppercase flex items-center mb-1"><ClockIcon className="h-3 w-3 mr-1"/>{t.clanRaid.labelStart}</p>
                    <p className="font-sans text-white">{formatDate(raid.startTime, locale)}</p>
                </div>
                <div className="bg-black/20 p-3 rounded border border-coc-gold-dark/10">
                    <p className="text-xs text-gray-400 font-clash uppercase flex items-center mb-1"><ClockIcon className="h-3 w-3 mr-1"/>{t.clanRaid.labelEnd}</p>
                    <p className="font-sans text-white">{formatDate(raid.endTime, locale)}</p>
                </div>
                <div className="bg-black/20 p-3 rounded border border-coc-gold-dark/10">
                    <p className="text-xs text-gray-400 font-clash uppercase flex items-center mb-1"><CoinsIcon className="h-3 w-3 mr-1"/>{t.clanRaid.labelTotalLoot}</p>
                    <p className="font-sans text-white font-bold text-lg">{formatNumber(raid.capitalTotalLoot)}</p>
                </div>
                <div className="bg-black/20 p-3 rounded border border-coc-gold-dark/10">
                    <p className="text-xs text-gray-400 font-clash uppercase flex items-center mb-1"><SwordsIcon className="h-3 w-3 mr-1"/>{t.clanRaid.labelTotalAttacks}</p>
                    <p className="font-sans text-white">{formatNumber(raid.totalAttacks)}</p>
                </div>
                <div className="bg-black/20 p-3 rounded border border-coc-gold-dark/10">
                    <p className="text-xs text-gray-400 font-clash uppercase flex items-center mb-1"><ShieldIcon className="h-3 w-3 mr-1"/>{t.clanRaid.labelEnemyDistricts}</p>
                    <p className="font-sans text-white">{formatNumber(raid.enemyDistrictsDestroyed)}</p>
                </div>
                <div className="bg-black/20 p-3 rounded border border-coc-gold-dark/10">
                    <p className="text-xs text-gray-400 font-clash uppercase flex items-center mb-1"><TrophyIcon className="h-3 w-3 mr-1"/>{t.clanRaid.labelMedals}</p>
                    <p className="font-sans text-white">{formatNumber(raid.offensiveReward)} / {formatNumber(raid.defensiveReward)}</p>
                </div>
            </div>
            <div className="mt-6">
                <h4 className="text-md font-clash text-coc-gold mb-2 flex items-center"><UserIcon className="h-4 w-4 mr-1"/> {t.clanRaid.labelParticipants}</h4>
                <RaidMemberTable members={raid.members} t={t} />
            </div>
        </div>
    );
};

// ======================================================================================================
// Main Component: RaidTabContent
// ======================================================================================================

const RaidTabContent: React.FC<RaidTabContentProps> = ({ clan }) => {
    const { t, language } = useLanguage(); // [BARU]
    const locale = language === 'id' ? 'id-ID' : 'en-US';

    const {
        currentRaid,
        raidArchives,
        isLoading,
        isError: error,
        mutateRaid
    } = useManagedClanRaid(clan.id);
    
    const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
    const [sort, setSort] = useState<{ key: RaidSortKey, direction: SortDirection }>({ key: 'endTime', direction: 'desc' });

    const handleRefreshClick = useCallback(() => {
        mutateRaid(); 
    }, [mutateRaid]);

    const toggleArchiveDetails = (raidId: string) => {
        setSelectedArchiveId(prevId => (prevId === raidId ? null : raidId));
    };

    const handleSort = useCallback((key: RaidSortKey) => {
        setSort(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    }, []);

    const sortedArchives = useMemo(() => {
        const data = [...(raidArchives || [])]; 

        data.sort((a, b) => {
            let comparison = 0;
            const dir = sort.direction === 'asc' ? 1 : -1;

            let valueA: any;
            let valueB: any;

            if (sort.key === 'endTime') {
                valueA = a.endTime instanceof Date ? a.endTime.getTime() : new Date(a.endTime || 0).getTime();
                valueB = b.endTime instanceof Date ? b.endTime.getTime() : new Date(b.endTime || 0).getTime();
                comparison = valueA - valueB; 

                if (valueA === 0 && valueB === 0) comparison = 0;
                
            } else {
                valueA = a[sort.key === 'id' ? 'id' : sort.key] ?? 0;
                valueB = b[sort.key === 'id' ? 'id' : sort.key] ?? 0;

                if (typeof valueA === 'string' && typeof valueB === 'string') {
                    comparison = valueA.localeCompare(valueB);
                } else {
                    comparison = (valueA as number) - (valueB as number);
                }
                
                comparison *= dir;
            }

            if (sort.key === 'endTime' && sort.direction === 'desc') {
                return comparison * -1;
            } else if (sort.key === 'endTime' && sort.direction === 'asc') {
                return comparison;
            }
            
            return comparison;
        });

        return data;
    }, [raidArchives, sort]);

    const getSortIcon = (key: RaidSortKey) => {
        if (sort.key !== key) return null;
        return sort.direction === 'asc' ? <ArrowUpIcon className="h-3 w-3 ml-1" /> : <ArrowDownIcon className="h-3 w-3 ml-1" />;
    };

    const getHeaderClasses = (key: RaidSortKey, align: 'left' | 'center' | 'right') =>
        `py-3 px-4 text-${align} text-xs font-extrabold text-gray-400 uppercase tracking-wider cursor-pointer transition-colors hover:text-white ${
            sort.key === key ? 'text-white bg-gray-700/50' : ''
        }`;


    // --- RENDER UTAMA KOMPONEN ---
    
    if (isLoading) {
        return (
            <div className="p-8 text-center bg-coc-stone/40 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <Loader2Icon className="h-8 w-8 text-coc-gold animate-spin mb-3" />
                <p className="text-lg font-clash text-white">{t.common.loading}</p>
                <p className="text-sm text-gray-400 font-sans mt-1">{t.clanEsports.loadingTeams.replace('...', '')}</p> {/* Reusing suitable text or add generic */}
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="p-8 text-center bg-coc-red/20 rounded-lg min-h-[300px] flex flex-col justify-center items-center">
                <AlertTriangleIcon className="h-12 w-12 text-coc-red mb-3" />
                <p className="text-lg font-clash text-white">{t.common.error}</p>
                <p className="text-sm text-gray-400 font-sans mt-1 max-w-md mx-auto">{error.message}</p>
                <Button onClick={handleRefreshClick} variant="secondary" size="sm" className='mt-4'>
                    <RefreshCwIcon className='h-4 w-4 mr-2' /> {t.clanManage.reloadCache}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Tab & Tombol Refresh */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-2xl font-clash text-coc-gold flex items-center">
                    <CoinsIcon className="h-7 w-7 mr-2" />
                    {t.clanRaid.tabTitle}
                </h2>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleRefreshClick}
                    disabled={isLoading}
                    className="flex items-center w-full sm:w-auto"
                >
                    <RefreshCwIcon className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                    {isLoading ? t.clanEsports.btnSaving : t.clanRaid.btnRefresh} {/* Reusing 'Saving' for 'Loading...' effect if needed or add specific */}
                </Button>
            </div>

            {/* Bagian Raid Terbaru */}
            <section aria-labelledby="current-raid-heading">
                <h3 id="current-raid-heading" className="text-lg font-clash text-white mb-3 border-b border-coc-gold-dark/20 pb-1">
                    {t.clanRaid.currentRaidTitle}
                </h3>
                <CurrentRaidSummary raid={currentRaid} t={t} locale={locale} />
            </section>

            {/* Bagian Riwayat Raid */}
            <section aria-labelledby="raid-history-heading">
                <h3 id="raid-history-heading" className="text-lg font-clash text-white mb-3 border-b border-coc-gold-dark/20 pb-1">
                    {t.clanRaid.historyTitle}
                </h3>
                
                {!isLoading && (!sortedArchives || sortedArchives.length === 0) && (
                    <p className="text-gray-400 font-sans italic text-center py-4">{t.clanRaid.noHistory}</p>
                )}
                
                {sortedArchives && sortedArchives.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-gray-700">
                        <table className="min-w-full divide-y divide-gray-700 text-sm">
                            <thead className="bg-gray-800 sticky top-0">
                                <tr>
                                    <th 
                                        className={getHeaderClasses('endTime', 'left') + ' w-40'}
                                        onClick={() => handleSort('endTime')}
                                    >
                                        <div className="flex items-center">
                                            <ClockIcon className="h-3 w-3 mr-1"/> {t.clanRaid.statusEnded} {getSortIcon('endTime')}
                                        </div>
                                    </th>
                                    <th 
                                        className={getHeaderClasses('capitalTotalLoot', 'right') + ' w-40'}
                                        onClick={() => handleSort('capitalTotalLoot')}
                                    >
                                        <div className="flex items-center justify-end">
                                            {t.clanRaid.colLoot} {getSortIcon('capitalTotalLoot')}
                                        </div>
                                    </th>
                                    <th 
                                        className={getHeaderClasses('totalAttacks', 'center') + ' w-24'}
                                        onClick={() => handleSort('totalAttacks')}
                                    >
                                        <div className="flex items-center justify-center">
                                            Attacks {getSortIcon('totalAttacks')}
                                        </div>
                                    </th>
                                    <th className="py-3 px-4 text-center text-xs font-extrabold text-gray-400 uppercase tracking-wider w-20">
                                        Partisipasi
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {sortedArchives.map(raid => (
                                    <React.Fragment key={raid.id}>
                                        <tr
                                            className="bg-gray-800/70 hover:bg-gray-700/70 transition-colors cursor-pointer"
                                            onClick={() => toggleArchiveDetails(raid.id)}
                                        >
                                            <td className="py-3 px-4 text-sm font-semibold text-gray-300">
                                                {formatDate(raid.endTime, locale, false)}
                                            </td>
                                            <td className="py-3 px-4 text-right text-sm font-bold text-yellow-500">
                                                {formatNumber(raid.capitalTotalLoot)}
                                            </td>
                                            <td className="py-3 px-4 text-center text-sm font-semibold text-gray-300">
                                                {formatNumber(raid.totalAttacks)}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                {selectedArchiveId === raid.id ? 
                                                    <ChevronUpIcon className="w-4 h-4 text-yellow-500 mx-auto" /> : 
                                                    <ChevronDownIcon className="w-4 h-4 text-gray-400 mx-auto" />
                                                }
                                            </td>
                                        </tr>
                                        {selectedArchiveId === raid.id && (
                                            <tr className="bg-black/50">
                                                <td colSpan={4} className="p-4 border-t border-gray-700">
                                                    <h4 className="text-md font-clash text-coc-gold mb-2 flex items-center">
                                                        <UserIcon className="h-4 w-4 mr-1"/> {t.clanRaid.labelParticipants}
                                                    </h4>
                                                    <RaidMemberTable members={raid.members} t={t} />
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </div>
    );
};

export default RaidTabContent;