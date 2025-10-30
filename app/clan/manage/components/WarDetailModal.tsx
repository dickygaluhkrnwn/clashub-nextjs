import React, { useState, useEffect, useMemo, useCallback } from 'react';
// PERBAIKAN 4: Menambahkan ArrowUpIcon/ArrowDownIcon ke import icons
import { XIcon, StarIcon, AlertTriangleIcon, TrophyIcon, ShieldIcon, ArrowLeftIcon, ArrowRightIcon, ArrowUpIcon, ArrowDownIcon } from '@/app/components/icons';
// PERBAIKAN AKHIR: Menghapus CocWarLogClan dari import karena menyebabkan error eksport dan tidak digunakan langsung di komponen.
import { WarArchive, CocWarMember, CocWarAttack } from '@/lib/types'; 
import { getWarArchive } from '@/lib/firestore'; 
import Image from 'next/image';
import { getThImage } from '@/lib/th-utils'; 
import { Button } from '@/app/components/ui/Button';


// PERBAIKAN 2: Pindahkan interface props ke luar agar dapat ditemukan oleh React.FC
interface WarDetailModalProps {
    clanId: string;
    warId: string | null; // ID Arsip War yang akan dimuat
    onClose: () => void;
}

// =========================================================================
// HELPER: Tampilan Detail Serangan (Nested Row)
// =========================================================================

interface AttackRowProps {
    attack: CocWarAttack;
    // [PERBAIKAN] Data defender (TH level, Map Position) kini dicari via lookup table.
    defenderDetails: { thLevel: number; mapPosition: number; name: string } | null;
}

const AttackRow: React.FC<AttackRowProps> = ({ attack, defenderDetails }) => {
    // Tentukan warna berdasarkan bintang yang didapat
    const starColor = attack.stars === 3 ? 'text-coc-green' : attack.stars === 2 ? 'text-coc-yellow' : 'text-coc-red';
    
    // Memberikan default jika defenderDetails tidak ditemukan (seharusnya tidak terjadi pada data lengkap)
    const thLevel = defenderDetails?.thLevel || 1; 
    const mapPosition = defenderDetails?.mapPosition || 'N/A';
    const defenderName = defenderDetails?.name || 'Target Tidak Dikenal';

    // PERBAIKAN: Menambahkan null check untuk duration
    const duration = attack.duration || 0;

    return (
        <div className="flex items-center text-xs p-2 border-b border-coc-stone-light/10 last:border-b-0 transition-all hover:bg-coc-stone-light/10">
            {/* Target & TH Level */}
            <div className="w-1/4 flex items-center gap-2 font-semibold text-white/90">
                <Image
                    // PERBAIKAN: Menggunakan getThImage
                    src={getThImage(thLevel)} 
                    alt={`TH ${thLevel}`}
                    width={20}
                    height={20}
                    className="rounded-full flex-shrink-0"
                />
                <span className="hidden sm:inline">Map {mapPosition}</span> ({defenderName})
            </div>

            {/* Hasil Serangan */}
            <div className="w-1/4 text-center">
                <div className={`flex items-center justify-center font-bold ${starColor} gap-1`}>
                    {attack.stars} <StarIcon className={`w-3 h-3 ${starColor === 'text-coc-green' ? 'fill-coc-green' : starColor === 'text-coc-yellow' ? 'fill-coc-yellow' : 'fill-coc-red'}`} />
                </div>
            </div>

            {/* Persen Kerusakan */}
            <div className="w-1/4 text-center text-gray-300 font-mono">
                {attack.destructionPercentage}%
            </div>
            
            {/* Durasi */}
            <div className="w-1/4 text-right text-gray-400">
                {Math.floor(duration / 60)}m {duration % 60}s
            </div>
        </div>
    );
};


// =========================================================================
// HELPER: Tampilan Baris Pemain War
// =========================================================================

interface MemberRowProps {
    member: CocWarMember;
    isClanMember: boolean; // TRUE jika ini adalah anggota klan kita
    // [PERBAIKAN] Terima daftar anggota lawan untuk lookup defender details
    opponentMembersMap: Map<string, CocWarMember>;
}

const MemberRow: React.FC<MemberRowProps> = ({ member, isClanMember, opponentMembersMap }) => {
    // PERBAIKAN: Penanganan undefined
    const totalStars = member.attacks?.reduce((sum, attack) => sum + (attack.stars || 0), 0) || 0;
    const totalAttacks = member.attacks?.length || 0;
    // PERBAIKAN: Menggunakan getThImage
    const thLevelImage = getThImage(member.townhallLevel);
    
    // Memberikan warna berbeda untuk pemain klan kita dan lawan
    const textColor = isClanMember ? 'text-white' : 'text-coc-yellow-light';
    const bgClass = isClanMember ? 'bg-coc-stone/30 hover:bg-coc-stone/40' : 'bg-coc-stone-dark/30 hover:bg-coc-stone-dark/40';

    const [isExpanded, setIsExpanded] = useState(false);

    // [PERBAIKAN] Lookup defender details di AttackRow
    const renderAttackRows = () => member.attacks!.map((attack, index) => {
        // Cari detail defender di map lawan
        // CocWarAttack di API hanya punya defenderTag, kita harus lookup TH, MapPosition
        const defender = opponentMembersMap.get(attack.defenderTag || '');
        
        const defenderDetails = defender ? { 
            thLevel: defender.townhallLevel, 
            mapPosition: defender.mapPosition, 
            name: defender.name 
        } : null;

        return (
            <AttackRow 
                key={index} 
                attack={attack} 
                defenderDetails={defenderDetails}
            />
        );
    });

    return (
        <div className={`border-b border-coc-gold-dark/10 ${bgClass} transition-colors`}>
            {/* Baris Utama Pemain */}
            <div 
                className={`flex items-center p-3 cursor-pointer ${isExpanded ? 'border-b border-coc-gold-dark/20' : ''}`}
                onClick={() => setIsExpanded(!isExpanded)}
            >
                {/* Posisi Peta / ID */}
                <div className="w-1/12 text-center text-sm font-bold text-coc-gold/80 hidden sm:block">{member.mapPosition}</div>

                {/* TH Level & Nama */}
                <div className="w-4/12 flex items-center gap-2 flex-grow">
                    <Image
                        src={thLevelImage}
                        alt={`TH ${member.townhallLevel}`}
                        width={28}
                        height={28}
                        className="rounded-full flex-shrink-0"
                    />
                    <div className="flex flex-col text-left">
                        <span className={`font-semibold text-sm ${textColor}`}>{member.name}</span>
                        <span className="text-xs text-gray-500">{member.tag}</span>
                    </div>
                </div>

                {/* Total Bintang */}
                <div className="w-2/12 text-center text-sm font-bold flex items-center justify-center gap-1">
                    <StarIcon className="w-4 h-4 fill-coc-gold" /> {totalStars}
                </div>

                {/* Total Serangan */}
                <div className="w-2/12 text-center text-sm text-gray-300">
                    {totalAttacks} {totalAttacks > 1 ? 'Serangan' : 'Serangan'}
                </div>
                
                {/* Tanda Detail (Panah) */}
                <div className="w-1/12 text-center text-gray-400">
                    {totalAttacks > 0 && (isExpanded ? <ArrowUpIcon className='h-4 w-4 mx-auto' /> : <ArrowDownIcon className='h-4 w-4 mx-auto' />)}
                </div>
            </div>

            {/* Detail Serangan (Expanded Content) */}
            {totalAttacks > 0 && isExpanded && (
                <div className="p-2 pt-0 sm:p-4 sm:pt-0">
                    <div className="border border-coc-gold-dark/20 rounded-lg overflow-hidden bg-coc-stone-dark">
                        {renderAttackRows()}
                    </div>
                </div>
            )}
        </div>
    );
};


// =========================================================================
// KOMPONEN UTAMA: WarDetailModal
// =========================================================================

const WarDetailModal: React.FC<WarDetailModalProps> = ({ clanId, warId, onClose }) => {
    // State untuk memuat data War Archive
    const [warData, setWarData] = useState<WarArchive | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const isOpen = !!warId;

    // Reset state saat warId berubah atau modal dibuka/ditutup
    useEffect(() => {
        if (!warId) {
            setWarData(null);
            setError(null);
            setIsLoading(false);
            return;
        }

        const fetchWarDetail = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                // Catatan: getWarArchive sudah diimplementasikan di lib/firestore.ts
                const data = await getWarArchive(clanId, warId);
                
                if (data?.hasDetails) {
                    // PERBAIKAN: Mengonversi Date object dari Firestore Timestamp di client
                    const cleanedData: WarArchive = {
                        ...data,
                        warEndTime: data.warEndTime instanceof Date ? data.warEndTime : new Date(data.warEndTime),
                        // startTime dan endTime dari CocWarLog juga mungkin perlu dikonversi
                        startTime: data.startTime ? new Date(data.startTime) : undefined,
                        endTime: data.endTime ? new Date(data.endTime) : undefined,
                    };

                    setWarData(cleanedData);
                } else if (data && !data.hasDetails) {
                    setError("Detail serangan tidak tersedia untuk arsip ini (Hanya ringkasan).");
                } else {
                    setError("Arsip perang tidak ditemukan di database.");
                }

            } catch (err) {
                console.error("Failed to fetch war archive:", err);
                setError("Gagal memuat rincian perang dari database.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWarDetail();
    }, [clanId, warId]);

    // [PERBAIKAN] Buat Map untuk lookup defender details yang cepat
    const opponentMembersMap = useMemo(() => {
        const map = new Map<string, CocWarMember>();
        if (warData?.opponent.members) {
            // PERBAIKAN 3: Menambahkan tipe eksplisit ke sort
            warData.opponent.members.sort((a: CocWarMember, b: CocWarMember) => a.mapPosition - b.mapPosition).forEach((member: CocWarMember) => {
                if (member.tag) {
                    map.set(member.tag, member);
                }
            });
        }
        return map;
    }, [warData]);

    // PERBAIKAN 5 & 6: Menambahkan tipe eksplisit ke sort
    const ourMembers = useMemo(() => warData?.clan.members?.sort((a: CocWarMember, b: CocWarMember) => a.mapPosition - b.mapPosition) || [], [warData]);
    const opponentMembers = useMemo(() => warData?.opponent.members?.sort((a: CocWarMember, b: CocWarMember) => a.mapPosition - b.mapPosition) || [], [warData]);
    
    // [PERBAIKAN] Menggunakan Modal murni React/Tailwind
    if (!isOpen) return null;

    return (
        // Modal Container (fixed position)
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm transition-opacity duration-300" 
             aria-modal="true" role="dialog" 
             onClick={onClose} // Tutup modal saat klik backdrop
        >
            {/* Konten Modal (Centered) */}
            <div className="flex min-h-full items-center justify-center p-4 text-center">
                {/* Panel Modal */}
                <div 
                    className="w-full max-w-6xl transform overflow-hidden rounded-2xl bg-coc-stone p-6 text-left align-middle shadow-xl transition-all duration-300 border border-coc-gold-dark/50"
                    onClick={(e) => e.stopPropagation()} // Cegah penutupan saat klik di dalam modal
                >
                    <div className="space-y-6">
                        
                        {/* Header Modal */}
                        <h3 className="text-2xl font-clash font-bold leading-6 text-white border-b border-coc-gold-dark/30 pb-3 mb-4 flex justify-between items-center">
                            Rincian War Classic: {warData?.clan.name || '...'} vs {warData?.opponent.name || '...'}
                            <Button
                                // PERBAIKAN 4: Ganti size="icon" dengan size="sm" dan sesuaikan padding class
                                size="sm"
                                variant="tertiary"
                                className="inline-flex justify-center rounded-full text-white bg-coc-stone-light p-2 hover:bg-coc-red focus:outline-none focus-visible:ring-2 focus-visible:ring-coc-red focus-visible:ring-offset-2"
                                onClick={onClose}
                            >
                                <XIcon className="h-5 w-5" aria-hidden="true" />
                            </Button>
                        </h3>

                        {isLoading && (
                            <div className="py-20 text-center">
                                <svg className="animate-spin mx-auto h-8 w-8 text-coc-gold" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                <p className="mt-4 text-white">Memuat data perang...</p>
                            </div>
                        )}

                        {error && (
                            <div className="py-12 text-center bg-coc-red/20 rounded-lg">
                                <AlertTriangleIcon className="h-8 w-8 text-coc-red mx-auto" />
                                <p className="mt-2 text-coc-red font-semibold">{error}</p>
                                <Button onClick={onClose} variant="secondary" size="sm" className='mt-4'>Tutup</Button>
                            </div>
                        )}
                        
                        {warData && !isLoading && !error && (
                            <div className="space-y-6">
                                {/* War Summary Card */}
                                <div className="bg-coc-stone-dark/50 p-4 rounded-lg border border-coc-gold-dark/30">
                                    <div className="flex justify-between items-center text-sm mb-3">
                                        <p className="text-gray-400 font-clash">UKURAN: {warData.teamSize}v{warData.teamSize}</p>
                                        <p className="text-gray-400 font-clash">HASIL: <span className={`font-bold ${warData.result === 'win' ? 'text-coc-green' : warData.result === 'lose' ? 'text-coc-red' : 'text-coc-blue'}`}>{warData.result?.toUpperCase() || 'N/A'}</span></p>
                                    </div>
                                    
                                    {/* Scoreboard */}
                                    <div className="flex text-center border border-coc-gold-dark/50 rounded-lg divide-x divide-coc-gold-dark/50 overflow-hidden">
                                        
                                        {/* Klan Kita */}
                                        <div className="w-1/2 p-4 bg-coc-stone-light">
                                            <TrophyIcon className="h-6 w-6 text-coc-gold mx-auto mb-2" />
                                            <p className="text-white font-bold text-lg mb-1">{warData.clan.name}</p>
                                            <p className="text-xs text-gray-400">Stars: <span className="text-coc-gold">{warData.clan.stars}</span> | Destruction: <span className="text-white font-mono">{warData.clan.destructionPercentage.toFixed(2)}%</span></p>
                                        </div>

                                        {/* Klan Lawan */}
                                        <div className="w-1/2 p-4 bg-coc-stone-dark">
                                            <ShieldIcon className="h-6 w-6 text-gray-500 mx-auto mb-2" />
                                            <p className="text-white font-bold text-lg mb-1">{warData.opponent.name}</p>
                                            <p className="text-xs text-gray-400">Stars: <span className="text-coc-red">{warData.opponent.stars}</span> | Destruction: <span className="text-white font-mono">{warData.opponent.destructionPercentage.toFixed(2)}%</span></p>
                                        </div>
                                    </div>

                                    <p className="mt-4 text-xs text-center text-gray-500">
                                        Selesai: {warData.warEndTime.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {/* Player Detail Comparison */}
                                <div className="flex flex-col lg:flex-row gap-6">
                                    
                                    {/* Tim Kita */}
                                    <div className="lg:w-1/2 w-full border border-coc-gold/20 rounded-lg overflow-hidden bg-coc-stone-dark shadow-xl">
                                        <h4 className="font-clash text-lg text-white p-3 bg-coc-gold/10 flex items-center justify-center gap-2">
                                            <ArrowLeftIcon className='h-4 w-4' /> Tim {warData.clan.name}
                                        </h4>
                                        <div className="divide-y divide-coc-gold-dark/10 max-h-[60vh] overflow-y-auto">
                                            {ourMembers.map((member: CocWarMember) => (
                                                <MemberRow key={member.tag} member={member} isClanMember={true} opponentMembersMap={opponentMembersMap} />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Tim Lawan */}
                                    <div className="lg:w-1/2 w-full border border-coc-red/20 rounded-lg overflow-hidden bg-coc-stone-dark shadow-xl">
                                        <h4 className="font-clash text-lg text-white p-3 bg-coc-red/10 flex items-center justify-center gap-2">
                                            Tim {warData.opponent.name} <ArrowRightIcon className='h-4 w-4' />
                                        </h4>
                                        <div className="divide-y divide-coc-gold-dark/10 max-h-[60vh] overflow-y-auto">
                                            {opponentMembers.map((member: CocWarMember) => (
                                                <MemberRow key={member.tag} member={member} isClanMember={false} opponentMembersMap={opponentMembersMap} />
                                            ))}
                                        </div>
                                    </div>

                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WarDetailModal;
